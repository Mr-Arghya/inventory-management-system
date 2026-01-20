const { Product } = require("../models");
const { ProductAGGREGATION } = require("./aggregation");

const ProductService = {
  async createProduct(productData) {
    const product = await Product.create(productData);
    return product;
  },

  async getAllProducts({ filter = {}, sort = { createdAt: -1 } }) {
    const products = await Product.aggregate([
      {
        $match: filter,
      },
      { $sort: sort },
    ]);
    return products;
  },

  async updateProduct(filter, updateData) {
    const updatedProduct = await Product.updateOne(
      filter,
      { $set: updateData },
      { new: true }
    );
    return updatedProduct;
  },
};

module.exports = ProductService;
