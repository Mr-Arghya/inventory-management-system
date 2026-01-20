const Router = require("express").Router();
const StockMovementController = require("../controller/stock-movement.controller");

Router.post("/", StockMovementController.createMovement);
Router.post("/adjust", StockMovementController.adjustStock);
Router.get("/", StockMovementController.getMovements);
Router.get("/product/:id/current-stock", StockMovementController.getCurrentStock);
Router.get("/product/:id/summary", StockMovementController.getMovementSummary);
Router.get("/variant/:id", StockMovementController.getMovementsByVariant);

module.exports = Router;