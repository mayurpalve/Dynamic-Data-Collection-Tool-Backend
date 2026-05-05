import XLSX from "xlsx";

import Scheme from "../scheme/scheme.model.js";
import SchemeAnswer from "./schemeAnswer.model.js";
import SchemeDefinition from "../schemeDefinition/schemeDefinition.model.js";
import SchemeAssignment from "../schemeAccess/schemeAssignment.model.js";
import User from "../user/user.model.js";

import { validateAnswerData } from "./validateAnswer.service.js";
import { checkDuplicateAnswer } from "./checkDuplicate.service.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { ApiError } from "../../utils/ApiError.js";
import { assertSchemeAcceptingSubmissions } from "../scheme/schemeWindow.service.js";

const WORKBOOK_META_COLUMNS = {
  ROW_NUMBER: "__rowNumber",
  ROW_ID: "__rowId",
  OWNER_ID: "__ownerUserId",
  OWNER_NAME: "__ownerName",
  OWNER_EMAIL: "__ownerEmail",
  SOURCE: "__source",
};

const getAnswerDataObject = (answer) => {
  if (!answer?.data) return {};

  if (answer.data instanceof Map) {
    return Object.fromEntries(answer.data.entries());
  }

  return Object.fromEntries(
    Object.entries(answer.data).map(([key, value]) => [key, value])
  );
};

const extractWorkbookRow = (row = {}, definition) => {
  const metadata = {};
  const values = {};
  const labelToKey = new Map(
    definition.fields.map((field) => [field.label.trim(), field.key])
  );

  for (const [columnName, columnValue] of Object.entries(row)) {
    if (columnName.startsWith("__")) {
      metadata[columnName] = columnValue;
      continue;
    }

    const trimmedColumn = columnName.trim();
    const fieldKey = labelToKey.get(trimmedColumn) || trimmedColumn;

    values[fieldKey] = columnValue;
  }

  const data = {};
  for (const field of definition.fields) {
    if (Object.prototype.hasOwnProperty.call(values, field.key)) {
      data[field.key] = values[field.key];
    }
  }

  return { metadata, data };
};

const hasAnyRowValue = (definition, data) =>
  definition.fields.some((field) => {
    const value = data[field.key];
    return value !== undefined && value !== null && String(value).trim() !== "";
  });

const hasConcreteValue = (value) =>
  value !== undefined && value !== null && String(value).trim() !== "";

const normalizeComparableValue = (type, value) => {
  if (value === undefined || value === null || value === "") return "";

  if (type === "NUMBER" || type === "AMOUNT") {
    return Number(value);
  }

  if (type === "DATE") {
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? String(value).trim()
      : date.toISOString().slice(0, 10);
  }

  return String(value).trim();
};

const areRowsEquivalent = (definition, left, right) =>
  definition.fields.every((field) => {
    const leftValue = normalizeComparableValue(field.type, left?.[field.key]);
    const rightValue = normalizeComparableValue(field.type, right?.[field.key]);

    return leftValue === rightValue;
  });

const ensureAssignedAccess = async ({ schemeId, user }) => {
  if (user.role === "SUPER_ADMIN") {
    return;
  }

  const assignment = await SchemeAssignment.findOne({
    scheme: schemeId,
    assignedTo: user._id,
    deletedAt: null,
  });

  if (!assignment) {
    throw new ApiError(403, "Scheme not assigned to you");
  }
};

const findExactAnswerMatch = async ({ schemeId, definition, data }) => {
  const answers = await SchemeAnswer.find({
    scheme: schemeId,
    deletedAt: null,
  }).select("data filledBy");

  return (
    answers.find((answer) =>
      areRowsEquivalent(definition, getAnswerDataObject(answer), data)
    ) || null
  );
};

const getAssignmentForUser = async ({ schemeId, user }) => {
  if (user.role === "SUPER_ADMIN") {
    return null;
  }

  return SchemeAssignment.findOne({
    scheme: schemeId,
    assignedTo: user._id,
    deletedAt: null,
  });
};

const requireCollaborativeAssignment = async ({ schemeId, user }) => {
  const assignment = await getAssignmentForUser({ schemeId, user });

  if (!assignment) {
    throw new ApiError(403, "Scheme not assigned to you");
  }

  return assignment;
};

/* ========================================================= */
/* ================= USER SUBMIT ============================ */
/* ========================================================= */

