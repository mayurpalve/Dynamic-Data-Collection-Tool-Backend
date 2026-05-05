import express from "express";
import {
  createSchemeDefinition,
  listSchemeDefinitions,
 
  exportSchemeTemplate,
  getSchemeDefinitionById,
  getSchemeDefinitionByScheme,
  deleteSchemeDefinition
} from "./schemeDefinition.controller.js";

import { protect } from "../../middlewares/auth.middleware.js";
import { hasPermission } from "../../middlewares/permission.middleware.js";

const router = express.Router();

router.use(protect);

/* CREATE / UPDATE */
router.post(
  "/",
  hasPermission("SCHEME_CREATE"),
  createSchemeDefinition
);

/* LIST ALL */
router.get(
  "/",
  hasPermission("SCHEME_VIEW"),
  listSchemeDefinitions
);

/* GET BY DEFINITION ID */
router.get("/by-id/:id", protect, getSchemeDefinitionById);

/* ✅ GET BY SCHEME ID (NEW – REQUIRED FOR SCHEME ANSWER) */
router.get(
  "/by-scheme/:schemeId",
  protect,
  getSchemeDefinitionByScheme
);

/* ✅ GET SINGLE BY DEFINITION ID */
router.get(
  "/by-id/:id",
  hasPermission("SCHEME_VIEW"),
  getSchemeDefinitionById
);



/* EXPORT */
router.get(
  "/:id/export-template",
  protect,
  exportSchemeTemplate
);


/*Delete Scheme Definition */
router.delete(
  "/:id",
  protect,
  hasPermission("SCHEME_DEFINITION_DELETE"),
  deleteSchemeDefinition
);


export default router;