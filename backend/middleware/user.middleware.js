const AppConfig = require("../config/app.config");
const { sendResponse } = require("../lib/response.lib");
const { StringLib } = require("../lib");

const UserMiddleware = {
  async ValidateUser(req, res, next) {
    try {
      const body = req.body;
      for (const key of AppConfig.registration_keys) {
        if (!body[key.post_key] && key.required) {
          throw new Error(`Missing required field: ${key.post_key}`);
        }
      }
      next();
    } catch (e) {
      return sendResponse(res, 500, { message: e.message }, true);
    }
  },
  async validateEmail(req, res, next) {
    try {
      const body = req.body;
      if (!body.email || !StringLib.isEmail(body.email)) {
        return sendResponse(res, 400, { message: "Invalid email address" }, true);
      }
      next();
    } catch (e) {
      return sendResponse(res, 500, { message: e.message }, true);
    }
  },
};

module.exports = UserMiddleware;
