import SchemeAssignment from "../schemeAccess/schemeAssignment.model.js";
import User from "../user/user.model.js";

export const canUserFillScheme = async ({ scheme, user }) => {
  if (!user) return false;

  // Super Admin can access everything
  if (user.role === "SUPER_ADMIN") return true;

  // Check if scheme is assigned to this user directly
  const directAssignment = await SchemeAssignment.findOne({
    scheme: scheme._id,
    assignedTo: user._id,
    deletedAt: null
  });

  if (directAssignment) return true;

  // If user is ADMIN → check if assigned to them
  if (user.role === "ADMIN") {
    const assignment = await SchemeAssignment.findOne({
      scheme: scheme._id,
      assignedTo: user._id,
      deletedAt: null
    });

    return !!assignment;
  }

  // If user is USER → must be assigned by their admin
  if (user.role === "USER") {
    const assignment = await SchemeAssignment.findOne({
      scheme: scheme._id,
      assignedTo: user._id,
      deletedAt: null
    });

    return !!assignment;
  }

  return false;
};