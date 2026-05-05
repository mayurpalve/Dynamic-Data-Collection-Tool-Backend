import express from "express";
import { protect } from "../../middlewares/auth.middleware.js";

import {
  createScheme,
  deleteScheme,
  listSchemes,
  updateScheme,
} from "./scheme.controller.js";

const router = express.Router();

router.post("/", protect, createScheme);
router.get("/", protect, listSchemes);
router.put("/:id", protect, updateScheme);
router.delete("/:id", protect, deleteScheme);

export default router;
