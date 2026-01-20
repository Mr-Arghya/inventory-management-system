const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const AppConfig = require("../config/app.config");

const Security = {
  encrypt(rawdata) {
    if (!rawdata) return "";
    try {
      const cipher = crypto.createCipheriv(
        process.env.CRYPTO_ENC_ALGO,
        process.env.SECRET_KEY,
        process.env.INIT_VECTOR
      );
      let encryptedData = cipher.update(rawdata, "utf-8", "hex");
      encryptedData += cipher.final("hex");
      return encryptedData;
    } catch (e) {
      console.log(e);
      return "";
    }
  },
  decrypt(encryptdata) {
    if (!encryptdata) return "";
    try {
      const cipher = crypto.createDecipheriv(
        process.env.CRYPTO_ENC_ALGO,
        process.env.SECRET_KEY,
        process.env.INIT_VECTOR
      );
      let decryptedData = cipher.update(encryptdata, "hex", "utf-8");
      decryptedData += cipher.final("utf-8");
      return decryptedData;
    } catch (e) {
      clog(e.stack, "DECRYPT001");
      return "";
    }
  },
  generateHash(data) {
    return crypto
      .createHash(AppConfig.hash_algo || "sha256")
      .update(data)
      .digest("hex");
  },
  generateAccessToken(userData, forOtp = false, expiresIn = null) {
    const option = expiresIn
      ? { expiresIn: expiresIn }
      : forOtp
      ? { expiresIn: process.env.OTP_TOKEN_EXP_TIME }
      : { expiresIn: process.env.AUTH_ACCESS_TOKEN_EXP_TIME };
    userData.type = "access";
    return this.encrypt(jwt.sign(userData, process.env.JWT_SECRET_KEY, option));
  },
  generateRefreshToken(userData, forOtp = false, expiresIn = null) {
    const key = forOtp ? "otp_refresh_token" : "login-auth";
    const option = expiresIn
      ? { expiresIn: expiresIn }
      : forOtp
      ? { expiresIn: process.env.OTP_REFRESH_TOKEN_EXP_TIME }
      : { expiresIn: process.env.AUTH_REFRESH_TOKEN_EXP_TIME };
    userData.type = "refresh";
    return this.encrypt(
      jwt.sign(userData, process.env.REFRESH_TOKEN_SECRET_KEY, option)
    );
  },
  generateToken(length = 8) {
    return crypto.randomBytes(length).toString("hex").toUpperCase();
  },
  validateToken(token) {
    return jwt.verify(token, process.env.REFRESH_TOKEN_SECRET_KEY);
  },
};
module.exports = Security;
