import Role from "./role.model.js";
import { ApiError } from "../../utils/ApiError.js";
import { PERMISSIONS } from "../../constants/permissions.js";

const ALL_PERMISSIONS = Object.values(PERMISSIONS);

export const createRole = async ({ name, permissions }) => {
  const normalizedName = String(name || "")
    .trim()
    .replace(/\s+/g, " ")
    .toUpperCase();

  if (!normalizedName) {
    throw new ApiError(400, "Role name required");
  }

  if (!Array.isArray(permissions) || permissions.length === 0) {
    throw new ApiError(400, "Select at least one permission");
  }

  const exists = await Role.findOne({ name: normalizedName });
  if (exists) {
    throw new ApiError(400, `Role ${normalizedName} already exists`);
  }

  const invalid = permissions.filter(p => !ALL_PERMISSIONS.includes(p));
  if (invalid.length) {
    throw new ApiError(400, `Invalid permissions: ${invalid.join(", ")}`);
  }

  return Role.create({ name: normalizedName, permissions });
};

export const listRoles = async () => {
  return Role.find();
};

export const deleteRole = async (id) => {
  const role = await Role.findById(id);
  if (!role) throw new ApiError(404, "Role not found");

  await role.deleteOne();
  return role;
};

export const updateRole = async (id, payload) => {
  if (payload.permissions) {
    const invalid = payload.permissions.filter(
      (permission) => !ALL_PERMISSIONS.includes(permission)
    );

    if (invalid.length) {
      throw new ApiError(400, `Invalid permissions: ${invalid.join(", ")}`);
    }
  }

  return Role.findByIdAndUpdate(id, payload, { new: true });
};
