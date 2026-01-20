const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { sendResponse } = require("../lib/response.lib");

const uploadDir = "uploads/";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const extension = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + extension);
  },
});

const upload = multer({ storage });

const uploadFile = (req, res) => {
  const uploader = upload.single("file");

  uploader(req, res, (err) => {
    if (err) {
      return sendResponse(res, 400, { message: err.message }, true);
    }
    if (req.file) {
      req.file.url = `${req.protocol}://${req.get("host")}/${req.file.path}`;
    }
    return sendResponse(res, 200, { file: req.file }, false);
  });
};

module.exports = uploadFile;
