const AppConfig = require("../config/app.config");
const { security } = require("../lib");
const { sendResponse } = require("../lib/response.lib");
const { UserService, AuthService, OtpService } = require("../services");

const { UserModel } = require("../models/user.model");
const { Types } = require("mongoose");

const UserController = {
  async viewProfile(req, res) {
    try {
      const userId = req.user._id;
      const user = await UserService.findOneUser({
        _id: new Types.ObjectId(userId),
      });
      if (!user) {
        return sendResponse(res, 404, { message: "User not found" }, true);
      }
      for (const element of AppConfig.auth_user_excluded_cols) {
        delete user[element];
      }
      return sendResponse(res, 200, "Profile fetched", user, false);
    } catch (e) {
      return sendResponse(res, 500, e.message, {}, true);
    }
  },

  async editProfile(req, res) {
    try {
      const userId = req.user._id; // Assuming user ID is available in req.user
      const updateData = req.body;
      if (req.file) {
        updateData.profile_picture = req.file.path; // Assuming file upload middleware is used
      }
      const updatedUser = await UserModel.findByIdAndUpdate(
        userId,
        updateData,
        { new: true },
      ).select("-password");
      return sendResponse(res, 200, updatedUser, false);
    } catch (e) {
      return sendResponse(res, 500, { message: e.message }, true);
    }
  },
  async register(req, res) {
    try {
      console.log("Register endpoint hit");
      const body = req.body;
      const registerData = {};
      for (const key of AppConfig.registration_keys) {
        if (key.post_key === AppConfig.auth_password_key) {
          registerData.password = security.generateHash(body[key.post_key]);
        } else {
          registerData[key.post_key] = body[key.post_key];
        }
      }
      const user = await UserService.createUser(registerData);
      for (const element of AppConfig.auth_user_excluded_cols) {
        delete user[element];
      }
      // OtpService.sendOtp(user._id, user.email);
      return sendResponse(res, 201, "Registration successful", user, false);
    } catch (e) {
      return sendResponse(res, 500, e.message, {}, true);
    }
  },

  async login(req, res) {
    try {
      const body = req.body;
      const user = await UserService.findOneUser({ email: body.email });
      if (!user) {
        throw new Error("User not found");
      }
      if (
        !body.password ||
        user.password !== security.generateHash(body.password)
      ) {
        throw new Error("Invalid password");
      }
      for (const element of AppConfig.auth_user_excluded_cols) {
        delete user[element];
      }
      const session = await AuthService.createSessionForUser(user);
      return sendResponse(res, 200, "Login Successfull", session, false);
    } catch (e) {
      return sendResponse(res, 500, e.message, {}, true);
    }
  },

  async authCheck(req, res) {
    try {
      return sendResponse(res, 200, "Authorized", {}, false);
    } catch (e) {
      return sendResponse(res, 500, e.message, {}, true);
    }
  },
};

module.exports = UserController;
