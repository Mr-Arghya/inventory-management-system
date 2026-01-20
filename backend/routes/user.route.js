const uploadFile = require("../controller/upload.controller");
const UserController = require("../controller/user.controller");
const { UserMiddleware } = require("../middleware");

const Router = require("express").Router();

Router.post(
  "/register",
  [UserMiddleware.validateEmail, UserMiddleware.ValidateUser],
  UserController.register
);
Router.post("/login", UserController.login);
Router.post("/upload-file", uploadFile);
Router.get("/check", UserController.authCheck);
Router.get("/profile", UserController.viewProfile)


module.exports = Router;
