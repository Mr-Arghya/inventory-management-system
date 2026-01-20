const { Types } = require("mongoose");
const { Product, Order, StockMovement } = require("../models");

const DashboardService = {
  async getDashboardData(tenantId) {
    const tenantObjectId = new Types.ObjectId(tenantId);
    const [
      inventoryValuation,
      totalProducts,
      lowStockItems,
      topSellingProducts,
      stockMovementData,
    ] = await Promise.all([
      this.getInventoryValuation(tenantObjectId),
      this.getTotalProducts(tenantObjectId),
      this.getLowStockItems(tenantObjectId),
      this.getTopSellingProducts(tenantObjectId),
      this.getStockMovementData(tenantObjectId),
    ]);

    return {
      inventoryValuation,
      totalProducts,
      lowStockItems,
      topSellingProducts,
      stockMovementData,
    };
  },

  async getInventoryValuation(tenantId) {
    const result = await Product.aggregate([
      {
        $match: {
          tenant_id: tenantId,
          is_deleted: false,
        },
      },
      { $unwind: "$variants" },
      {
        $group: {
          _id: null,
          totalValuation: {
            $sum: {
              $multiply: ["$variants.stock", "$variants.cost"],
            },
          },
        },
      },
    ]);

    return result[0]?.totalValuation || 0;
  },
  async getTotalProducts(tenantId) {
    const count = await Product.countDocuments({
      tenant_id: tenantId,
      is_deleted: false,
    });
    return count;
  },

  async getLowStockItems(tenantId) {
    console.log(tenantId);
    const products = await Product.aggregate([
      {
        $match: {
          tenant_id: tenantId,
          is_deleted: false,
        },
      },
      { $unwind: "$variants" },
      {
        $match: {
          "variants.stock": {
            $lte: 10,
          },
        },
      },
      {
        $lookup: {
          from: "orders",
          let: {
            productId: "$_id",
            variantId: "$variants._id",
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$tenant_id", tenantId] },
                    { $eq: ["$order_status", "pending"] },
                  ],
                },
              },
            },
            { $unwind: "$items" },
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$items.product_id", "$$productId"] },
                    { $eq: ["$items.variant_id", "$$variantId"] },
                  ],
                },
              },
            },
            {
              $group: {
                _id: null,
                pendingPOQuantity: { $sum: "$items.quantity" },
              },
            },
          ],
          as: "pendingOrders",
        },
      },
      {
        $addFields: {
          pendingPOQuantity: {
            $ifNull: [
              { $arrayElemAt: ["$pendingOrders.pendingPOQuantity", 0] },
              0,
            ],
          },
        },
      },
      {
        $project: {
          _id: 0,
          variantId: { $toString: "$variants._id" },
          productName: "$name",
          variantSku: "$variants.sku",
          currentStock: "$variants.stock",
          threshold: "$variants.low_threshold",
          pendingPOQuantity: 1,
          isSuppressed: {
            $cond: [{ $lt: ["$variants.stock", 5] }, true, false],
          },
        },
      },
      { $sort: { currentStock: 1 } },
    ]);

    return products;
  },

  async getTopSellingProducts(tenantId) {
    const topProducts = await Order.aggregate([
      {
        $match: {
          tenant_id: tenantId,
          order_status: { $in: ["fulfilled", "partially_fulfilled"] },
        },
      },
      { $unwind: "$items" },
      {
        $group: {
          _id: {
            productId: "$items.product_id",
            productName: "$items.product_name",
          },
          totalSold: { $sum: "$items.quantity" },
          revenue: { $sum: "$items.total_price" },
        },
      },
      {
        $project: {
          _id: 0,
          productId: { $toString: "$_id.productId" },
          productName: "$_id.productName",
          totalSold: 1,
          revenue: 1,
        },
      },
      { $sort: { totalSold: -1 } },
      { $limit: 5 },
    ]);

    return topProducts;
  },

  async getStockMovementData(tenantId) {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const movements = await StockMovement.aggregate([
      {
        $match: {
          tenant_id: tenantId,
          createdAt: { $gte: sevenDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            date: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
            },
            movementType: "$movement_type",
          },
          totalQuantity: { $sum: "$quantity" },
        },
      },
      {
        $group: {
          _id: "$_id.date",
          movements: {
            $push: {
              type: "$_id.movementType",
              quantity: "$totalQuantity",
            },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Transform the grouped data into the required format
    const stockMovementData = movements.map((item) => {
      const movementMap = {};
      item.movements.forEach((m) => {
        movementMap[m.type] = m.quantity;
      });

      return {
        date: item._id,
        purchases: movementMap.purchase || 0,
        sales: movementMap.sale || 0,
        returns: movementMap.return || 0,
        adjustments: movementMap.adjustment || 0,
      };
    });

    // If we don't have 7 days of data, fill in the gaps
    const result = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(sevenDaysAgo);
      date.setDate(date.getDate() + i);
      const dateString = date.toISOString().split("T")[0];

      const existingData = stockMovementData.find((d) => d.date === dateString);
      if (existingData) {
        result.push(existingData);
      } else {
        result.push({
          date: dateString,
          purchases: 0,
          sales: 0,
          returns: 0,
          adjustments: 0,
        });
      }
    }

    return result;
  },
};

module.exports = DashboardService;
