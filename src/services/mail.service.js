import nodemailer from "nodemailer";
import { env } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";

let transporter;

const getTransporter = () => {
  if (transporter) {
    return transporter;
  }

  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS || !env.MAIL_FROM) {
    throw new ApiError(
      500,
      "Email service is not configured. Please set SMTP and MAIL_FROM environment variables."
    );
  }

  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  });

  return transporter;
};

export const sendPasswordResetOtpEmail = async ({ to, name, otp }) => {
  const client = getTransporter();

  await client.sendMail({
    from: env.MAIL_FROM,
    to,
    subject: `${env.APP_NAME} password reset OTP`,
    text: [
      `Hello ${name || "User"},`,
      "",
      `Your ${env.APP_NAME} password reset OTP is: ${otp}`,
      "",
      "This OTP is valid for 10 minutes.",
      "Do not share this OTP with anyone.",
      "",
      `If you did not request this reset, please ignore this email.`,
    ].join("\n"),
  });
};
