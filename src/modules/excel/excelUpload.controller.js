import SchemeDefinition from "../schemeDefinition/schemeDefinition.model.js";
import SchemeAnswer from "../schemeAnswer/schemeAnswer.model.js";
import { parseExcelFile } from "./excelUpload.service.js";
import { validateAnswerData } from "../schemeAnswer/validateAnswer.service.js";
import { checkDuplicateAnswer } from "../schemeAnswer/checkDuplicate.service.js";
import { canUserFillScheme } from "../schemeDefinition/schemeAccess.service.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { ApiError } from "../../utils/ApiError.js";

export const uploadExcelAnswers = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new ApiError(400, "Excel file is required");
    }

    const { schemeId } = req.params;

    const definition = await SchemeDefinition.findOne({
      scheme: schemeId,
      deletedAt: null
    });

    if (!definition) {
      throw new ApiError(404, "Scheme definition not found");
    }

    // Access check ONCE
    const allowed = canUserFillScheme({
      schemeDefinition: definition,
      user: req.user
    });

    if (!allowed) {
      throw new ApiError(403, "Access denied");
    }

    const rows = await parseExcelFile(req.file.buffer);

    const summary = {
      success: 0,
      failed: 0,
      errors: []
    };

    for (const row of rows) {
      try {
        validateAnswerData({
          definition,
          data: row.data
        });

        await checkDuplicateAnswer({
          schemeId,
          definition,
          data: row.data
        });

        await SchemeAnswer.create({
          scheme: schemeId,
          schemeDefinition: definition._id,
          data: row.data,
          filledBy: req.user._id,
          source: "EXCEL"
        });

        summary.success++;
      } catch (err) {
        summary.failed++;
        summary.errors.push({
          row: row.rowNumber,
          message: err.message
        });
      }
    }

    return res.status(200).json(
      new ApiResponse(
        200,
        { summary },
        "Excel upload processed successfully"
      )
    );
  } catch (err) {
    next(err);
  }
};