export const createSchemeAnswer = async (req, res, next) => {
  try {
    const { schemeId, data, source = "ONLINE" } = req.body;

    if (!schemeId || !data) {
      throw new ApiError(400, "schemeId and data are required");
    }

    const scheme = await Scheme.findOne({
      _id: schemeId,
      deletedAt: null,
    });

    assertSchemeAcceptingSubmissions(scheme);

    const definition = await SchemeDefinition.findOne({
      scheme: schemeId,
      deletedAt: null
    });

    if (!definition) {
      throw new ApiError(404, "Scheme definition not found");
    }

    // 🔐 Assignment check
    if (req.user.role !== "SUPER_ADMIN") {
      const assignment = await SchemeAssignment.findOne({
        scheme: schemeId,
        assignedTo: req.user._id,
        deletedAt: null
      });

      if (!assignment) {
        throw new ApiError(403, "Scheme not assigned to you");
      }

      if (req.user.role === "USER" && assignment.editableFields?.length) {
        throw new ApiError(
          403,
          "This scheme is configured for field-level contribution. Ask your admin to create the starter rows first."
        );
      }
    }

    await validateAnswerData({ definition, data });

    await checkDuplicateAnswer({ schemeId, definition, data });

    const answer = await SchemeAnswer.create({
      scheme: schemeId,
      schemeDefinition: definition._id,
      data,
      filledBy: req.user._id,
      source
    });

    return res
      .status(201)
      .json(new ApiResponse(201, { item: answer }, "Saved successfully"));
  } catch (err) {
    next(err);
  }
};

/* ========================================================= */
/* ================= LIST ANSWERS =========================== */
/* ========================================================= */
export const getSchemeAnswers = async (req, res, next) => {
  try {
    const { schemeId, fromDate, toDate } = req.query;

    const filter = { deletedAt: null };

    /* ================= SCHEME FILTER ================= */
    if (schemeId) {
      filter.scheme = schemeId;
    }

    /* ================= DATE FILTER ================= */
    if (fromDate || toDate) {
      filter.createdAt = {};
      if (fromDate) filter.createdAt.$gte = new Date(fromDate);
      if (toDate) filter.createdAt.$lte = new Date(toDate);
    }

    /* ================= ROLE BASED ACCESS ================= */

    // 🔴 SUPER ADMIN → all
    if (req.user.role === "SUPER_ADMIN") {
      // no extra filter
    }

    // 🟡 ADMIN → only subordinate users
    else if (req.user.role === "ADMIN") {
      const users = await User.find({
        createdBy: req.user._id,
        deletedAt: null,
      }).select("_id");

      filter.filledBy = { $in: [req.user._id, ...users.map((u) => u._id)] };
    }

    // 🟢 USER → only own
    else {
      filter.filledBy = req.user._id;
    }

    /* ================= QUERY ================= */
    const answers = await SchemeAnswer.find(filter)
      .populate("scheme", "name")
      .populate("filledBy", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          items: answers,
          total: answers.length,
        },
        "Scheme answers fetched successfully"
      )
    );
  } catch (err) {
    next(err);
  }
};


/* ========================================================= */
/* ================= UPDATE ================================ */
/* ========================================================= */

export const updateSchemeAnswer = async (req, res, next) => {
  try {
    const answer = await SchemeAnswer.findById(req.params.id);

    if (!answer || answer.deletedAt) {
      throw new ApiError(404, "Submission not found");
    }

    if (answer.filledBy.toString() !== req.user._id.toString()) {
      throw new ApiError(403, "Not allowed");
    }

    if (answer.hasEdited) {
      throw new ApiError(400, "Edit already used");
    }

    const scheme = await Scheme.findOne({
      _id: answer.scheme,
      deletedAt: null,
    });

    assertSchemeAcceptingSubmissions(scheme);

    const definition = await SchemeDefinition.findById(answer.schemeDefinition);

    await validateAnswerData({
      definition,
      data: req.body.data
    });

    answer.data = req.body.data;
    answer.hasEdited = true;
    answer.editedAt = new Date();

    await answer.save();

    return res
      .status(200)
      .json(new ApiResponse(200, { item: answer }, "Updated successfully"));
  } catch (err) {
    next(err);
  }
};

/* ========================================================= */
/* ================= DELETE ================================ */
/* ========================================================= */

export const deleteSchemeAnswer = async (req, res, next) => {
  try {
    const answer = await SchemeAnswer.findById(req.params.id);

    if (!answer || answer.deletedAt) {
      throw new ApiError(404, "Submission not found");
    }

    if (answer.filledBy.toString() !== req.user._id.toString()) {
      throw new ApiError(403, "Not allowed");
    }

    answer.deletedAt = new Date();
    await answer.save();

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Deleted successfully"));
  } catch (err) {
    next(err);
  }
};

