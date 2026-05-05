import * as service from "./district.service.js";
import { ApiResponse } from "../../../utils/ApiResponse.js";

/* CREATE DISTRICT */
export const create = async (req, res, next) => {
  try {
    const district = await service.createDistrict(
      req.body,
      req.user._id
    );

    return res.status(201).json(
      new ApiResponse(
        201,
        { item: district },
        "District created successfully"
      )
    );
  } catch (err) {
    next(err);
  }
};

/* LIST DISTRICTS */
export const list = async (req, res, next) => {
  try {
    const { division } = req.query;
    const data = await service.listDistricts(division);

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          items: data,
          total: data.length
        },
        "Districts fetched successfully"
      )
    );
  } catch (err) {
    next(err);
  }
};
