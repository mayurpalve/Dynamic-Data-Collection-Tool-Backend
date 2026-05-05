import Scheme from "../scheme/scheme.model.js";
import SchemeDefinition from "../schemeDefinition/schemeDefinition.model.js";
import { generateSchemeTemplate } from "./excelTemplate.service.js";
import { ApiError } from "../../utils/ApiError.js";

export const downloadSchemeTemplate = async (req, res, next) => {
  try {
    const scheme = await Scheme.findById(req.params.schemeId);
    const definition = await SchemeDefinition.findOne({
      scheme: req.params.schemeId,
      deletedAt: null
    });

    if (!scheme || !definition) {
      throw new ApiError(404, "Scheme or definition not found");
    }

    const workbook = await generateSchemeTemplate({
      scheme,
      definition
    });

    res.setHeader(
      "Content-Disposition",
      `attachment; filename=scheme_${scheme._id}_template.xlsx`
    );

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    next(err);
  }
};
