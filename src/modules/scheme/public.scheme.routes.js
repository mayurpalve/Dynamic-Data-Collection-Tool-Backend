import express from "express";
import { getPublicScheme } from "./public.scheme.controller.js";
import { publicRateLimit } from "../../middlewares/rateLimit.middleware.js";

const router = express.Router();

// public read-only access (by SCHEME ID)
router.get("/:schemeId", publicRateLimit, getPublicScheme);

export default router;
