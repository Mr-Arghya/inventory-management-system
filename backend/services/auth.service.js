const { Types } = require("mongoose");
const { Session } = require("../models");
const UserService = require("./user.service");
const AppConfig = require("../config/app.config");
const { security, StringLib } = require("../lib");
const moment = require("moment");

const AuthService = {
  async getOpenSessionOfUser(userId) {
    return await Session.findOne({
      user_id: userId,
      logout_time: null,
    });
  },
  async getSession(sessionId) {
    return Session.findOne({
      session_id: sessionId,
    });
  },
  async logoutSession(sessionId, expiryTime = null) {
    const session = await Session.findOne({ session_id: sessionId });
    if (!session) {
      throw new NotFoundError("No active session found");
    }
    session.logout_time = expiryTime || new Date();
    return await session.save();
  },
  async invalidateOlderSession(userId) {
    await Session.updateMany(
      { user_id: new mongoose.Schema.Types.ObjectId(userId) },
      { $set: { expiry_time: new Date() } }
    );
  },
  async createSessionFromUserId(userId) {
    const user = await UserService.findOneUser({
      _id: new Types.ObjectId(userId),
    });
    if (!user) throw new NotFoundError("No User Found!");
    for (const key of AppConfig.auth_user_excluded_cols) {
      delete userData[key];
    }
    return await this.createSessionForUser(userData);
  },
  async createSessionForUser(user) {
    const sessionId = `${StringLib.generateRandomStrings(
      4
    ).toUpperCase()}-${StringLib.generateRandomStrings(
      3
    ).toUpperCase()}-${StringLib.generateRandomStrings(4).toUpperCase()}`;
    user.sessionId = sessionId;
    const accessToken = security.generateAccessToken(user);
    const refreshToken = security.generateRefreshToken(user);
    const sessionPayload = {
      session_id: sessionId,
      access_token: accessToken,
      refresh_token: refreshToken,
      user_id: user._id,
      owner_id: user.owner_id || null,
      login_time: new Date(),
      expiry_time: moment().add(1, "d"),
    };
    // save the session
    const sessionRes = await Session.create(sessionPayload);
    delete user.sessionId;
    return {
      user,
      accessToken,
      refreshToken,
    };
  },
};

module.exports = AuthService;
