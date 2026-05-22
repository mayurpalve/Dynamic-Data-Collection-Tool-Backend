import SchemeAssignment from "./schemeAssignment.model.js";
import User from "../user/user.model.js";
import Scheme from "../scheme/scheme.model.js";
import SchemeDefinition from "../schemeDefinition/schemeDefinition.model.js";
import { ApiError } from "../../utils/ApiError.js";
import { createNotification } from "../notification/notification.service.js";

const validateHierarchyForAssignment = ({ currentUser, targetUser }) => {
  if (currentUser.role === "SUPER_ADMIN") {
    if (targetUser.role !== "ADMIN") {
      throw new ApiError(400, "Super Admin can assign only to Admin");
    }
    return;
  }

  if (currentUser.role === "ADMIN") {
    if (targetUser.role !== "USER") {
      throw new ApiError(400, "Admin can assign only to User");
    }

    if (targetUser.createdBy?.toString() !== currentUser._id.toString()) {
      throw new ApiError(403, "Cannot assign scheme outside your hierarchy");
    }
    return;
  }

  throw new ApiError(403, "Not allowed to assign scheme");
};

const validateEditableFields = async ({ schemeId, editableFields = [] }) => {
  const definition = await SchemeDefinition.findOne({
    scheme: schemeId,
    deletedAt: null,
  }).select("fields");

  if (!definition) {
    throw new ApiError(404, "Scheme definition not found");
  }

  const allowedFieldKeys = new Set(definition.fields.map((field) => field.key));
  const invalidFields = editableFields.filter((fieldKey) => !allowedFieldKeys.has(fieldKey));

  if (invalidFields.length) {
    throw new ApiError(400, `Invalid editable fields: ${invalidFields.join(", ")}`);
  }
};

const assertAssignmentAccess = async ({ assignment, currentUser }) => {
  const targetUser = await User.findById(assignment.assignedTo);

  if (!targetUser || targetUser.deletedAt) {
    throw new ApiError(404, "Assigned user not found");
  }

  if (currentUser.role === "SUPER_ADMIN") {
    return;
  }

  if (currentUser.role === "ADMIN") {
    if (assignment.assignedBy.toString() !== currentUser._id.toString()) {
      throw new ApiError(403, "You can manage only your own assignments");
    }

    if (targetUser.createdBy?.toString() !== currentUser._id.toString()) {
      throw new ApiError(403, "Cannot manage assignments outside your hierarchy");
    }
    return;
  }

  throw new ApiError(403, "Not allowed to manage assignments");
};

export const assignScheme = async ({
  schemeId,
  targetUserId,
  editableFields = [],
  currentUser,
}) => {
  const scheme = await Scheme.findById(schemeId);
  if (!scheme || scheme.deletedAt) {
    throw new ApiError(404, "Scheme not found");
  }

  const targetUser = await User.findById(targetUserId);
  if (!targetUser || targetUser.deletedAt) {
    throw new ApiError(404, "Target user not found");
  }

  validateHierarchyForAssignment({ currentUser, targetUser });
  await validateEditableFields({ schemeId, editableFields });

  const existing = await SchemeAssignment.findOne({
    scheme: schemeId,
    assignedTo: targetUserId,
    deletedAt: null,
  });

  if (existing) {
    throw new ApiError(400, "Scheme already assigned");
  }

  const assignment = await SchemeAssignment.create({
    scheme: schemeId,
    assignedTo: targetUserId,
    assignedBy: currentUser._id,
    editableFields,
  });

  await createNotification({
    userId: targetUserId,
    title: "New scheme assigned",
    message: editableFields.length
      ? `${scheme.name} was assigned to you with selected editable fields.`
      : `${scheme.name} was assigned to you for full-form access.`,
    type: "SCHEME_ASSIGNED",
    entityType: "ASSIGNMENT",
    entityId: assignment._id,
  });

  return assignment;
};

export const updateSchemeAssignment = async ({
  assignmentId,
  editableFields = [],
  currentUser,
}) => {
  const assignment = await SchemeAssignment.findById(assignmentId);

  if (!assignment || assignment.deletedAt) {
    throw new ApiError(404, "Assignment not found");
  }

  await assertAssignmentAccess({ assignment, currentUser });
  await validateEditableFields({ schemeId: assignment.scheme, editableFields });

  assignment.editableFields = editableFields;
  await assignment.save();

  return assignment;
};

export const revokeSchemeAssignment = async ({
  assignmentId,
  currentUser,
}) => {
  const assignment = await SchemeAssignment.findById(assignmentId);

  if (!assignment || assignment.deletedAt) {
    throw new ApiError(404, "Assignment not found");
  }

  await assertAssignmentAccess({ assignment, currentUser });

  assignment.deletedAt = new Date();
  await assignment.save();

  return assignment;
};
