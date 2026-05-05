import { ApiError } from "../utils/ApiError.js";

/**
 * Role Guard Middleware
 */
export const allowRoles = (...roles) => {
  return (req, res, next) => {

    if (!req.user?.role) {
      return next(new ApiError(403, "Role not found"));
    }

    if (!roles.includes(req.user.role)) {
      return next(new ApiError(403, "Access denied"));
    }

    next();
  };
};


/**
 * Permission Guard Middleware
 */
export const hasPermission = (permission) => {
  return (req, res, next) => {

    if (!req.user?.role) {
      return next(new ApiError(403, "Role not found"));
    }

    // Super Admin override
    if (req.user.role === "SUPER_ADMIN") {
      return next();
    }

    if (
      !req.user.permissions ||
      !req.user.permissions.includes(permission)
    ) {
      return next(new ApiError(403, "Permission denied"));
    }

    next();
  };
};
