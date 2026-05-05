import * as userService from "./user.service.js";
import { ApiResponse } from "../../utils/ApiResponse.js";

/* CREATE USER */
export const createUser = async (req, res, next) => {
  try {
    const user = await userService.createUser(
      req.body,
      req.user   // 🔥 pass current logged-in user
    );

    return res.status(201).json(
      new ApiResponse(
        201,
        { item: user },
        "User created successfully"
      )
    );
  } catch (err) {
    next(err);
  }
};

/* ACTIVATE / DEACTIVATE USER */
export const setUserStatus = async (req, res, next) => {
  try {
    const user = await userService.toggleUserStatus(
      req.params.id,
      req.body.isActive,
      req.user   // 🔥 hierarchy validation
    );

    return res.status(200).json(
      new ApiResponse(
        200,
        { item: user },
        "User status updated successfully"
      )
    );
  } catch (err) {
    next(err);
  }
};

/* SOFT DELETE USER */
export const deleteUser = async (req, res, next) => {
  try {
    const user = await userService.softDeleteUser(
      req.params.id,
      req.user   // 🔥 hierarchy validation
    );

    return res.status(200).json(
      new ApiResponse(
        200,
        { item: user },
        "User deleted successfully"
      )
    );
  } catch (err) {
    next(err);
  }
};

/* LIST USERS */
export const getUsers = async (req, res, next) => {
  try {
    const users = await userService.listUsers(
      req.user   // 🔥 role-based filtering
    );

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          items: users,
          total: users.length
        },
        "Users fetched successfully"
      )
    );
  } catch (err) {
    next(err);
  }
};
