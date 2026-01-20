const { Types } = require("mongoose");
const { CommonLib } = require("../lib");
const { sendResponse } = require("../lib/response.lib");
const { ProductService, GenerateSearchService } = require("../services");

const ProductController = {
  async createProduct(req, res) {
    try {
      const body = req.body;
      const product = await ProductService.createProduct({...body, tenant_id: new Types.ObjectId(req.user.owner_id)});
      return sendResponse(
        res,
        201,
        "Product created successfully",
        product,
        false
      );
    } catch (error) {
      return sendResponse(res, 500, { message: error.message }, true);
    }
  },

  async getAllProducts(req, res) {
    try {
      const user = req.user;
      const filter = {
        is_deleted: false,
        tenant_id : new Types.ObjectId(user.owner_id)
      };
      const query = req.query;
      const page = query.page ? parseInt(query.page) : 1;
      const size = query.size ? parseInt(query.size) : 10;
      const response = {};
      const index = page ? (page - 1) * size : 0;
      const queryFilter = req.filter ? req.filter : {};
      Object.assign(filter, queryFilter);
      if (query.search_value) {
        const searchObject = await GenerateSearchService({
          collection: "Product",
          search_value: query.search_value,
        });
        Object.assign(filter, searchObject);
      }
      console.log(filter, "<-------FILTER");
      const products = await ProductService.getAllProducts({
        filter,
        sort: { createdAt: -1 },
      });
      const total = products.length;
      response.pagination = CommonLib.getPagination(page, size, total);
      response.products = CommonLib.paginateArray(products, page, size);
      return sendResponse(
        res,
        200,
        "Products fetched successfully",
        response,
        false
      );
    } catch (error) {
      console.log(error, "<-------ERR");
      return sendResponse(res, 500, { message: error.message }, true);
    }
  },

  async getOneProduct(req, res) {
    try {
      const { id } = req.params;
      const product = await ProductService.getAllProducts({
        _id: new Types.ObjectId(id),
        is_deleted: false,
      });
      if (product.length === 0) {
        return sendResponse(res, 404, "Product not found", null, true);
      }
      return sendResponse(
        res,
        200,
        "Product fetched successfully",
        product[0],
        false
      );
    } catch (error) {
      return sendResponse(res, 500, { message: error.message }, true);
    }
  },

  async updateProduct(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const updatedProduct = await ProductService.updateProduct(
        { _id: new Types.ObjectId(id), is_deleted: false },
        updateData
      );
      if (!updatedProduct.matchedCount) {
        return sendResponse(res, 404, "Product not found", {}, true);
      }
      return sendResponse(
        res,
        200,
        "Product updated successfully",
        updatedProduct,
        false
      );
    } catch (error) {
      return sendResponse(res, 500, { message: error.message }, true);
    }
  },

  async deleteProduct(req, res) {
    try {
      const { id } = req.params;
      const deletedProduct = await ProductService.updateProduct(
        { _id: new Types.ObjectId(id), is_deleted: false },
        { is_deleted: true }
      );
      if (!deletedProduct.matchedCount) {
        return sendResponse(res, 404, "Product not found", {}, true);
      }
      return sendResponse(
        res,
        200,
        "Product deleted successfully",
        deletedProduct,
        false
      );
    } catch (error) {
      return sendResponse(res, 500, { message: error.message }, true);
    }
  },
};

module.exports = ProductController;
