import SchemeDefinition from "./schemeDefinition.model.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";

export const getSchemeDefinitionByPublicLink = async (req, res, next) => {
  try {
    const { publicLinkId } = req.params;

    const definition = await SchemeDefinition.findOne({
      publicLinkId,
      isPublic: true,
      deletedAt: null
    }).populate("scheme", "name description");

    if (!definition) {
      throw new ApiError(404, "Scheme not available");
    }

    res.json(
      new ApiResponse(200, definition)
    );
  } catch (err) {
    next(err);
  }
};