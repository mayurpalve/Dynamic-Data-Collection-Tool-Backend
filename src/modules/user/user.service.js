import User from "./user.model.js";
import { ApiError } from "../../utils/ApiError.js";
import { PERMISSIONS } from "../../constants/permissions.js";

const ALL_PERMISSIONS = Object.values(PERMISSIONS);

export const createUser = async (payload, currentUser) => {
  const exists = await User.findOne({
    email: payload.email,
    deletedAt: null,
  });

  if (exists) {
    throw new ApiError(400, "User already exists");
  }

  if (currentUser.role === "USER") {
    throw new ApiError(403, "You are not allowed to create users");
  }

  if (currentUser.role === "SUPER_ADMIN" && payload.role !== "ADMIN") {
    throw new ApiError(400, "Super Admin can only create Admin");
  }

  if (currentUser.role === "ADMIN" && payload.role !== "USER") {
    throw new ApiError(400, "Admin can only create User");
  }

  if (payload.role === "SUPER_ADMIN") {
    payload.permissions = ALL_PERMISSIONS;
  }

  if (payload.role === "ADMIN") {
    payload.permissions = ALL_PERMISSIONS;
  }

  payload.createdBy = currentUser._id;

  return User.create(payload);
};

export const toggleUserStatus = async (id, isActive, currentUser) => {
  const user = await User.findById(id);
  if (!user) throw new ApiError(404, "User not found");

  if (
    currentUser.role !== "SUPER_ADMIN" &&
    user.createdBy?.toString() !== currentUser._id.toString()
  ) {
    throw new ApiError(403, "Not allowed");
  }

  user.isActive = isActive;
  await user.save();
  return user;
};

export const softDeleteUser = async (id, currentUser) => {
  const user = await User.findById(id);
  if (!user) throw new ApiError(404, "User not found");

  if (
    currentUser.role !== "SUPER_ADMIN" &&
    user.createdBy?.toString() !== currentUser._id.toString()
  ) {
    throw new ApiError(403, "Not allowed");
  }

  user.deletedAt = new Date();
  await user.save();
  return user;
};

export const listUsers = async (currentUser) => {
  if (currentUser.role === "SUPER_ADMIN") {
    return User.find({ deletedAt: null }).select("-password");
  }

  if (currentUser.role === "ADMIN") {
    return User.find({
      deletedAt: null,
      createdBy: currentUser._id,
    }).select("-password");
  }

  return User.find({
    _id: currentUser._id,
    deletedAt: null,
  }).select("-password");
};

export const updateUserPermissions = async (
  id,
  permissions,
  currentUser
) => {
  if (currentUser.role !== "SUPER_ADMIN") {
    throw new ApiError(403, "Only Super Admin can update permissions");
  }

  const invalid = permissions.filter((p) => !ALL_PERMISSIONS.includes(p));

  if (invalid.length) {
    throw new ApiError(400, `Invalid permissions: ${invalid.join(", ")}`);
  }

  return User.findByIdAndUpdate(id, { permissions }, { new: true });
};
