import Notification from "./notification.model.js";
import { ApiError } from "../../utils/ApiError.js";

export const createNotification = async ({
  userId,
  title,
  message,
  type,
  entityType = "SCHEME",
  entityId,
}) =>
  Notification.create({
    user: userId,
    title,
    message,
    type,
    entityType,
    entityId,
  });

export const createManyNotifications = async (items = []) => {
  if (!items.length) return [];

  const sanitized = items
    .filter((item) => item?.userId && item?.title && item?.message && item?.type && item?.entityId)
    .map((item) => ({
      user: item.userId,
      title: item.title,
      message: item.message,
      type: item.type,
      entityType: item.entityType || "SCHEME",
      entityId: item.entityId,
    }));

  if (!sanitized.length) return [];

  return Notification.insertMany(sanitized);
};

export const listNotificationsForUser = async (userId) =>
  Notification.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(20);

export const getUnreadNotificationCount = async (userId) =>
  Notification.countDocuments({
    user: userId,
    isRead: false,
  });

export const markNotificationRead = async ({ notificationId, userId }) => {
  const notification = await Notification.findOne({
    _id: notificationId,
    user: userId,
  });

  if (!notification) {
    throw new ApiError(404, "Notification not found");
  }

  notification.isRead = true;
  await notification.save();

  return notification;
};

export const markAllNotificationsRead = async (userId) => {
  await Notification.updateMany(
    {
      user: userId,
      isRead: false,
    },
    {
      $set: { isRead: true },
    }
  );
};

export const deleteNotification = async ({ notificationId, userId }) => {
  const notification = await Notification.findOne({
    _id: notificationId,
    user: userId,
  });

  if (!notification) {
    throw new ApiError(404, "Notification not found");
  }

  await notification.deleteOne();

  return notification;
};
