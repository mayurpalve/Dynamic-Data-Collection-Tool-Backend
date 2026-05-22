import * as notificationService from "./notification.service.js";
import { ApiResponse } from "../../utils/ApiResponse.js";

export const getNotifications = async (req, res, next) => {
  try {
    const items = await notificationService.listNotificationsForUser(req.user._id);

    return res.status(200).json(
      new ApiResponse(200, { items, total: items.length }, "Notifications fetched successfully")
    );
  } catch (err) {
    next(err);
  }
};

export const getUnreadCount = async (req, res, next) => {
  try {
    const count = await notificationService.getUnreadNotificationCount(req.user._id);

    return res.status(200).json(
      new ApiResponse(200, { count }, "Unread notification count fetched successfully")
    );
  } catch (err) {
    next(err);
  }
};

export const markNotificationRead = async (req, res, next) => {
  try {
    const item = await notificationService.markNotificationRead({
      notificationId: req.params.id,
      userId: req.user._id,
    });

    return res.status(200).json(
      new ApiResponse(200, { item }, "Notification marked as read")
    );
  } catch (err) {
    next(err);
  }
};

export const markAllNotificationsRead = async (req, res, next) => {
  try {
    await notificationService.markAllNotificationsRead(req.user._id);

    return res.status(200).json(
      new ApiResponse(200, { success: true }, "All notifications marked as read")
    );
  } catch (err) {
    next(err);
  }
};

export const deleteNotification = async (req, res, next) => {
  try {
    const item = await notificationService.deleteNotification({
      notificationId: req.params.id,
      userId: req.user._id,
    });

    return res.status(200).json(
      new ApiResponse(200, { item }, "Notification deleted successfully")
    );
  } catch (err) {
    next(err);
  }
};
