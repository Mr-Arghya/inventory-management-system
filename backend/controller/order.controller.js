const { Types } = require("mongoose");
const { CommonLib } = require("../lib");
const { sendResponse } = require("../lib/response.lib");
const { OrderService, GenerateSearchService } = require("../services");

const OrderController = {
  async createOrder(req, res) {
    try {
      const user = req.user;
      const orderData = {
        ...req.body,
        tenant_id: user.owner_id || user.tenant_id,
        created_by: user._id,
      };

      const result = await OrderService.createOrder(orderData);

      return sendResponse(res, 201, result.message, result.order, false);
    } catch (error) {
      console.error("Create Order Error:", error);
      const statusCode = error.message.includes("Insufficient stock")
        ? 409
        : 500;
      return sendResponse(res, statusCode, { message: error.message }, true);
    }
  },

  async getAllOrders(req, res) {
    try {
      const user = req.user;
      const tenantId = user.owner_id;
      const query = req.query;

      const page = query.page ? parseInt(query.page) : 1;
      const size = query.size ? parseInt(query.size) : 10;
      const response = {};
      const filter = {};
      if (query.status) {
        filter.order_status = query.status;
      }
      if (query.payment_status) {
        filter.payment_status = query.payment_status;
      }
      if (query.start_date || query.end_date) {
        filter.createdAt = {};
        if (query.start_date) {
          filter.createdAt.$gte = new Date(query.start_date);
        }
        if (query.end_date) {
          filter.createdAt.$lte = new Date(query.end_date);
        }
      }
      Object.assign(filter, req.filter || {});
      if (query.search_value) {
        const searchObject = await GenerateSearchService({
          collection: "Order",
          search_value: query.search_value,
        });
        Object.assign(filter, searchObject);
      }

      const sort = query.sort ? JSON.parse(query.sort) : { createdAt: -1 };

      const result = await OrderService.listOrders({
        tenantId,
        filter,
        sort,
        page,
        limit: size,
      });

      response.pagination = CommonLib.getPagination(
        page,
        size,
        result.pagination.total,
      );
      response.orders = result.orders;

      return sendResponse(
        res,
        200,
        "Orders fetched successfully",
        response,
        false,
      );
    } catch (error) {
      console.error("Get Orders Error:", error);
      return sendResponse(res, 500, { message: error.message }, true);
    }
  },

  async getOneOrder(req, res) {
    try {
      const user = req.user;
      const { id } = req.params;
      const tenantId = user.owner_id || user.tenant_id;

      const order = await OrderService.getOrderById(id, tenantId);

      return sendResponse(res, 200, "Order fetched successfully", order, false);
    } catch (error) {
      console.error("Get Order Error:", error);
      const statusCode = error.message === "Order not found" ? 404 : 500;
      return sendResponse(res, statusCode, { message: error.message }, true);
    }
  },

  async cancelOrder(req, res) {
    try {
      const user = req.user;
      const { id } = req.params;
      const { reason } = req.body;
      const tenantId = user.owner_id || user.tenant_id;

      const result = await OrderService.cancelOrder(id, tenantId, reason);

      return sendResponse(res, 200, result.message, result.order, false);
    } catch (error) {
      console.error("Cancel Order Error:", error);
      const statusCode = error.message.includes("not found") ? 404 : 400;
      return sendResponse(res, statusCode, { message: error.message }, true);
    }
  },

  async fulfillOrder(req, res) {
    try {
      const user = req.user;
      const { id } = req.params;
      const fulfillmentData = req.body;
      const tenantId = user.owner_id || user.tenant_id;

      const result = await OrderService.fulfillOrder(
        id,
        tenantId,
        fulfillmentData,
      );

      return sendResponse(res, 200, result.message, result.order, false);
    } catch (error) {
      console.error("Fulfill Order Error:", error);
      const statusCode = error.message.includes("not found") ? 404 : 400;
      return sendResponse(res, statusCode, { message: error.message }, true);
    }
  },

  async fulfillOrderItem(req, res) {
    try {
      const user = req.user;
      const { id, itemId } = req.params;
      const { quantity, notes } = req.body;
      const tenantId = user.owner_id || user.tenant_id;

      if (!quantity || quantity <= 0) {
        return sendResponse(
          res,
          400,
          { message: "Valid quantity is required" },
          true,
        );
      }

      const result = await OrderService.fulfillOrderItem(
        id,
        itemId,
        tenantId,
        quantity,
        notes,
      );

      return sendResponse(res, 200, result.message, result.order, false);
    } catch (error) {
      console.error("Fulfill Order Item Error:", error);
      const statusCode = error.message.includes("not found") ? 404 : 400;
      return sendResponse(res, statusCode, { message: error.message }, true);
    }
  },

  async updateOrderStatus(req, res) {
    try {
      const user = req.user;
      const { id } = req.params;
      const { status } = req.body;
      const tenantId = user.owner_id || user.tenant_id;

      if (!status) {
        return sendResponse(res, 400, { message: "Status is required" }, true);
      }

      const order = await OrderService.updateOrderStatus(id, tenantId, status);

      return sendResponse(
        res,
        200,
        "Order status updated successfully",
        order,
        false,
      );
    } catch (error) {
      console.error("Update Order Status Error:", error);
      const statusCode = error.message.includes("not found") ? 404 : 400;
      return sendResponse(res, statusCode, { message: error.message }, true);
    }
  },

  async updatePaymentStatus(req, res) {
    try {
      const user = req.user;
      const { id } = req.params;
      const { payment_status, transaction_id, payment_method } = req.body;
      const tenantId = user.owner_id || user.tenant_id;

      if (!payment_status) {
        return sendResponse(
          res,
          400,
          { message: "Payment status is required" },
          true,
        );
      }

      const order = await OrderService.updatePaymentStatus(
        id,
        tenantId,
        payment_status,
        {
          transaction_id,
          payment_method,
        },
      );

      return sendResponse(
        res,
        200,
        "Payment status updated successfully",
        order,
        false,
      );
    } catch (error) {
      console.error("Update Payment Status Error:", error);
      const statusCode = error.message.includes("not found") ? 404 : 400;
      return sendResponse(res, statusCode, { message: error.message }, true);
    }
  },

  async getOrderStatistics(req, res) {
    try {
      const user = req.user;
      const tenantId = user.owner_id || user.tenant_id;
      const query = req.query;

      const dateFilter = {};
      if (query.start_date || query.end_date) {
        if (query.start_date) {
          dateFilter.createdAt = { $gte: new Date(query.start_date) };
        }
        if (query.end_date) {
          dateFilter.createdAt = {
            ...dateFilter.createdAt,
            $lte: new Date(query.end_date),
          };
        }
      }

      const statistics = await OrderService.getOrderStatistics(
        tenantId,
        dateFilter,
      );

      return sendResponse(
        res,
        200,
        "Order statistics fetched successfully",
        statistics,
        false,
      );
    } catch (error) {
      console.error("Get Statistics Error:", error);
      return sendResponse(res, 500, { message: error.message }, true);
    }
  },

  async releaseExpiredReservations(req, res) {
    try {
      const result = await OrderService.releaseExpiredReservations();

      return sendResponse(
        res,
        200,
        "Expired reservations processed",
        result,
        false,
      );
    } catch (error) {
      console.error("Release Expired Error:", error);
      return sendResponse(res, 500, { message: error.message }, true);
    }
  },
};

module.exports = OrderController;
