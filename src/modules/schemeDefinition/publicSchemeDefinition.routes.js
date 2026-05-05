import express from "express";
import { getSchemeDefinitionByPublicLink } from "./publicSchemeDefinition.controller.js";

const router = express.Router();

/* PUBLIC – NO AUTH */
router.get(
  "/:publicLinkId",
  getSchemeDefinitionByPublicLink
);

export default router;