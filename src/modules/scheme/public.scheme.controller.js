import Scheme from "./scheme.model.js";
import SchemeDefinition from "../schemeDefinition/schemeDefinition.model.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { isPublicSchemeAccessible } from "../schemeDefinition/publicAccess.service.js";
import { ApiError } from "../../utils/ApiError.js";

export const getPublicScheme = async (req, res, next) => {
  try {
    const scheme = await Scheme.findById(req.params.schemeId)
      .populate("department division district taluka region");

    const definition = await SchemeDefinition.findOne({
      scheme: req.params.schemeId,
      deletedAt: null
    });

    if (!isPublicSchemeAccessible({ scheme, definition })) {
      throw new ApiError(404, "Scheme not available");
    }

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          item: {
            scheme,
            definition
          }
        },
        "Public scheme fetched successfully"
      )
    );
  } catch (err) {
    next(err);
  }
};
