import express from "express";
import { submitPublicSchemeAnswer } from "./publicSchemeAnswer.controller.js";
import { publicRateLimit } from "../../middlewares/rateLimit.middleware.js";

const router = express.Router();

router.post(
  "/submit",
  publicRateLimit,
  submitPublicSchemeAnswer
);

export default router;