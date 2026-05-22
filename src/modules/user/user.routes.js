import express from "express";
import { protect } from "../../middlewares/auth.middleware.js";
import { hasPermission } from "../../middlewares/permission.middleware.js";
import {
  createUser,
  setUserStatus,
  deleteUser,
  getUsers,
  getMyProfile,
  updateMyProfile
} from "./user.controller.js";

const router = express.Router();

// Super Admin only
router.get("/me", protect, getMyProfile);
router.patch("/me", protect, updateMyProfile);
router.post("/", protect, hasPermission("USER_MANAGE"), createUser);
router.get("/", protect, hasPermission("USER_MANAGE"), getUsers);
router.patch("/:id/status", protect, hasPermission("USER_MANAGE"), setUserStatus);
router.delete("/:id", protect, hasPermission("USER_MANAGE"), deleteUser);

export default router;
