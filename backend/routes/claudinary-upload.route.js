const { uploadToCloudinary } = require("../controller/claudinary-upload.controller");

const Router = require("express").Router();

Router.post("/", uploadToCloudinary);

module.exports = Router;
