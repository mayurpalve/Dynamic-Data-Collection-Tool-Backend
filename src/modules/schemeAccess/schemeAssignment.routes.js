import express from "express";
import { protect } from "../../middlewares/auth.middleware.js";
import {
  assignScheme,
  getAssignmentsByScheme,
  getMyAssignments,
  revokeSchemeAssignment,
  updateSchemeAssignment,
} from "./schemeAccess.controller.js";

const router = express.Router();

router.post("/", protect, assignScheme);
router.get("/my", protect, getMyAssignments);
router.get("/scheme/:schemeId", protect, getAssignmentsByScheme);
router.put("/:id", protect, updateSchemeAssignment);
router.delete("/:id", protect, revokeSchemeAssignment);

export default router;
