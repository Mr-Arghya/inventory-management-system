const Router = require("express").Router();
const DashboardController = require("../controller/dashboard.controller");

Router.get("/", DashboardController.getDashboard);

module.exports = Router;

