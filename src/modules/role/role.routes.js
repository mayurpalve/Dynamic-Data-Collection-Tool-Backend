import express from "express";
import { protect } from "../../middlewares/auth.middleware.js";
import { hasPermission } from "../../middlewares/permission.middleware.js";
import {
  createRole,
  getRoles,
  deleteRole,
  updateRole
} from "./role.controller.js";

const router = express.Router();

// Super Admin only
router.post("/", protect, hasPermission("USER_MANAGE"), createRole);
router.get("/", protect, hasPermission("USER_MANAGE"), getRoles);
router.delete("/:id", protect, hasPermission("USER_MANAGE"), deleteRole);
router.put("/:id", protect, hasPermission("USER_MANAGE"), updateRole);

export default router;
