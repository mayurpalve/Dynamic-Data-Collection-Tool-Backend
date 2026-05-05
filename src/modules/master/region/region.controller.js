import * as service from "./region.service.js";
import { ApiResponse } from "../../../utils/ApiResponse.js";

/* CREATE REGION */
export const create = async (req, res, next) => {
  try {
    const region = await service.createRegion(
      req.body,
      req.user._id
    );

    return res.status(201).json(
      new ApiResponse(
        201,
        { item: region },
        "Region created successfully"
      )
    );
  } catch (err) {
    next(err);
  }
};

/* LIST REGIONS */
export const list = async (req, res, next) => {
  try {
    const data = await service.listRegions();

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          items: data,
          total: data.length
        },
        "Regions fetched successfully"
      )
    );
  } catch (err) {
    next(err);
  }
};
