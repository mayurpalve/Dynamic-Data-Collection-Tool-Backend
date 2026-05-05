import express from "express";
import { protect } from "../../middlewares/auth.middleware.js";
import { hasPermission } from "../../middlewares/permission.middleware.js";

import {
  createSchemeAnswer,
  getSchemeAnswers,
  updateSchemeAnswer,
  deleteSchemeAnswer,
  importSchemeAnswers,
  exportSchemeAnswers,
  importCollaborativeWorkbook,
  exportCollaborativeWorkbook,
  getCollaborativeSchemeRows,
  updateCollaborativeSchemeRow,
} from "./schemeAnswer.controller.js";

const router = express.Router();

/* ================= USER SUBMIT ================= */
router.post("/", protect, createSchemeAnswer);

/* ================= EXCEL IMPORT (ADMIN) ================= */
router.post(
  "/import",
  protect,
  hasPermission("EXCEL_IMPORT"),
  importSchemeAnswers
);

router.post(
  "/workbook/import",
  protect,
  importCollaborativeWorkbook
);

/* ================= LIST (ROLE FILTERED IN CONTROLLER) ================= */
router.get(
  "/",
  protect,
  getSchemeAnswers
);

router.get(
  "/collaborative/:schemeId",
  protect,
  getCollaborativeSchemeRows
);

router.patch(
  "/collaborative/:id",
  protect,
  updateCollaborativeSchemeRow
);

/* ================= UPDATE (OWNER ONLY) ================= */
router.put(
  "/:id",
  protect,
  updateSchemeAnswer
);

/* ================= DELETE (OWNER ONLY) ================= */
router.delete(
  "/:id",
  protect,
  deleteSchemeAnswer
);

/* ================= EXPORT (ADMIN) ================= */
router.get(
  "/export",
  protect,
  hasPermission("EXCEL_EXPORT"),
  exportSchemeAnswers
);

router.get(
  "/workbook/export",
  protect,
  exportCollaborativeWorkbook
);

export default router;
