require("dotenv").config();
const express = require("express");
const cors = require("cors");

const v1Routes = require("../routes");
const { AuthMiddleware, Formatter } = require("../middleware");
global.clog = function (...messages) {
  if (!envs.isProd()) {
    console.log(...messages);
  }
};
const app = express();

const PORT = process.env.PORT || 3001;

app.use(express.json());

app.use(cors());
app.use("/uploads", express.static("uploads"));

app.use((req, res, next)=>{
  console.log(req.method, req.path, "<-------REQ");
  next();
})
app.get("/", (req, res) => {
  res.send("API is running...");
});
app.use(
  "/api",
  [AuthMiddleware.verifyAuth, AuthMiddleware.verifySession,Formatter.formatFilter, Formatter.formatPageAndSize],
  v1Routes
);

module.exports = app;
