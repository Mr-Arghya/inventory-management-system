const { sendResponse } = require("../../lib/response.lib");
const { AuthService } = require("../../services");
const AppConfig = require("../../config/app.config");
const jwt = require("jsonwebtoken");
const { security } = require("../../lib");

module.exports = {
  verifyAuth(req, res, next) {
    const skipAuth = !!AppConfig.skip_auth.find((s) => {
      const regExp = new RegExp(s.path);
      console.log(regExp.test(req.path), req.method, s.method, req.path, s.path, "<-------TEST");
      return (
        regExp.test(req.path) &&
        (s.method === "ALL" || s.method === req.method.toUpperCase())
      );
    });
    console.log(skipAuth, "<-------SKIPAUTH");
    req.skipAuth = skipAuth;
    try {
      const tokenData = req.headers["authorization"];
      if (!tokenData) throw new Error("Unauthorized session");
      const tokenArr = tokenData.split(" ");
      if (!tokenArr[1]) throw new Error("Invalid Session request");
      const token = security.decrypt(tokenArr[1]);
      const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
      req.user = decoded;
      next();
    } catch (e) {
      if (skipAuth) return next();
      return sendResponse(res, 401, "Invalid Session request", e, true);
    }
  },
  async verifySession(req, res, next) {
    try {
      if (req.skipAuth) return next();
      const user = req.user;
      console.log(user, "USER");
      const sessionId = user.sessionId;
      const session = await AuthService.getSession(sessionId);
      if (!session) throw new Error("noAuthSession");
      const expTime = new Date(session.expiry_time);
      if (expTime.getTime() <= new Date().getTime()) {
        await AuthService.logoutSession(sessionId, session.expiry_time);
        throw new Error("Session Expired");
      }
      const logoutTime = session.logout_time;
      if (logoutTime && logoutTime.getTime() <= new Date().getTime()) {
        throw new Error("Session Expired");
      }
      next();
    } catch (e) {
      return sendResponse(res, 401, "Invalid Session request....3", e, true);
    }
  },
};
