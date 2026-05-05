import SchemeDefinition from "./schemeDefinition.model.js";
import SchemeAssignment from "../schemeAccess/schemeAssignment.model.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { ApiError } from "../../utils/ApiError.js";
import crypto from "crypto";
import XLSX from "xlsx";

const generatePublicLinkId = () =>
  crypto.randomBytes(6).toString("hex");

/* ======================================================= */
/* CREATE / UPDATE                                         */
/* ======================================================= */
export const createSchemeDefinition = async (req, res, next) => {
  try {
    const { schemeId, fields } = req.body;

    if (!schemeId || !Array.isArray(fields) || fields.length === 0) {
      throw new ApiError(400, "Scheme and fields are required");
    }

    const existing = await SchemeDefinition.findOne({ scheme: schemeId });

    const payload = {
      scheme: schemeId,
      fields,
      department: req.body.department || null,
      division: req.body.division || null,
      district: req.body.district || null,
      taluka: req.body.taluka || null,
      region: req.body.region || null,
      assignedRoles: req.body.assignedRoles || [],
      isPublic: true
    };

    // generate public link only first time
    if (!existing?.publicLinkId) {
      payload.publicLinkId = generatePublicLinkId();
    }

    const def = await SchemeDefinition.findOneAndUpdate(
      { scheme: schemeId },
      payload,
      { upsert: true, new: true }
    );

    return res.status(201).json(
      new ApiResponse(201, { item: def }, "Scheme definition saved")
    );

  } catch (err) {
    next(err);
  }
};

/* ======================================================= */
/* LIST ALL                                                */
/* ======================================================= */
export const listSchemeDefinitions = async (req, res, next) => {
  try {
    const defs = await SchemeDefinition.find({ deletedAt: null })
      .populate("scheme", "name description")
      .populate("department division district taluka region")
      .sort({ createdAt: -1 });

    return res.status(200).json(
      new ApiResponse(200, {
        items: defs,
        total: defs.length
      })
    );
  } catch (err) {
    next(err);
  }
};

/* ======================================================= */
/* GET BY ID                                               */
/* ======================================================= */
export const getSchemeDefinitionById = async (req, res, next) => {
  try {
    const def = await SchemeDefinition.findById(req.params.id)
      .populate("scheme", "name description")
      .populate("department division district taluka region");

    if (!def || def.deletedAt) {
      throw new ApiError(404, "Scheme definition not found");
    }

    return res.status(200).json(
      new ApiResponse(200, { item: def })
    );
  } catch (err) {
    next(err);
  }
};

/* ======================================================= */
/* EXPORT TEMPLATE (ROLE + ASSIGNMENT SAFE)                */
/* ======================================================= */
export const exportSchemeTemplate = async (req, res, next) => {
  try {
    const def = await SchemeDefinition.findById(req.params.id)
      .populate("scheme", "name");

    if (!def || def.deletedAt) {
      throw new ApiError(404, "Scheme definition not found");
    }

    /* 🔐 ACCESS CONTROL */

    if (req.user.role !== "SUPER_ADMIN") {
      const assigned = await SchemeAssignment.findOne({
        scheme: def.scheme,
        assignedTo: req.user._id,
        deletedAt: null
      });

      if (!assigned) {
        throw new ApiError(403, "You are not assigned to this scheme");
      }
    }

    /* 📄 GENERATE EXCEL */

    const row = {};
    def.fields.forEach(f => (row[f.label] = ""));

    const ws = XLSX.utils.json_to_sheet([row]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");

    const buffer = XLSX.write(wb, {
      type: "buffer",
      bookType: "xlsx"
    });

    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${def.scheme.name}.xlsx`
    );

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    res.send(buffer);

  } catch (err) {
    next(err);
  }
};

/* ======================================================= */
/* GET BY SCHEME ID                                        */
/* ======================================================= */
export const getSchemeDefinitionByScheme = async (req, res, next) => {
  try {
    const definition = await SchemeDefinition.findOne({
      scheme: req.params.schemeId,
      deletedAt: null
    }).populate("scheme", "name description status opensAt closesAt");

    if (!definition) {
      throw new ApiError(404, "Scheme definition not found");
    }

    return res.status(200).json(
      new ApiResponse(200, { item: definition })
    );
  } catch (err) {
    next(err);
  }
};

/* ======================================================= */
/* DELETE (SOFT DELETE)                                    */
/* ======================================================= */
export const deleteSchemeDefinition = async (req, res, next) => {
  try {
    const def = await SchemeDefinition.findById(req.params.id);

    if (!def || def.deletedAt) {
      throw new ApiError(404, "Scheme definition not found");
    }

    def.deletedAt = new Date();
    await def.save();

    return res.status(200).json(
      new ApiResponse(200, {}, "Scheme definition deleted")
    );

  } catch (err) {
    next(err);
  }
};
