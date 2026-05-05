import {
  login,
  requestPasswordReset,
  resetPassword,
} from "./auth.service.js";
import { ApiResponse } from "../../utils/ApiResponse.js";

export const loginUser = async (req, res, next) => {
  try {
    const data = await login(req.body);

    return res.status(200).json(
      new ApiResponse(200, data, "Login successful")
    );
  } catch (err) {
    next(err);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const data = await requestPasswordReset(req.body);

    return res.status(200).json(
      new ApiResponse(200, data, data.message)
    );
  } catch (err) {
    next(err);
  }
};

export const resetPasswordWithOtp = async (req, res, next) => {
  try {
    const data = await resetPassword(req.body);

    return res.status(200).json(
      new ApiResponse(200, data, data.message)
    );
  } catch (err) {
    next(err);
  }
};
