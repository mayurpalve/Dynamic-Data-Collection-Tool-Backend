import * as roleService from "./role.service.js";
import { ApiResponse } from "../../utils/ApiResponse.js";

/* CREATE ROLE */
export const createRole = async (req, res, next) => {
  try {
    const role = await roleService.createRole(req.body);

    return res.status(201).json(
      new ApiResponse(
        201,
        { item: role },
        "Role created successfully"
      )
    );
  } catch (err) {
    next(err);
  }
};

/* LIST ROLES */
export const getRoles = async (req, res, next) => {
  try {
    const roles = await roleService.listRoles();

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          items: roles,
          total: roles.length
        },
        "Roles fetched successfully"
      )
    );
  } catch (err) {
    next(err);
  }
};

/* DELETE ROLE */
export const deleteRole = async (req, res, next) => {
  try {
    const role = await roleService.deleteRole(req.params.id);

    return res.status(200).json(
      new ApiResponse(
        200,
        { item: role },
        "Role deleted successfully"
      )
    );
  } catch (err) {
    next(err);
  }
};

/* UPDATE ROLE */
export const updateRole = async (req, res, next) => {
  try {
    const role = await roleService.updateRole(
      req.params.id,
      req.body
    );

    return res.status(200).json(
      new ApiResponse(
        200,
        { item: role },
        "Role updated successfully"
      )
    );
  } catch (err) {
    next(err);
  }
};
