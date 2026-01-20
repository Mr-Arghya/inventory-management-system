const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema(
  {
    tenant_id: {
      type: mongoose.Types.ObjectId,
      ref: "users",
    },
    name: {
      type: String,
      required: true,
    },
    image: [
      {
        type: String,
      },
    ],
    description: {
      type: String,
    },
    is_deleted: {
      type: Boolean,
      default: false,
    },
    sku: {
      type: String,
    },
    category: {
      type: String,
    },
    variants: [
      {
        attributes: {
          size: {
            type: String,
          },
          color: {
            type: String,
          },
        },
        images: [
          {
            type: String,
          },
        ],
        stock: {
          type: Number,
        },
        cost: {
          type: Number,
        },
        price: {
          type: Number,
        },
        low_threshold: {
          type: Number,
        },
      },
    ],
  },
  { timestamps: true },
);

const Product = mongoose.model("Product", ProductSchema);

module.exports = Product;
