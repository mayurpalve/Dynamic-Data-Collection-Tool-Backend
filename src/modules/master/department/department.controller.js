import * as service from "./department.service.js";
import { ApiResponse } from "../../../utils/ApiResponse.js";

/* CREATE DEPARTMENT */
export const create = async (req, res, next) => {
  try {
    const dept = await service.createDepartment(
      req.body,
      req.user._id
    );

    return res.status(201).json(
      new ApiResponse(
        201,
        { item: dept },
        "Department created successfully"
      )
    );
  } catch (err) {
    next(err);
  }
};

/* LIST DEPARTMENTS */
export const list = async (req, res, next) => {
  try {
    const data = await service.listDepartments();

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          items: data,
          total: data.length
        },
        "Departments fetched successfully"
      )
    );
  } catch (err) {
    next(err);
  }
};

/* SOFT DELETE DEPARTMENT */
export const remove = async (req, res, next) => {
  try {
    const data = await service.deleteDepartment(
      req.params.id,
      req.user._id
    );

    return res.status(200).json(
      new ApiResponse(
        200,
        { item: data },
        "Department deleted successfully"
      )
    );
  } catch (err) {
    next(err);
  }
};
