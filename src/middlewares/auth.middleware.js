import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";
import User from "../modules/user/user.model.js";

export const protect = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) return next(new ApiError(401, "Unauthorized"));

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);

    const user = await User.findById(decoded.id)
      .populate("role", "name")
      .lean();

    if (!user || !user.isActive || user.isDeleted) {
      throw new ApiError(401, "Unauthorized");
    }

    req.user = user;

    next();
  } catch (error) {
    next(new ApiError(401, "Invalid token"));
  }
};
