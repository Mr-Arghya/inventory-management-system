const { Category, SubCategory, Product } = require("../models");

const CategoryService = {
  async createCategory(data) {
    const category = await Category.create(data);
    return category.toJSON();
  },

  async getAllCategories({ filter, sort, limit, index }) {
    const category = await Category.aggregate([
      {
        $lookup: {
          from: "sub_categories",
          localField: "_id",
          foreignField: "category_id",
          as: "sub_categories",
        },
      },
      {
        $match: filter,
      },
      {
        $sort: sort,
      },
    ]);
    const count = category.length;
    return { category, count };
  },

  async getOneCategory(filter) {
    return await Category.findOne(filter).lean();
  },

  async updateCategory({ filter, data }) {
    const result = await Category.updateOne(filter, {
      $set: data,
    });
    return result;
  },

  async deleteCategory(filter) {
    const result = await Category.updateOne(filter, {
      $set: { is_deleted: true },
    });
    if (result.modifiedCount === 0) {
      throw new Error("Category not found or already deleted");
    }
    if (result.modifiedCount > 0) {
      await SubCategory.updateMany(
        { category_id: filter._id },
        { $set: { is_deleted: true } }
      );
      await Product.updateMany(
        { categories: filter._id },
        { $set: { is_deleted: true } }
      );
    }
    return result;
  },
};

module.exports = CategoryService;
