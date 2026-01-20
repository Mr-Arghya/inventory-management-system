const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary.config");
const { sendResponse } = require("../lib/response.lib");

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "uploads",
    allowed_formats: ["jpg", "png", "jpeg", "gif", "webp"],
  },
});

const upload = multer({ storage });

const uploadToCloudinary = (req, res) => {
  const uploader = upload.fields([
    { name: "file", maxCount: 1 },
    { name: "files", maxCount: 10 },
  ]);

  uploader(req, res, (err) => {
    if (err) {
      return sendResponse(res, 400, { message: err.message }, true);
    }

    const single = req.files && req.files.file ? req.files.file[0] : null;
    const multiple = req.files && req.files.files ? req.files.files : [];

    if (!single && multiple.length === 0) {
      return sendResponse(res, 400, { message: "No file(s) uploaded" }, true);
    }

    const sanitize = (f) => ({
      originalname: f.originalname,
      mimetype: f.mimetype,
      size: f.size,
      ...f,
    });

    const payload = {
      file: single ? sanitize(single) : null,
      files: multiple.map(sanitize),
    };

    return sendResponse(res, 200, "Uploaded successfully", { files: payload }, false);
  });
};

module.exports = {
  uploadToCloudinary,
};
