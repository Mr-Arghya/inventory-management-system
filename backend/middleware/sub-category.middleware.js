const AppConfig = require("../config/app.config");
const { sendResponse } = require("../lib/response.lib");
const { CategoryService } = require("../services");

const CategoryMiddleware = {
  async ValidateSubCategoryCreation(req, res, next) {
    try {
      const body = req.body;
      for (const key of AppConfig.sub_category_keys) {
        if (key.required && !body[key.post_key]) {
          throw new Error(`${key.post_key} is missing`);
        }
      }
      const category = await CategoryService.getOneCategory({
        name: body.name.trim(),
      });
      if(category){
        throw new Error("Category already exists");
      }
    } catch (e) {
      return sendResponse(res, 500, { message: e.message }, true);
    }
  },
};

module.exports = CategoryMiddleware