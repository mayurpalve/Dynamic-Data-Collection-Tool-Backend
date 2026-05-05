import Scheme from "./scheme.model.js";
import SchemeAssignment from "../schemeAccess/schemeAssignment.model.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { ApiError } from "../../utils/ApiError.js";
import { validateSchemeWindow } from "./schemeWindow.service.js";

export const createScheme = async (req, res, next) => {
  try {
    if (req.user.role !== "SUPER_ADMIN") {
      throw new ApiError(403, "Only Super Admin can create schemes");
    }

    validateSchemeWindow(req.body);

    const scheme = await Scheme.create({
      ...req.body,
      createdBy: req.user._id,
      deletedAt: null,
    });

    res
      .status(201)
      .json(new ApiResponse(201, { item: scheme }, "Scheme created"));
  } catch (err) {
    next(err);
  }
};

export const listSchemes = async (req, res, next) => {
  try {
    if (req.user.role === "SUPER_ADMIN") {
      const schemes = await Scheme.find({ deletedAt: null })
        .populate("department division district taluka region")
        .sort({ createdAt: -1 });

      return res.status(200).json(
        new ApiResponse(200, {
          items: schemes,
          total: schemes.length,
        })
      );
    }

    const assignments = await SchemeAssignment.find({
      assignedTo: req.user._id,
      deletedAt: null,
    }).select("scheme");

    const schemeIds = assignments.map((a) => a.scheme);

    const schemes = await Scheme.find({
      _id: { $in: schemeIds },
      deletedAt: null,
    })
      .populate("department division district taluka region")
      .sort({ createdAt: -1 });

    res.status(200).json(
      new ApiResponse(200, {
        items: schemes,
        total: schemes.length,
      })
    );
  } catch (err) {
    next(err);
  }
};

export const updateScheme = async (req, res, next) => {
  try {
    if (req.user.role !== "SUPER_ADMIN") {
      throw new ApiError(403, "Only Super Admin can update schemes");
    }

    const scheme = await Scheme.findById(req.params.id);

    if (!scheme || scheme.deletedAt) {
      throw new ApiError(404, "Scheme not found");
    }

    validateSchemeWindow(req.body);

    Object.assign(scheme, {
      name: req.body.name ?? scheme.name,
      description: req.body.description ?? scheme.description,
      status: req.body.status ?? scheme.status,
      opensAt: req.body.opensAt || null,
      closesAt: req.body.closesAt || null,
    });

    await scheme.save();

    return res
      .status(200)
      .json(new ApiResponse(200, { item: scheme }, "Scheme updated successfully"));
  } catch (err) {
    next(err);
  }
};

export const deleteScheme = async (req, res, next) => {
  try {
    if (req.user.role !== "SUPER_ADMIN") {
      throw new ApiError(403, "Only Super Admin can delete schemes");
    }

    const scheme = await Scheme.findById(req.params.id);

    if (!scheme || scheme.deletedAt) {
      throw new ApiError(404, "Scheme not found");
    }

    const isAssigned = await SchemeAssignment.findOne({
      scheme: scheme._id,
      deletedAt: null,
    });

    if (isAssigned) {
      throw new ApiError(400, "Scheme is assigned to users. Cannot delete.");
    }

    scheme.deletedAt = new Date();
    await scheme.save();

    res
      .status(200)
      .json(new ApiResponse(200, {}, "Scheme deleted successfully"));
  } catch (err) {
    next(err);
  }
};
