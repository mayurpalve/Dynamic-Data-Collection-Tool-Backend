import {
  assignScheme as assignService,
  revokeSchemeAssignment as revokeAssignmentService,
  updateSchemeAssignment as updateAssignmentService,
} from "./schemeAccess.service.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import SchemeAssignment from "./schemeAssignment.model.js";

export const assignScheme = async (req, res, next) => {
  try {
    const assignment = await assignService({
      schemeId: req.body.schemeId,
      targetUserId: req.body.targetUserId,
      editableFields: req.body.editableFields || [],
      currentUser: req.user,
    });

    return res.status(201).json(
      new ApiResponse(
        201,
        { item: assignment },
        "Scheme assigned successfully"
      )
    );
  } catch (err) {
    next(err);
  }
};

export const getMyAssignments = async (req, res) => {
  const data = await SchemeAssignment.find({
    assignedTo: req.user._id,
    deletedAt: null,
  }).populate("scheme");

  res.json(new ApiResponse(200, { items: data }));
};

export const getAssignmentsByScheme = async (req, res, next) => {
  try {
    const filter = {
      scheme: req.params.schemeId,
      deletedAt: null,
    };

    if (req.user.role === "ADMIN") {
      filter.assignedBy = req.user._id;
    }

    const items = await SchemeAssignment.find(filter)
      .populate("assignedTo", "name email role")
      .populate("assignedBy", "name email role")
      .populate("scheme", "name");

    return res.json(new ApiResponse(200, { items }));
  } catch (err) {
    next(err);
  }
};

export const updateSchemeAssignment = async (req, res, next) => {
  try {
    const assignment = await updateAssignmentService({
      assignmentId: req.params.id,
      editableFields: req.body.editableFields || [],
      currentUser: req.user,
    });

    const item = await SchemeAssignment.findById(assignment._id)
      .populate("assignedTo", "name email role")
      .populate("assignedBy", "name email role")
      .populate("scheme", "name");

    return res.json(
      new ApiResponse(200, { item }, "Assignment updated successfully")
    );
  } catch (err) {
    next(err);
  }
};

export const revokeSchemeAssignment = async (req, res, next) => {
  try {
    await revokeAssignmentService({
      assignmentId: req.params.id,
      currentUser: req.user,
    });

    return res.json(
      new ApiResponse(
        200,
        { item: { _id: req.params.id } },
        "Assignment revoked successfully"
      )
    );
  } catch (err) {
    next(err);
  }
};
