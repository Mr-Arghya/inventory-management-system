const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  token_id: {
    type: String
  },
  user_id: {
    type: mongoose.Types.ObjectId,
    ref:"users"
  },
  otp: {
    type: String
  },
  exp_time: {
    type: Date
  },
  otp_invalidate: {
    type: Boolean,
    default : false
  }
}, {timestamps: true});

const Otp = mongoose.model('otp', otpSchema);

module.exports = Otp;
