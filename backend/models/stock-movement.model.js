const mongoose = require("mongoose");

const StockMovementSchema = new mongoose.Schema(
  {
    tenant_id: {
      type: mongoose.Types.ObjectId,
      ref: "users",
      required: true,
    },
    product_id: {
      type: mongoose.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    variant_id: {
      type: mongoose.Types.ObjectId,
      required: false,
    },
    movement_type: {
      type: String,
      enum: ["purchase", "sale", "return", "adjustment"],
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    previous_stock: {
      type: Number,
      required: true,
    },
    new_stock: {
      type: Number,
      required: true,
    },
    reason: {
      type: String,
      required: false,
    },
    reference_id: {
      type: String,
      required: false,
    },
    reference_type: {
      type: String,
      enum: ["order", "purchase", "manual", null],
      required: false,
    },
    created_by: {
      type: mongoose.Types.ObjectId,
      ref: "users",
      required: true,
    },
  },
  { timestamps: true }
);

StockMovementSchema.index({ product_id: 1, createdAt: -1 });
StockMovementSchema.index({ tenant_id: 1, createdAt: -1 });
StockMovementSchema.index({ movement_type: 1 });

const StockMovement = mongoose.model("StockMovement", StockMovementSchema);

module.exports = StockMovement;
