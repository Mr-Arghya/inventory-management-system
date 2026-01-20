const Router = require("express").Router();
const ProductController = require("../controller/product.controller");

Router.post("/", ProductController.createProduct);
Router.get("/", ProductController.getAllProducts);
Router.get("/landing", ProductController.getAllProducts);
Router.put("/:id?", ProductController.updateProduct);
Router.delete("/:id", ProductController.deleteProduct);

module.exports = Router;