/* ========================================================= */
/* ================= IMPORT EXCEL =========================== */
/* ========================================================= */

export const importSchemeAnswers = async (req, res, next) => {
  try {
    const { schemeId, rows } = req.body;

    if (!schemeId || !Array.isArray(rows)) {
      throw new ApiError(400, "schemeId and rows required");
    }

    const definition = await SchemeDefinition.findOne({
      scheme: schemeId,
      deletedAt: null
    });

    if (!definition) {
      throw new ApiError(404, "Scheme definition not found");
    }

    const results = {
      inserted: 0,
      skipped: 0,
      errors: []
    };

    for (const row of rows) {
      try {
        await validateAnswerData({ definition, data: row });

        await checkDuplicateAnswer({ schemeId, definition, data: row });

        await SchemeAnswer.create({
          scheme: schemeId,
          schemeDefinition: definition._id,
          data: row,
          filledBy: req.user._id,
          source: "EXCEL"
        });

        results.inserted++;
      } catch (err) {
        results.skipped++;
        results.errors.push(err.message);
      }
    }

    return res
      .status(200)
      .json(new ApiResponse(200, { summary: results }, "Import complete"));
  } catch (err) {
    next(err);
  }
};

/* ========================================================= */
/* ========== COLLABORATIVE WORKBOOK IMPORT ================ */
/* ========================================================= */

export const importCollaborativeWorkbook = async (req, res, next) => {
  try {
    const { schemeId, rows } = req.body;

    if (!schemeId || !Array.isArray(rows)) {
      throw new ApiError(400, "schemeId and rows required");
    }

    const scheme = await Scheme.findOne({
      _id: schemeId,
      deletedAt: null,
    });

    assertSchemeAcceptingSubmissions(scheme);

    const definition = await SchemeDefinition.findOne({
      scheme: schemeId,
      deletedAt: null,
    });

    if (!definition) {
      throw new ApiError(404, "Scheme definition not found");
    }

    await ensureAssignedAccess({
      schemeId,
      user: req.user,
    });
    const assignment = await getAssignmentForUser({
      schemeId,
      user: req.user,
    });
    const editableFields = new Set(assignment?.editableFields || []);
    const hasFieldRestrictions =
      req.user.role === "USER" && editableFields.size > 0;

    const results = {
      inserted: 0,
      updated: 0,
      skipped: 0,
      errors: [],
    };

    for (const rawRow of rows) {
      try {
        const { metadata, data } = extractWorkbookRow(rawRow, definition);
        const workbookRowId = metadata[WORKBOOK_META_COLUMNS.ROW_ID];

        if (!hasAnyRowValue(definition, data)) {
          results.skipped++;
          continue;
        }

        if (workbookRowId) {
          const existingAnswer = await SchemeAnswer.findById(workbookRowId);

          if (
            !existingAnswer ||
            existingAnswer.deletedAt ||
            existingAnswer.scheme.toString() !== schemeId
          ) {
            throw new ApiError(404, "Workbook row not found");
          }

          const existingData = getAnswerDataObject(existingAnswer);
          const mergedData = { ...existingData };
          let hasAnyChange = false;

          for (const field of definition.fields) {
            if (!Object.prototype.hasOwnProperty.call(data, field.key)) {
              continue;
            }

            const nextValue = data[field.key];
            if (!hasConcreteValue(nextValue)) {
              continue;
            }

            const previousValue = existingData[field.key];
            const normalizedNext = normalizeComparableValue(field.type, nextValue);
            const normalizedPrevious = normalizeComparableValue(
              field.type,
              previousValue
            );

            if (normalizedNext === normalizedPrevious) {
              continue;
            }

            hasAnyChange = true;

            if (hasFieldRestrictions && !editableFields.has(field.key)) {
              throw new ApiError(
                403,
                `You can only update assigned fields. '${field.label}' is locked.`
              );
            }

            mergedData[field.key] = nextValue;
          }

          if (!hasAnyChange) {
            results.skipped++;
            continue;
          }

          await validateAnswerData({
            definition,
            data: mergedData,
            allowPartial: true,
          });
          await checkDuplicateAnswer({
            schemeId,
            definition,
            data: mergedData,
            excludeAnswerId: existingAnswer._id,
          });

          existingAnswer.data = mergedData;
          await existingAnswer.save();
          results.updated++;
          continue;
        }

        if (hasFieldRestrictions) {
          throw new ApiError(
            403,
            "You can only fill assigned fields in existing rows. Ask your admin to create the starter rows first."
          );
        }

        const exactMatch = await findExactAnswerMatch({
          schemeId,
          definition,
          data,
        });

        if (exactMatch) {
          results.skipped++;
          continue;
        }

        await validateAnswerData({
          definition,
          data,
          allowPartial: true,
        });
        await checkDuplicateAnswer({ schemeId, definition, data });

        await SchemeAnswer.create({
          scheme: schemeId,
          schemeDefinition: definition._id,
          data,
          filledBy: req.user._id,
          source: "EXCEL",
        });

        results.inserted++;
      } catch (err) {
        results.skipped++;
        results.errors.push(err.message);
      }
    }

    return res.status(200).json(
      new ApiResponse(
        200,
        { summary: results },
        "Collaborative workbook import complete"
      )
    );
  } catch (err) {
    next(err);
  }
};

