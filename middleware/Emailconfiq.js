
require("dotenv").config({
  path: require("path").join(__dirname, "../.env"),
});

const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});
transporter.verify()
  .then(() => {
    console.log("SMTP connection successful");
  })
  .catch((error) => {
    console.error("SMTP connection failed:", {
      message: error.message,
      code: error.code,
      responseCode: error.responseCode
    });
  });

// Export transporter for Email.js
module.exports = { transporter };
