import * as service from "./division.service.js";
import { ApiResponse } from "../../../utils/ApiResponse.js";

/* CREATE DIVISION */
export const create = async (req, res, next) => {
  try {
    const division = await service.createDivision(
      req.body,
      req.user._id
    );

    return res.status(201).json(
      new ApiResponse(
        201,
        { item: division },
        "Division created successfully"
      )
    );
  } catch (err) {
    next(err);
  }
};

/* LIST DIVISIONS */
export const list = async (req, res, next) => {
  try {
    const data = await service.listDivisions();

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          items: data,
          total: data.length
        },
        "Divisions fetched successfully"
      )
    );
  } catch (err) {
    next(err);
  }
};