export const getCollaborativeSchemeRows = async (req, res, next) => {
  try {
    const { schemeId } = req.params;

    if (!schemeId) {
      throw new ApiError(400, "schemeId is required");
    }

    const definition = await SchemeDefinition.findOne({
      scheme: schemeId,
      deletedAt: null,
    });

    if (!definition) {
      throw new ApiError(404, "Scheme definition not found");
    }

    const assignment = await requireCollaborativeAssignment({
      schemeId,
      user: req.user,
    });

    const answers = await SchemeAnswer.find({
      scheme: schemeId,
      deletedAt: null,
    })
      .populate("filledBy", "name email")
      .sort({ createdAt: 1 });

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          items: answers.map((answer) => ({
            _id: answer._id,
            data: getAnswerDataObject(answer),
            source: answer.source,
            createdAt: answer.createdAt,
            filledBy: answer.filledBy,
          })),
          editableFields: assignment.editableFields || [],
          schemeName: definition.scheme?.name || "",
        },
        "Collaborative rows fetched successfully"
      )
    );
  } catch (err) {
    next(err);
  }
};

export const updateCollaborativeSchemeRow = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { data } = req.body;

    if (!data || typeof data !== "object") {
      throw new ApiError(400, "data is required");
    }

    const answer = await SchemeAnswer.findById(id);

    if (!answer || answer.deletedAt) {
      throw new ApiError(404, "Submission not found");
    }

    const scheme = await Scheme.findOne({
      _id: answer.scheme,
      deletedAt: null,
    });

    assertSchemeAcceptingSubmissions(scheme);

    const definition = await SchemeDefinition.findById(answer.schemeDefinition);

    if (!definition || definition.deletedAt) {
      throw new ApiError(404, "Scheme definition not found");
    }

    const assignment = await requireCollaborativeAssignment({
      schemeId: answer.scheme,
      user: req.user,
    });

    const editableFields = new Set(assignment.editableFields || []);

    if (req.user.role === "USER" && editableFields.size === 0) {
      throw new ApiError(403, "This row is not configured for field-level editing");
    }

    const existingData = getAnswerDataObject(answer);
    const mergedData = { ...existingData };
    let hasAnyChange = false;

    for (const field of definition.fields) {
      if (!Object.prototype.hasOwnProperty.call(data, field.key)) {
        continue;
      }

      if (req.user.role === "USER" && !editableFields.has(field.key)) {
        throw new ApiError(
          403,
          `You can only update assigned fields. '${field.label}' is locked.`
        );
      }

      const nextValue = data[field.key];

      if (!hasConcreteValue(nextValue)) {
        continue;
      }

      const normalizedNext = normalizeComparableValue(field.type, nextValue);
      const normalizedPrevious = normalizeComparableValue(
        field.type,
        existingData[field.key]
      );

      if (normalizedNext === normalizedPrevious) {
        continue;
      }

      mergedData[field.key] = nextValue;
      hasAnyChange = true;
    }

    if (!hasAnyChange) {
      throw new ApiError(400, "No editable changes found");
    }

    await validateAnswerData({
      definition,
      data: mergedData,
      allowPartial: true,
    });

    await checkDuplicateAnswer({
      schemeId: answer.scheme,
      definition,
      data: mergedData,
      excludeAnswerId: answer._id,
    });

    answer.data = mergedData;
    await answer.save();

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          item: {
            _id: answer._id,
            data: getAnswerDataObject(answer),
            createdAt: answer.createdAt,
          },
        },
        "Row updated successfully"
      )
    );
  } catch (err) {
    next(err);
  }
};

/* ========================================================= */
/* ================= EXPORT ================================ */
/* ========================================================= */

