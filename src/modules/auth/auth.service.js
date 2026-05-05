import crypto from "crypto";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../user/user.model.js";
import { env } from "../../config/env.js";
import { ApiError } from "../../utils/ApiError.js";
import { sendPasswordResetOtpEmail } from "../../services/mail.service.js";

const RESET_OTP_EXPIRY_MS = 1000 * 60 * 10;
const MAX_RESET_OTP_ATTEMPTS = 5;

const buildResetOtpPayload = () => {
  const rawOtp = String(Math.floor(100000 + Math.random() * 900000));
  const hashedOtp = crypto.createHash("sha256").update(rawOtp).digest("hex");

  return {
    rawOtp,
    hashedOtp,
    expiresAt: new Date(Date.now() + RESET_OTP_EXPIRY_MS),
  };
};

export const login = async ({ email, password }) => {
  const user = await User.findOne({
    email,
    deletedAt: null,
  }).select("+password");

  if (!user || !user.isActive) {
    throw new ApiError(401, "Invalid credentials");
  }

  const match = await bcrypt.compare(password, user.password);

  if (!match) {
    throw new ApiError(401, "Invalid credentials");
  }

  const token = jwt.sign({ id: user._id }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });

  return {
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      permissions: user.permissions,
    },
  };
};

export const requestPasswordReset = async ({ email }) => {
  const genericResponse = {
    message: "If this account exists, a password reset OTP has been generated.",
  };

  const user = await User.findOne({
    email,
    deletedAt: null,
  });

  if (!user || !user.isActive) {
    return genericResponse;
  }

  const { rawOtp, hashedOtp, expiresAt } = buildResetOtpPayload();

  user.passwordResetOtp = hashedOtp;
  user.passwordResetOtpExpiresAt = expiresAt;
  user.passwordResetOtpAttempts = 0;
  await user.save({ validateBeforeSave: false });

  if (env.NODE_ENV === "production") {
    await sendPasswordResetOtpEmail({
      to: user.email,
      name: user.name,
      otp: rawOtp,
    });
  }

  return {
    ...genericResponse,
    ...(env.NODE_ENV !== "production" ? { otp: rawOtp } : {}),
  };
};

export const resetPassword = async ({ email, otp, password }) => {
  if (!email || !otp || !password) {
    throw new ApiError(400, "Email, OTP, and password are required");
  }

  const user = await User.findOne({
    email,
    deletedAt: null,
  }).select("+passwordResetOtp +passwordResetOtpExpiresAt +passwordResetOtpAttempts +password");

  if (!user || !user.isActive) {
    throw new ApiError(400, "OTP is invalid or expired");
  }

  if (
    !user.passwordResetOtp ||
    !user.passwordResetOtpExpiresAt ||
    user.passwordResetOtpExpiresAt <= new Date()
  ) {
    throw new ApiError(400, "OTP is invalid or expired");
  }

  if ((user.passwordResetOtpAttempts || 0) >= MAX_RESET_OTP_ATTEMPTS) {
    throw new ApiError(429, "Maximum OTP attempts exceeded. Request a new OTP.");
  }

  const hashedOtp = crypto.createHash("sha256").update(String(otp)).digest("hex");

  if (hashedOtp !== user.passwordResetOtp) {
    user.passwordResetOtpAttempts = (user.passwordResetOtpAttempts || 0) + 1;
    await user.save({ validateBeforeSave: false });
    throw new ApiError(400, "OTP is invalid or expired");
  }

  user.password = password;
  user.passwordResetOtp = null;
  user.passwordResetOtpExpiresAt = null;
  user.passwordResetOtpAttempts = 0;
  await user.save();

  return {
    message: "Password reset successful",
  };
};
