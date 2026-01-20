const crypto = require("crypto");
const NotificationService = require("./notification.service");
const { Otp } = require("../models");
const moment = require("moment");
const { StringLib } = require("../lib");

const OTP_EXPIRATION_TIME = 10 * 60 * 1000;

const OtpService = {
  generateOtp() {
    return crypto.randomInt(100000, 999999).toString();
  },

  async sendOtp(userId, email) {
    const otpCode = this.generateOtp();
    const expiresAt = Date.now() + OTP_EXPIRATION_TIME;
    const payload = {
      token_id: `${StringLib.generateRandomStrings(3).toUpperCase()}-${crypto
        .randomInt(100, 999)
        .toString()}-${StringLib.generateRandomStrings(3).toUpperCase()}`,
      user_id: userId,
      otp: otpCode,
      exp_time: expiresAt,
    };
    await NotificationService.sendNotification(
      email,
      {
        ...payload,
        exp_time: `${moment(payload.exp_time).format("DD-MM-YYYY")} at ${moment(
          payload.exp_time
        ).format("hh:mm")}`,
      },
      "verify_otp"
    );
    await Otp.create(payload);
    return otpCode;
  },

  verifyOtp(userId, otpCode) {
    const record = otpStore.get(userId);
    if (!record) {
      return false;
    }

    const { code, expiresAt } = record;

    // Check if OTP is expired
    if (Date.now() > expiresAt) {
      otpStore.delete(userId);
      return false;
    }

    // Check if OTP matches
    if (code === otpCode) {
      otpStore.delete(userId);
      return true;
    }

    return false;
  },
};

module.exports = OtpService;
