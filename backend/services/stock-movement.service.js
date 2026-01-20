const { Types } = require("mongoose");
const { StockMovement } = require("../models");
const { Product } = require("../models");

const StockMovementService = {
  async createStockMovement(movementData) {
    const stockMovement = await StockMovement.create(movementData);
    return stockMovement;
  },

  async getStockMovements({
    filter = {},
    sort = { createdAt: -1 },
    page = 1,
    limit = 10,
  }) {
    const skip = (page - 1) * limit;

    const movements = await StockMovement.aggregate([
      { $match: filter },
      { $sort: sort },
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from: "products",
          localField: "product_id",
          foreignField: "_id",
          as: "product",
        },
      },
      {
        $unwind: {
          path: "$product",
          preserveNullAndEmptyArrays: true,
        },
      },
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
          tenant_id: 1,
          product_id: 1,
          variant_id: 1,
          movement_type: 1,
          quantity: 1,
          previous_stock: 1,
          new_stock: 1,
          reason: 1,
          reference_id: 1,
          reference_type: 1,
          createdAt: 1,
          updatedAt: 1,
          "product.name": 1,
          "product.sku": 1,
          "createdByUser.name": 1,
          "createdByUser.email": 1,
        },
      },
    ]);

    return movements;
  },

  async getStockMovementsCount(filter = {}) {
    const count = await StockMovement.countDocuments(filter);
    return count;
  },

  async getStockMovementsByProduct(
    productId,
    { sort = { createdAt: -1 }, page = 1, limit = 10 } = {},
  ) {
    const skip = (page - 1) * limit;

    const movements = await StockMovement.aggregate([
      {
        $match: {
          product_id: new Types.ObjectId(productId),
        },
      },
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
          movement_type: 1,
          quantity: 1,
          previous_stock: 1,
          new_stock: 1,
          reason: 1,
          reference_id: 1,
          reference_type: 1,
          createdAt: 1,
          "createdByUser.name": 1,
          "createdByUser.email": 1,
        },
      },
    ]);

    return movements;
  },

  async getStockMovementsByVariant(
    variantId,
    { sort = { createdAt: 1 }, page = 1, limit = 10 } = {},
  ) {
    const skip = (page - 1) * limit;

    const movements = await StockMovement.aggregate([
      {
        $match: {
          variant_id: new Types.ObjectId(variantId),
        },
      },
      { $sort: sort },
      {
        $lookup: {
          from: "products",
          localField: "product_id",
          foreignField: "_id",
          as: "product",
        },
      },
      {
        $unwind: {
          path: "$product",
          preserveNullAndEmptyArrays: true,
        },
      },
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
          productId: "$product_id",
          type: "$movement_type",
          quantity: 1,
          previousStock: "$previous_stock",
          newStock: "$new_stock",
          reference: "$reference_id",
          notes: "$reason",
          createdAt: 1,
          createdBy: "$createdByUser.name",
        },
      },
    ]);

    return movements;
  },

  async getStockMovementsByProductCount(productId) {
    const count = await StockMovement.countDocuments({
      product_id: new Types.ObjectId(productId),
    });
    return count;
  },

  async adjustStock({
    productId,
    variantId = null,
    adjustmentType,
    quantity,
    reason,
    referenceId = null,
    referenceType = null,
    tenantId,
    userId,
  }) {
    let stockQuery = {};
    let newStock;
    let previousStock;

    if (variantId) {
      const product = await Product.findById(productId);
      if (!product) {
        throw new Error("Product not found");
      }

      const variant = product.variants.id(variantId);
      if (!variant) {
        throw new Error("Variant not found");
      }

      previousStock = variant.stock || 0;

      if (adjustmentType === "purchase" || adjustmentType === "return") {
        newStock = previousStock + Math.abs(quantity);
      } else if (adjustmentType === "sale") {
        newStock = previousStock - Math.abs(quantity);
      } else if (adjustmentType === "adjustment") {
        newStock = previousStock + quantity;
      }
      await Product.updateOne(
        { _id: productId, "variants._id": variantId },
        { $set: { "variants.$.stock": newStock } },
      );
    } else {
      const product = await Product.findById(productId);
      if (!product) {
        throw new Error("Product not found");
      }
      previousStock = 0;
      newStock = quantity;
    }

    const stockMovement = await StockMovement.create({
      tenant_id: tenantId,
      product_id: productId,
      variant_id: variantId,
      movement_type: adjustmentType,
      quantity: Math.abs(quantity),
      previous_stock: previousStock,
      new_stock: newStock,
      reason,
      created_by: userId,
    });

    return stockMovement;
  },

  async getCurrentStock(productId, variantId = null) {
    const product = await Product.findById(productId);
    if (!product) {
      throw new Error("Product not found");
    }

    if (variantId) {
      const variant = product.variants.id(variantId);
      if (!variant) {
        throw new Error("Variant not found");
      }
      return variant.stock || 0;
    }
    return 0;
  },

  async getStockMovementSummary(productId) {
    const summary = await StockMovement.aggregate([
      {
        $match: {
          product_id: new Types.ObjectId(productId),
        },
      },
      {
        $group: {
          _id: "$movement_type",
          total_quantity: { $sum: "$quantity" },
          movement_count: { $sum: 1 },
        },
      },
    ]);

    // Transform to a more readable format
    const result = {
      purchases: { quantity: 0, count: 0 },
      sales: { quantity: 0, count: 0 },
      returns: { quantity: 0, count: 0 },
      adjustments: { quantity: 0, count: 0 },
    };

    summary.forEach((item) => {
      result[item._id] = {
        quantity: item.total_quantity,
        count: item.movement_count,
      };
    });

    return result;
  },
};

module.exports = StockMovementService;


