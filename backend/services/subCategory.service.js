const { SubCategory } = require("../models");

const SubCategoryService = {
  async createSubCategory(body) {
    const subCategory = await SubCategory.create(body);
    return subCategory;
  },

  async getAllSubCategories({ filter = {}, sort = {}, limit = 10, index = 0 }) {
    const subCategories = await SubCategory.find(filter)
      .sort(sort)
      .skip(index)
      .limit(limit);
    const count = await SubCategory.countDocuments(filter);
    return { subCategories, count };
  },

  async getOneSubCategory(filter = {}) {
    const subCategory = await SubCategory.findOne(filter);
    return subCategory;
  },

  async updateSubCategory(filter = {}, updateBody = {}) {
    const updatedSubCategory = await SubCategory.updateOne(filter, {
      $set: updateBody,
    });
    return updatedSubCategory;
  },
};

module.exports = SubCategoryService;
