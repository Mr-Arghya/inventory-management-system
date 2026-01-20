const Router = require("express").Router();
const fs = require("fs");
const chalk = require("chalk").default;
const { EOL } = require("os");

Router.get("/", (req, res) => {
  res.send("V1 route is up..");
});
try {
  console.log(chalk.white("-----------------------"));
  console.log(chalk.white.bold("LOADING ROUTES FILE"));
  console.log(chalk.white("-----------------------"));
  const dirs = fs.readdirSync(__dirname);
  const toIgnore = ["index.js"];
  dirs.map((d) => {
    if (!toIgnore.includes(d)) {
      console.log(chalk.blue(`Route File Loaded:=> ${d}`));
      Router.use("/" + d.split(".")[0], require(`./${d}`));
    }
  });
} catch (e) {
  console.log(e);
}

module.exports = Router;
