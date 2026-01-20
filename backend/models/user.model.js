const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
    },
    email: {
      type: String,
      default: "",
    },
    password: {
      type: String,
    },
    profile_picture: {
      type: String,
      default: "",
    },
    is_verified: {
      type: Boolean,
      default: false,
    },
    user_type : {
      type : String,
      enum : ["owner", "manager", "staff"],
      default : "user"
    },
    tenant: [
      {
        user_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        joined_at: {
          type: Date,
          default: Date.now,
        },
        is_removed: {
          type: Boolean,
          default: false,
        },
      },
    ],
    is_deleted: {
      type: Boolean,
      default: false,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

const UserModel = mongoose.model("User", UserSchema);
module.exports = UserModel;
