const mongoose = require("mongoose");

const OrderItemSchema = new mongoose.Schema(
  {
    product_id: {
      type: mongoose.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    variant_id: {
      type: mongoose.Types.ObjectId,
      required: false,
    },
    product_name: {
      type: String,
      required: true,
    },
    variant_attributes: {
      type: Map,
      of: String,
      required: false,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    unit_price: {
      type: Number,
      required: true,
    },
    total_price: {
      type: Number,
      required: true,
    },
    reserved_quantity: {
      type: Number,
      default: 0,
      min: 0,
    },
    fulfilled_quantity: {
      type: Number,
      default: 0,
      min: 0,
    },
    cancelled_quantity: {
      type: Number,
      default: 0,
      min: 0,
    },
    item_status: {
      type: String,
      enum: ["pending", "reserved", "partially_fulfilled", "fulfilled", "cancelled"],
      default: "pending",
    },
    stock_reservation_id: {
      type: String,
      required: false,
    },
    notes: {
      type: String,
      required: false,
    },
  },
  { _id: true }
);

const OrderSchema = new mongoose.Schema(
  {
    tenant_id: {
      type: mongoose.Types.ObjectId,
      ref: "users",
      required: true,
    },
    order_number: {
      type: String,
      required: true,
      unique: true,
    },
    customer: {
      name: {
        type: String,
        required: true,
      },
      email: {
        type: String,
        required: false,
      },
      phone: {
        type: String,
        required: false,
      },
    },
    shipping_address: {
      street: { type: String, required: false },
      city: { type: String, required: false },
      state: { type: String, required: false },
      postal_code: { type: String, required: false },
      country: { type: String, required: false },
    },
    billing_address: {
      street: { type: String, required: false },
      city: { type: String, required: false },
      state: { type: String, required: false },
      postal_code: { type: String, required: false },
      country: { type: String, required: false },
    },
    items: [OrderItemSchema],
    subtotal: {
      type: Number,
      required: true,
      default: 0,
    },
    tax_amount: {
      type: Number,
      required: false,
      default: 0,
    },
    shipping_amount: {
      type: Number,
      required: false,
      default: 0,
    },
    discount_amount: {
      type: Number,
      required: false,
      default: 0,
    },
    total_amount: {
      type: Number,
      required: true,
      default: 0,
    },
    currency: {
      type: String,
      default: "USD",
    },
    order_status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "processing",
        "partially_fulfilled",
        "fulfilled",
        "cancelled",
        "refunded",
        "failed",
      ],
      default: "pending",
    },
    payment_status: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded", "partially_refunded"],
      default: "pending",
    },
    payment_method: {
      type: String,
      required: false,
    },
    transaction_id: {
      type: String,
      required: false,
    },
    stock_reservation_expiry: {
      type: Date,
      required: false,
    },
    notes: {
      type: String,
      required: false,
    },
    metadata: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      required: false,
    },
    version: {
      type: Number,
      default: 1,
    },
    fulfilled_at: {
      type: Date,
      required: false,
    },
    cancelled_at: {
      type: Date,
      required: false,
    },
    cancellation_reason: {
      type: String,
      required: false,
    },
    created_by: {
      type: mongoose.Types.ObjectId,
      ref: "users",
      required: false,
    },
  },
  { timestamps: true }
);

// Indexes for efficient querying
OrderSchema.index({ tenant_id: 1, createdAt: -1 });
OrderSchema.index({ tenant_id: 1, order_status: 1 });
OrderSchema.index({ order_number: 1 });
OrderSchema.index({ "customer.email": 1 });
OrderSchema.index({ stock_reservation_expiry: 1 });

// Pre-save hook to generate order number
OrderSchema.pre("save", async function (next) {
  if (!this.order_number) {
    const count = await mongoose.model("Order").countDocuments();
    this.order_number = `ORD-${Date.now()}-${(count + 1).toString().padStart(6, "0")}`;
  }
  next();
});

// Virtual for checking if all items are fulfilled
OrderSchema.virtual("all_items_fulfilled").get(function () {
  return this.items.every(
    (item) =>
      item.fulfilled_quantity >= item.reserved_quantity ||
      item.item_status === "fulfilled"
  );
});

// Virtual for checking if order can be cancelled
OrderSchema.virtual("can_be_cancelled").get(function () {
  return ["pending", "confirmed", "processing"].includes(this.order_status);
});

// Virtual for reserved stock total
OrderSchema.virtual("total_reserved_items").get(function () {
  return this.items.reduce((sum, item) => sum + item.reserved_quantity, 0);
});

// Method to check stock availability for all items
OrderSchema.methods.checkStockAvailability = async function () {
  const { Product } = require("../models");
  const results = [];

  for (const item of this.items) {
    let currentStock = 0;

    if (item.variant_id) {
      const product = await Product.findById(item.product_id);
      if (product) {
        const variant = product.variants.id(item.variant_id);
        currentStock = variant ? variant.stock || 0 : 0;
      }
    } else {
      // For products without variants, we'd need a different approach
      currentStock = 0;
    }

    const neededQuantity = item.quantity - item.reserved_quantity;
    const isAvailable = currentStock >= neededQuantity;

    results.push({
      item_id: item._id,
      product_id: item.product_id,
      variant_id: item.variant_id,
      needed_quantity: neededQuantity,
      current_stock: currentStock,
      is_available: isAvailable,
    });
  }

  return results;
};

// Static method to generate order number
OrderSchema.statics.generateOrderNumber = async function () {
  const count = await this.countDocuments();
  return `ORD-${Date.now()}-${(count + 1).toString().padStart(6, "0")}`;
};

// Method to calculate totals
OrderSchema.methods.calculateTotals = function () {
  this.subtotal = this.items.reduce((sum, item) => sum + item.total_price, 0);
  this.total_amount = this.subtotal + this.tax_amount + this.shipping_amount - this.discount_amount;
  return this;
};

const Order = mongoose.model("Order", OrderSchema);

module.exports = Order;

