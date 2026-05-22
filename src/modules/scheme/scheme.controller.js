import Scheme from "./scheme.model.js";
import SchemeAssignment from "../schemeAccess/schemeAssignment.model.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { ApiError } from "../../utils/ApiError.js";
import { validateSchemeWindow } from "./schemeWindow.service.js";
import { createManyNotifications } from "../notification/notification.service.js";

const formatDateLabel = (value) => {
  if (!value) return "not set";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "not set" : date.toLocaleString();
};

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

    const previous = {
      name: scheme.name,
      status: scheme.status,
      opensAt: scheme.opensAt,
      closesAt: scheme.closesAt,
      description: scheme.description,
    };

    Object.assign(scheme, {
      name: req.body.name ?? scheme.name,
      description: req.body.description ?? scheme.description,
      status: req.body.status ?? scheme.status,
      opensAt: req.body.opensAt || null,
      closesAt: req.body.closesAt || null,
    });

    await scheme.save();

    const assignments = await SchemeAssignment.find({
      scheme: scheme._id,
      deletedAt: null,
    }).select("assignedTo");

    const notificationItems = [];

    if (previous.status !== scheme.status) {
      assignments.forEach((assignment) => {
        notificationItems.push({
          userId: assignment.assignedTo,
          title: "Scheme status updated",
          message: `${scheme.name} status changed from ${previous.status} to ${scheme.status}.`,
          type: "SCHEME_STATUS_CHANGED",
          entityType: "SCHEME",
          entityId: scheme._id,
        });
      });
    }

    if (
      String(previous.opensAt || "") !== String(scheme.opensAt || "") ||
      String(previous.closesAt || "") !== String(scheme.closesAt || "")
    ) {
      assignments.forEach((assignment) => {
        notificationItems.push({
          userId: assignment.assignedTo,
          title: "Scheme submission window updated",
          message: `${scheme.name} window updated. Opens: ${formatDateLabel(
            scheme.opensAt
          )}. Closes: ${formatDateLabel(scheme.closesAt)}.`,
          type: "SCHEME_WINDOW_CHANGED",
          entityType: "SCHEME",
          entityId: scheme._id,
        });
      });
    }

    if (
      previous.name !== scheme.name ||
      previous.description !== scheme.description
    ) {
      assignments.forEach((assignment) => {
        notificationItems.push({
          userId: assignment.assignedTo,
          title: "Scheme details updated",
          message: `${scheme.name} details were updated. Review the latest information before submitting.`,
          type: "SCHEME_UPDATED",
          entityType: "SCHEME",
          entityId: scheme._id,
        });
      });
    }

    await createManyNotifications(notificationItems);

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
