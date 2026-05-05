import Department from "./department.model.js";
import { ApiError } from "../../../utils/ApiError.js";

export const createDepartment = async (data, userId) => {
  const name = data.name?.trim();

  if (!name) {
    throw new ApiError(400, "Department name is required");
  }

  // ✅ AUTO-GENERATE CODE
  const code = name.toUpperCase().replace(/\s+/g, "_");

  const exists = await Department.findOne({
    code,
    deletedAt: null
  });

  if (exists) {
    throw new ApiError(400, "Department already exists");
  }

  return Department.create({
    name,
    code,            // ✅ REQUIRED FIELD FIXED
    createdBy: userId
  });
};

export const listDepartments = async () => {
  return Department.find({ deletedAt: null }).sort({ name: 1 });
};

//added new delete function 
export const deleteDepartment = async (id, userId) => {
  const dept = await Department.findOne({
    _id: id,
    deletedAt: null
  });

  if (!dept) {
    throw new ApiError(404, "Department not found");
  }

  dept.deletedAt = new Date();
  dept.deletedBy = userId;

  await dept.save();
  return dept;
};
