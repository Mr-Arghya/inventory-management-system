const Router = require("express").Router();
const OrderController = require("../controller/order.controller");

// Order CRUD operations
Router.post("/", OrderController.createOrder);
Router.get("/", OrderController.getAllOrders);
Router.get("/statistics", OrderController.getOrderStatistics);
Router.get("/:id", OrderController.getOneOrder);

// Order status management
Router.put("/:id/status", OrderController.updateOrderStatus);
Router.put("/:id/payment", OrderController.updatePaymentStatus);
Router.put("/:id/cancel", OrderController.cancelOrder);
Router.put("/:id/fulfill", OrderController.fulfillOrder);

Router.post("/:id/items/:itemId/fulfill", OrderController.fulfillOrderItem);

Router.post("/release-expired", OrderController.releaseExpiredReservations);

module.exports = Router;

