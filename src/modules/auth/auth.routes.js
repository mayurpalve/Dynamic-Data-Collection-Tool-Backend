import express from "express";
import {
  forgotPassword,
  loginUser,
  resetPasswordWithOtp,
} from "./auth.controller.js";

const router = express.Router();

router.post("/login", loginUser);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPasswordWithOtp);

export default router;