export const exportSchemeAnswers = async (req, res, next) => {
  try {
    const { schemeId } = req.query;

    if (!schemeId) {
      throw new ApiError(400, "schemeId is required");
    }

    const filter = {
      scheme: schemeId,
      deletedAt: null
    };

    const definition = await SchemeDefinition.findOne({
      scheme: schemeId,
      deletedAt: null,
    }).lean();

    if (!definition) {
      throw new ApiError(404, "Scheme definition not found");
    }

    if (req.user.role === "ADMIN") {
      const users = await User.find({
        createdBy: req.user._id,
        deletedAt: null
      }).select("_id");

      filter.filledBy = { $in: [req.user._id, ...users.map(u => u._id)] };
    }

    if (req.user.role === "USER") {
      filter.filledBy = req.user._id;
    }

    const answers = await SchemeAnswer.find(filter)
      .populate("filledBy", "name email")
      .sort({ createdAt: 1 })
      .lean();

    if (!answers.length) {
      throw new ApiError(404, "No data found");
    }

    const rows = answers.map((answer) => {
      const answerData = getAnswerDataObject(answer);
      const row = {};

      definition.fields.forEach((field) => {
        row[field.label] = answerData[field.key] ?? "";
      });

      row["scheme name"] = answer.scheme?.name || "";
      row["user name"] = answer.filledBy?.name || "Public";
      row["email"] = answer.filledBy?.email || "";
      row["created at"] = new Date(answer.createdAt).toLocaleString();
      row["source"] = answer.source || "";

      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Scheme Data");

    const buffer = XLSX.write(workbook, {
      type: "buffer",
      bookType: "xlsx"
    });

    res.setHeader(
      "Content-Disposition",
      "attachment; filename=scheme-data.xlsx"
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

/* ========================================================= */
/* ========== COLLABORATIVE WORKBOOK EXPORT ================ */
/* ========================================================= */

export const exportCollaborativeWorkbook = async (req, res, next) => {
  try {
    const { schemeId } = req.query;

    if (!schemeId) {
      throw new ApiError(400, "schemeId is required");
    }

    const definition = await SchemeDefinition.findOne({
      scheme: schemeId,
      deletedAt: null,
    });

    if (!definition) {
      throw new ApiError(404, "Scheme definition not found");
    }

    await ensureAssignedAccess({
      schemeId,
      user: req.user,
    });

    const answers = await SchemeAnswer.find({
      scheme: schemeId,
      deletedAt: null,
    })
      .populate("filledBy", "name email")
      .sort({ createdAt: 1 })
      .lean();

    const rows = answers.map((answer, index) => {
      const answerData = getAnswerDataObject(answer);
      const row = {};

      for (const field of definition.fields) {
        row[field.label] = answerData[field.key] ?? "";
      }

      row[WORKBOOK_META_COLUMNS.OWNER_NAME] = answer.filledBy?.name || "Public";
      row[WORKBOOK_META_COLUMNS.OWNER_EMAIL] = answer.filledBy?.email || "";
      row[WORKBOOK_META_COLUMNS.SOURCE] = answer.source || "";

      return row;
    });

    const metadataRows = answers.map((answer, index) => ({
      [WORKBOOK_META_COLUMNS.ROW_NUMBER]: index + 1,
      [WORKBOOK_META_COLUMNS.ROW_ID]: answer._id.toString(),
      [WORKBOOK_META_COLUMNS.OWNER_ID]: answer.filledBy?._id?.toString() || "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(
      rows.length
        ? rows
        : [
            Object.fromEntries([
              ...definition.fields.map((field) => [field.label, ""]),
              [WORKBOOK_META_COLUMNS.OWNER_NAME, ""],
              [WORKBOOK_META_COLUMNS.OWNER_EMAIL, ""],
              [WORKBOOK_META_COLUMNS.SOURCE, ""],
            ]),
          ]
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Shared Scheme Data");

    const metadataSheet = XLSX.utils.json_to_sheet(
      metadataRows.length
        ? metadataRows
        : [
            {
              [WORKBOOK_META_COLUMNS.ROW_NUMBER]: "",
              [WORKBOOK_META_COLUMNS.ROW_ID]: "",
              [WORKBOOK_META_COLUMNS.OWNER_ID]: "",
            },
          ]
    );
    XLSX.utils.book_append_sheet(workbook, metadataSheet, "__meta");
    workbook.Workbook = workbook.Workbook || {};
    workbook.Workbook.Sheets = workbook.Workbook.Sheets || [];
    if (workbook.Workbook.Sheets[1]) {
      workbook.Workbook.Sheets[1].Hidden = 1;
    }

    const buffer = XLSX.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    });

    res.setHeader(
      "Content-Disposition",
      "attachment; filename=scheme-workbook.xlsx"
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
