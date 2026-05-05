import * as service from "./taluka.service.js";
import { ApiResponse } from "../../../utils/ApiResponse.js";

/* CREATE TALUKA */
export const create = async (req, res, next) => {
  try {
    const taluka = await service.createTaluka(
      req.body,
      req.user._id
    );

    return res.status(201).json(
      new ApiResponse(
        201,
        { item: taluka },
        "Taluka created successfully"
      )
    );
  } catch (err) {
    next(err);
  }
};

/* LIST TALUKAS */
export const list = async (req, res, next) => {
  try {
    const { district } = req.query;
    const data = await service.listTalukas(district);

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          items: data,
          total: data.length
        },
        "Talukas fetched successfully"
      )
    );
  } catch (err) {
    next(err);
  }
};
