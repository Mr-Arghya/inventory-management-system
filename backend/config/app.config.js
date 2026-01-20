const path = require("path");

const AppConfig = {
  auth_password_key: "password",
  base_path: path.resolve(__dirname, ".."),
  template_path: "templates",

  registration_keys: [
    { post_key: "name", column_key: "name", required: true },
    { post_key: "email", column_key: "email", required: true, unique: true },
    { post_key: "password", column_key: "password", required: true },
    {
      post_key: "confirm_password",
      column_key: "",
      required: true,
      skip: true,
    },
    {
      post_key: "user_type",
      column_key: "user_type",
      required: false,
      default: "user",
    },
    {
      post_key: "profile_picture",
      column_key: "profile_picture",
      required: false,
    },
    {
      post_key: "businessName",
      column_key: "business_name",
      required: true,
    },
  ],

  category_keys: [
    { post_key: "name", column_key: "name", required: true },
    { post_key: "description", column_key: "description", required: false },
  ],

  sub_category_keys: [
    { post_key: "name", column_key: "name", required: true },
    { post_key: "category_id", column_key: "category_id", required: true },
    {
      post_key: "description",
      column_key: "description",
      required: false,
    },
  ],

  auth_user_excluded_cols: ["password", "createdAt", "updatedAt"],
  notification_templates: [
    {
      key: "verify_otp",
      template: "otp_template.html",
      text: "",
    },
  ],
  skip_auth: [
    { path: "/user/login/?", method: "POST" },
    { path: "/user/register/?", method: "POST" },
    { path: "/claudinary-upload/upload/?", method: "POST" },
    { path: "/products/landing/?", method: "GET" },
  ],
};

module.exports = AppConfig;
