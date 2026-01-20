const AppConfig = require("../config/app.config");
const { StringLib } = require("../lib");
const transporter = require("../connectors/nodemailer.connector");
const path = require("path");
const fs = require("fs");
const NotificationService = {
  async sendNotification(userId, payload, templatekey) {
    if (!templatekey) {
      templatekey = "generic_template";
    }
    if (StringLib.isEmail(userId)) {
      const template = AppConfig.notification_templates.find(
        (n) => n.key === templatekey
      );
      let body = template.template;
      let text = template.text;
      // check if the template is a file name or just a string
      const p = path.extname(template.template);

      if (p === ".html") {
        body = fs.readFileSync(
          path.resolve(
            AppConfig.base_path + "/" + AppConfig.template_path,
            template.template
          ),
          { encoding: "utf-8" }
        );
      }
      for (const [key, value] of Object.entries(payload)) {
        body = body.replace(new RegExp(`{{${key}}}`, "g"), value);
        text = text.replace(new RegExp(`{{${key}}}`, "g"), value);
      }
      await NotificationService.sendEmail({
        to: userId,
        body: body,
        text: text,
        subject: template.subject,
      });
    } else {
      throw new Error("User id is not supported");
    }
  },
  async sendEmail({ body, text, to, subject }) {
    const res = await transporter.sendMail({
      to: to,
      text: text,
      html: body,
      from: process.env.MAIL_NAME,
      subject: subject || "New Mail",
    });
    return true;
  },
};

module.exports = NotificationService;
