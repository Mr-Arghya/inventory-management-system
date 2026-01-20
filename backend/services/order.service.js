const mongoose = require("mongoose");
const { Types } = require("mongoose");
const { Order, Product, StockMovement } = require("../models");

const ORDER_CONFIG = {
  STOCK_RESERVATION_MINUTES: 15, // Stock reserved for 15 minutes
  MAX_RETRIES: 3,
  RETRY_DELAY_MS: 100,
};

const OrderService = {
  /**
   * Create a new order with stock reservation
   * Uses MongoDB transactions for atomic operations
   */
  async createOrder(orderData) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const {
        tenant_id,
        customer,
        shipping_address,
        billing_address,
        items,
        tax_amount = 0,
        shipping_amount = 0,
        discount_amount = 0,
        payment_method,
        created_by,
        notes,
        currency = "USD",
      } = orderData;

      const processedItems = [];
      let subtotal = 0;

      for (const item of items) {
        const product = await Product.findById(item.product_id).session(session);
        
        if (!product) {
          throw new Error(`Product not found: ${item.product_id}`);
        }

        let unitPrice = product.price;
        let variantAttributes = {};

        if (item.variant_id) {
          const variant = product.variants.id(item.variant_id);
          if (!variant) {
            throw new Error(`Variant not found: ${item.variant_id}`);
          }
          
          // Check stock availability
          if (variant.stock < item.quantity) {
            throw new Error(
              `Insufficient stock for product ${product.name}. ` +
              `Requested: ${item.quantity}, Available: ${variant.stock}`
            );
          }

          unitPrice = variant.price || product.price;
          variantAttributes = {
            size: variant.attributes.size,
            color: variant.attributes.color,
          };

          // Reserve stock
          const previousStock = variant.stock;
          const newStock = previousStock - item.quantity;

          await Product.updateOne(
            { _id: product._id, "variants._id": item.variant_id },
            { $set: { "variants.$.stock": newStock } },
            { session }
          );

          // Record stock movement
          await StockMovement.create(
            [
              {
                tenant_id,
                product_id: product._id,
                variant_id: item.variant_id,
                movement_type: "sale",
                quantity: item.quantity,
                previous_stock: previousStock,
                new_stock: newStock,
                reason: `Order stock reservation - ${item.quantity} units`,
                reference_type: "order",
                created_by,
              },
            ],
            { session }
          );
        } else {
          // For products without variants
          throw new Error("Products must have a variant selected");
        }

        const itemTotal = unitPrice * item.quantity;
        subtotal += itemTotal;

        processedItems.push({
          product_id: product._id,
          variant_id: item.variant_id,
          product_name: product.name,
          variant_attributes: variantAttributes,
          quantity: item.quantity,
          unit_price: unitPrice,
          total_price: itemTotal,
          reserved_quantity: item.quantity,
          fulfilled_quantity: 0,
          cancelled_quantity: 0,
          item_status: "reserved",
          notes: item.notes || null,
        });
      }

      const total_amount = subtotal + tax_amount + shipping_amount - discount_amount;

      // Set stock reservation expiry
      const stockReservationExpiry = new Date(
        Date.now() + ORDER_CONFIG.STOCK_RESERVATION_MINUTES * 60 * 1000
      );

      // Create the order
      const order = await Order.create(
        [
          {
            tenant_id,
            order_number: await Order.generateOrderNumber(),
            customer,
            shipping_address,
            billing_address,
            items: processedItems,
            subtotal,
            tax_amount,
            shipping_amount,
            discount_amount,
            total_amount,
            currency,
            order_status: "confirmed",
            payment_status: "pending",
            payment_method,
            stock_reservation_expiry: stockReservationExpiry,
            notes,
            created_by,
          },
        ],
        { session }
      );

      await session.commitTransaction();

      return {
        order: order[0],
        message: "Order created successfully with stock reservation",
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  },

  /**
   * Get order by ID
   */
  async getOrderById(orderId, tenantId) {
    const order = await Order.findOne({
      _id: new Types.ObjectId(orderId),
      tenant_id: new Types.ObjectId(tenantId),
    }).populate("items.product_id");

    if (!order) {
      throw new Error("Order not found");
    }

    return order;
  },

  /**
   * List orders with filters and pagination
   */
  async listOrders({
    tenantId,
    filter = {},
    sort = { createdAt: -1 },
    page = 1,
    limit = 10,
  }) {
    const skip = (page - 1) * limit;

    const matchFilter = {
      tenant_id: new Types.ObjectId(tenantId),
      ...filter,
    };

    const orders = await Order.aggregate([
      { $match: matchFilter },
      { $sort: sort },
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from: "users",
          localField: "created_by",
          foreignField: "_id",
          as: "createdByUser",
        },
      },
      {
        $unwind: {
          path: "$createdByUser",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 1,
          order_number: 1,
          customer: 1,
          order_status: 1,
          payment_status: 1,
          total_amount: 1,
          currency: 1,
          createdAt: 1,
          items: 1,
          "createdByUser.name": 1,
          "createdByUser.email": 1,
        },
      },
    ]);

    const total = await Order.countDocuments(matchFilter);

    return {
      orders,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Cancel an order and release reserved stock
   */
  async cancelOrder(orderId, tenantId, cancellationReason = null) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const order = await Order.findOne({
        _id: new Types.ObjectId(orderId),
        tenant_id: new Types.ObjectId(tenantId),
      }).session(session);

      if (!order) {
        throw new Error("Order not found");
      }

      // Check if order can be cancelled
      if (!order.can_be_cancelled) {
        throw new Error(`Order cannot be cancelled. Current status: ${order.order_status}`);
      }

      // Release stock for each item
      for (const item of order.items) {
        if (item.reserved_quantity > 0) {
          const product = await Product.findById(item.product_id).session(session);
          
          if (product && item.variant_id) {
            const variant = product.variants.id(item.variant_id);
            if (variant) {
              const previousStock = variant.stock;
              const newStock = previousStock + item.reserved_quantity;

              await Product.updateOne(
                { _id: product._id, "variants._id": item.variant_id },
                { $set: { "variants.$.stock": newStock } },
                { session }
              );

              // Record stock movement
              await StockMovement.create(
                [
                  {
                    tenant_id: order.tenant_id,
                    product_id: product._id,
                    variant_id: item.variant_id,
                    movement_type: "return",
                    quantity: item.reserved_quantity,
                    previous_stock: previousStock,
                    new_stock: newStock,
                    reason: `Order cancellation - releasing reserved stock`,
                    reference_type: "order",
                    reference_id: order._id.toString(),
                    created_by: order.created_by,
                  },
                ],
                { session }
              );
            }
          }
        }

        // Update item status
        item.cancelled_quantity = item.reserved_quantity;
        item.reserved_quantity = 0;
        item.item_status = "cancelled";
      }

      // Update order status
      order.order_status = "cancelled";
      order.cancelled_at = new Date();
      order.cancellation_reason = cancellationReason;
      order.version += 1;

      await order.save({ session });

      await session.commitTransaction();

      return {
        order,
        message: "Order cancelled successfully and stock released",
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  },

  /**
   * Fulfill an order (full or partial)
   */
  async fulfillOrder(orderId, tenantId, fulfillmentData) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const order = await Order.findOne({
        _id: new Types.ObjectId(orderId),
        tenant_id: new Types.ObjectId(tenantId),
      }).session(session);

      if (!order) {
        throw new Error("Order not found");
      }

      // Check if order can be fulfilled
      if (["cancelled", "fulfilled", "refunded"].includes(order.order_status)) {
        throw new Error(`Order cannot be fulfilled. Current status: ${order.order_status}`);
      }

      const { item_fulfillments = [], notes } = fulfillmentData;
      let allItemsFulfilled = true;

      if (item_fulfillments.length === 0) {
        // Full order fulfillment
        for (const item of order.items) {
          const remainingQuantity = item.reserved_quantity - item.fulfilled_quantity;
          if (remainingQuantity > 0) {
            item.fulfilled_quantity += remainingQuantity;
            
            if (item.fulfilled_quantity >= item.reserved_quantity) {
              item.item_status = "fulfilled";
            } else {
              item.item_status = "partially_fulfilled";
              allItemsFulfilled = false;
            }
          }
        }

        if (allItemsFulfilled) {
          order.order_status = "fulfilled";
          order.fulfilled_at = new Date();
        } else {
          order.order_status = "partially_fulfilled";
        }
      } else {
        // Partial fulfillment by items
        for (const fulfillment of item_fulfillments) {
          const item = order.items.id(fulfillment.item_id);
          
          if (!item) {
            throw new Error(`Order item not found: ${fulfillment.item_id}`);
          }

          const maxFulfillable = item.reserved_quantity - item.fulfilled_quantity;
          const quantityToFulfill = Math.min(fulfillment.quantity, maxFulfillable);

          if (quantityToFulfill <= 0) {
            throw new Error(`No quantity available to fulfill for item: ${item.product_name}`);
          }

          item.fulfilled_quantity += quantityToFulfill;

          if (item.fulfilled_quantity >= item.reserved_quantity) {
            item.item_status = "fulfilled";
          } else if (item.fulfilled_quantity > 0) {
            item.item_status = "partially_fulfilled";
            allItemsFulfilled = false;
          }
        }

        // Check if all items are fulfilled
        const allItemsAreFulfilled = order.items.every(
          (item) => item.item_status === "fulfilled"
        );

        if (allItemsAreFulfilled) {
          order.order_status = "fulfilled";
          order.fulfilled_at = new Date();
        } else {
          order.order_status = "partially_fulfilled";
        }
      }

      if (notes) {
        order.notes = order.notes 
          ? `${order.notes}\n${notes}` 
          : notes;
      }

      order.version += 1;
      await order.save({ session });

      await session.commitTransaction();

      return {
        order,
        message: allItemsFulfilled 
          ? "Order fully fulfilled successfully" 
          : "Order partially fulfilled successfully",
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  },

  /**
   * Fulfill a specific item in an order
   */
  async fulfillOrderItem(orderId, itemId, tenantId, quantity, notes = null) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const order = await Order.findOne({
        _id: new Types.ObjectId(orderId),
        tenant_id: new Types.ObjectId(tenantId),
      }).session(session);

      if (!order) {
        throw new Error("Order not found");
      }

      if (["cancelled", "fulfilled", "refunded"].includes(order.order_status)) {
        throw new Error(`Order cannot be modified. Current status: ${order.order_status}`);
      }

      const item = order.items.id(itemId);
      
      if (!item) {
        throw new Error("Order item not found");
      }

      const maxFulfillable = item.reserved_quantity - item.fulfilled_quantity;
      const quantityToFulfill = Math.min(quantity, maxFulfillable);

      if (quantityToFulfill <= 0) {
        throw new Error("No quantity available to fulfill");
      }

      item.fulfilled_quantity += quantityToFulfill;

      if (item.fulfilled_quantity >= item.reserved_quantity) {
        item.item_status = "fulfilled";
      } else {
        item.item_status = "partially_fulfilled";
      }

      // Check if all items are now fulfilled
      const allItemsFulfilled = order.items.every(
        (i) => i.item_status === "fulfilled"
      );

      if (allItemsFulfilled) {
        order.order_status = "fulfilled";
        order.fulfilled_at = new Date();
      } else {
        order.order_status = "partially_fulfilled";
      }

      if (notes) {
        item.notes = item.notes 
          ? `${item.notes}\n${notes}` 
          : notes;
      }

      order.version += 1;
      await order.save({ session });

      await session.commitTransaction();

      return {
        order,
        item,
        message: "Item fulfilled successfully",
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  },

  /**
   * Update order status
   */
  async updateOrderStatus(orderId, tenantId, newStatus) {
    const validStatuses = [
      "pending",
      "confirmed",
      "processing",
      "partially_fulfilled",
      "fulfilled",
      "cancelled",
      "refunded",
      "failed",
    ];

    if (!validStatuses.includes(newStatus)) {
      throw new Error(`Invalid order status: ${newStatus}`);
    }

    const order = await Order.findOneAndUpdate(
      {
        _id: new Types.ObjectId(orderId),
        tenant_id: new Types.ObjectId(tenantId),
      },
      {
        order_status: newStatus,
        version: { $inc: 1 },
      },
      { new: true }
    );

    if (!order) {
      throw new Error("Order not found");
    }

    return order;
  },

  /**
   * Update payment status
   */
  async updatePaymentStatus(orderId, tenantId, paymentStatus, paymentDetails = {}) {
    const order = await Order.findOneAndUpdate(
      {
        _id: new Types.ObjectId(orderId),
        tenant_id: new Types.ObjectId(tenantId),
      },
      {
        payment_status: paymentStatus,
        ...(paymentDetails.transaction_id && { transaction_id: paymentDetails.transaction_id }),
        ...(paymentDetails.payment_method && { payment_method: paymentDetails.payment_method }),
        version: { $inc: 1 },
      },
      { new: true }
    );

    if (!order) {
      throw new Error("Order not found");
    }

    return order;
  },

  /**
   * Check and release expired stock reservations
   * Should be called by a cron job
   */
  async releaseExpiredReservations() {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const expiredOrders = await Order.find({
        order_status: { $in: ["pending", "confirmed"] },
        stock_reservation_expiry: { $lt: new Date() },
      }).session(session);

      const results = [];

      for (const order of expiredOrders) {
        for (const item of order.items) {
          if (item.reserved_quantity > 0) {
            const product = await Product.findById(item.product_id).session(session);
            
            if (product && item.variant_id) {
              const variant = product.variants.id(item.variant_id);
              if (variant) {
                const previousStock = variant.stock;
                const newStock = previousStock + item.reserved_quantity;

                await Product.updateOne(
                  { _id: product._id, "variants._id": item.variant_id },
                  { $set: { "variants.$.stock": newStock } },
                  { session }
                );

                await StockMovement.create(
                  [
                    {
                      tenant_id: order.tenant_id,
                      product_id: product._id,
                      variant_id: item.variant_id,
                      movement_type: "return",
                      quantity: item.reserved_quantity,
                      previous_stock: previousStock,
                      new_stock: newStock,
                      reason: "Stock reservation expired",
                      reference_type: "order",
                      reference_id: order._id.toString(),
                      created_by: order.created_by,
                    },
                  ],
                  { session }
                );
              }
            }

            item.cancelled_quantity = item.reserved_quantity;
            item.reserved_quantity = 0;
            item.item_status = "cancelled";
          }
        }

        order.order_status = "cancelled";
        order.cancelled_at = new Date();
        order.cancellation_reason = "Stock reservation expired";
        order.version += 1;
        
        await order.save({ session });

        results.push({
          order_id: order._id,
          order_number: order.order_number,
          message: "Expired reservation released",
        });
      }

      await session.commitTransaction();

      return {
        processed_count: results.length,
        results,
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  },

  /**
   * Get order statistics
   */
  async getOrderStatistics(tenantId, dateFilter = {}) {
    const matchFilter = {
      tenant_id: new Types.ObjectId(tenantId),
      ...dateFilter,
    };

    const statistics = await Order.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: "$order_status",
          count: { $sum: 1 },
          total_amount: { $sum: "$total_amount" },
        },
      },
    ]);

    const result = {
      total_orders: 0,
      total_revenue: 0,
      by_status: {},
    };

    for (const stat of statistics) {
      result.by_status[stat._id] = {
        count: stat.count,
        total_amount: stat.total_amount,
      };
      result.total_orders += stat.count;
      if (["fulfilled", "partially_fulfilled"].includes(stat._id)) {
        result.total_revenue += stat.total_amount;
      }
    }

    return result;
  },
};

module.exports = OrderService;

