import Scheme from "../scheme/scheme.model.js";
import SchemeDefinition from "../schemeDefinition/schemeDefinition.model.js";
import SchemeAnswer from "./schemeAnswer.model.js";

import { validateAnswerData } from "./validateAnswer.service.js";
import { checkDuplicateAnswer } from "./checkDuplicate.service.js";
import { assertSchemeAcceptingSubmissions } from "../scheme/schemeWindow.service.js";

import { ApiResponse } from "../../utils/ApiResponse.js";
import { ApiError } from "../../utils/ApiError.js";

export const submitPublicSchemeAnswer = async (req, res, next) => {
  try {
    const { schemeId, data } = req.body;

    /* ================= BASIC VALIDATION ================= */
    if (!schemeId || !data) {
      throw new ApiError(400, "schemeId and data are required");
    }

    /* ================= FIND SCHEME ================= */
    const scheme = await Scheme.findOne({
      _id: schemeId,
      deletedAt: null
    });

    if (!scheme) {
      throw new ApiError(404, "Scheme not found");
    }

    /* ================= FIND DEFINITION ================= */
    const definition = await SchemeDefinition.findOne({
      scheme: schemeId,
      deletedAt: null
    });

    if (!definition) {
      throw new ApiError(404, "Scheme definition not found");
    }

    /* ================= PUBLIC ACCESS CHECK ================= */
    if (!definition.isPublic) {
      throw new ApiError(403, "Scheme is not public");
    }

    assertSchemeAcceptingSubmissions(scheme);

    /* ================= VALIDATE DATA ================= */
    await validateAnswerData({
      definition,
      data
    });

    /* ================= DUPLICATE CHECK ================= */
    await checkDuplicateAnswer({
      schemeId,
      definition,
      data
    });

    /* ================= CREATE ANSWER ================= */
    const answer = await SchemeAnswer.create({
      scheme: schemeId,
      schemeDefinition: definition._id,
      data,
      filledBy: null,
      source: "PUBLIC"
    });

    return res.status(201).json(
      new ApiResponse(
        201,
        { item: answer },
        "Public scheme response submitted successfully"
      )
    );

  } catch (err) {
    console.error("❌ PUBLIC SUBMIT ERROR:", err);
    next(err);
  }
};
