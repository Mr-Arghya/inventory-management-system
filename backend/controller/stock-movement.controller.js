const { Types } = require("mongoose");
const { CommonLib } = require("../lib");
const { sendResponse } = require("../lib/response.lib");
const { StockMovementService } = require("../services");

const StockMovementController = {
  async createMovement(req, res) {
    try {
      const user = req.user;
      const body = req.body;

      const movementData = {
        tenant_id: new Types.ObjectId(user.owner_id),
        product_id: new Types.ObjectId(body.product_id),
        variant_id: body.variant_id
          ? new Types.ObjectId(body.variant_id)
          : null,
        movement_type: body.movement_type,
        quantity: body.quantity,
        previous_stock: body.previous_stock,
        new_stock: body.new_stock,
        reason: body.reason,
        reference_id: body.reference_id,
        reference_type: body.reference_type,
        created_by: new Types.ObjectId(user.user_id || user._id),
      };

      const stockMovement =
        await StockMovementService.createStockMovement(movementData);

      return sendResponse(
        res,
        201,
        "Stock movement created successfully",
        stockMovement,
        false,
      );
    } catch (error) {
      console.error("Error creating stock movement:", error);
      return sendResponse(res, 500, { message: error.message }, true);
    }
  },

  async adjustStock(req, res) {
    try {
      const user = req.user;
      const body = req.body;

      const adjustmentData = {
        productId: body.productId,
        variantId: body.variantId,
        adjustmentType: body.adjustmentType,
        quantity: body.quantity,
        reason: body.reason,
        tenantId: new Types.ObjectId(user.owner_id),
        userId: new Types.ObjectId(user.user_id || user._id),
      };

      const stockMovement =
        await StockMovementService.adjustStock(adjustmentData);

      return sendResponse(
        res,
        200,
        "Stock adjusted successfully",
        stockMovement,
        false,
      );
    } catch (error) {
      console.error("Error adjusting stock:", error);
      return sendResponse(res, 500, error.message, {}, true);
    }
  },

  async getMovements(req, res) {
    try {
      const user = req.user;
      const query = req.query;
      const page = query.page ? parseInt(query.page) : 1;
      const size = query.size ? parseInt(query.size) : 10;

      const filter = {
        tenant_id: new Types.ObjectId(user.owner_id),
        is_deleted: false,
      };

      // Apply filters from query params
      if (query.product_id) {
        filter.product_id = new Types.ObjectId(query.product_id);
      }

      if (query.variant_id) {
        filter.variant_id = new Types.ObjectId(query.variant_id);
      }

      if (query.movement_type) {
        filter.movement_type = query.movement_type;
      }

      if (query.reference_type) {
        filter.reference_type = query.reference_type;
      }

      if (query.start_date && query.end_date) {
        filter.createdAt = {
          $gte: new Date(query.start_date),
          $lte: new Date(query.end_date),
        };
      } else if (query.start_date) {
        filter.createdAt = { $gte: new Date(query.start_date) };
      } else if (query.end_date) {
        filter.createdAt = { $lte: new Date(query.end_date) };
      }

      const movements = await StockMovementService.getStockMovements({
        filter,
        sort: { createdAt: -1 },
        page,
        limit: size,
      });

      const total = await StockMovementService.getStockMovementsCount(filter);

      const response = {
        pagination: CommonLib.getPagination(page, size, total),
        movements: CommonLib.paginateArray(movements, page, size),
      };

      return sendResponse(
        res,
        200,
        "Stock movements fetched successfully",
        response,
        false,
      );
    } catch (error) {
      console.error("Error fetching stock movements:", error);
      return sendResponse(res, 500, { message: error.message }, true);
    }
  },

  async getMovementsByVariant(req, res) {
    try {
      const user = req.user;
      const { id } = req.params;
      const query = req.query;
      const page = query.page ? parseInt(query.page) : 1;
      const size = query.size ? parseInt(query.size) : 10;

      const filter = {
        tenant_id: new Types.ObjectId(user.owner_id),
      };

      if (query.movement_type) {
        filter.movement_type = query.movement_type;
      }

      if (query.start_date && query.end_date) {
        filter.createdAt = {
          $gte: new Date(query.start_date),
          $lte: new Date(query.end_date),
        };
      }

      const movements = await StockMovementService.getStockMovementsByVariant(
        id,
        {
          sort: { createdAt: 1 },
          page,
          limit: size,
        },
      );

      return sendResponse(
        res,
        200,
        "Product stock movements fetched successfully",
        movements,
        false,
      );
    } catch (error) {
      console.error("Error fetching product stock movements:", error);
      return sendResponse(res, 500, { message: error.message }, true);
    }
  },

  async getMovementSummary(req, res) {
    try {
      const { id } = req.params;

      const summary = await StockMovementService.getStockMovementSummary(id);

      return sendResponse(
        res,
        200,
        "Stock movement summary fetched successfully",
        summary,
        false,
      );
    } catch (error) {
      console.error("Error fetching stock movement summary:", error);
      return sendResponse(res, 500, { message: error.message }, true);
    }
  },

  async getCurrentStock(req, res) {
    try {
      const { id } = req.params;
      const { variant_id } = req.query;

      const currentStock = await StockMovementService.getCurrentStock(
        id,
        variant_id,
      );

      return sendResponse(
        res,
        200,
        "Current stock fetched successfully",
        { product_id: id, variant_id, current_stock: currentStock },
        false,
      );
    } catch (error) {
      console.error("Error fetching current stock:", error);
      return sendResponse(res, 500, { message: error.message }, true);
    }
  },
};

module.exports = StockMovementController;
