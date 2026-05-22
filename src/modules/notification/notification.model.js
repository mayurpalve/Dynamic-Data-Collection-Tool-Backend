import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: [
        "SCHEME_ASSIGNED",
        "SCHEME_UPDATED",
        "SCHEME_WINDOW_CHANGED",
        "SCHEME_STATUS_CHANGED",
      ],
      required: true,
      index: true,
    },
    entityType: {
      type: String,
      enum: ["SCHEME", "ASSIGNMENT"],
      default: "SCHEME",
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Notification", notificationSchema);
