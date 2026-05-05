import mongoose from "mongoose";

const schemeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },

    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
    },
    division: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Division",
    },
    district: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "District",
    },
    taluka: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Taluka",
    },
    region: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Region",
    },

    status: {
      type: String,
      enum: ["DRAFT", "ACTIVE", "INACTIVE"],
      default: "DRAFT",
    },

    opensAt: {
      type: Date,
      default: null,
    },

    closesAt: {
      type: Date,
      default: null,
    },

    isPublic: {
      type: Boolean,
      default: false,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Scheme", schemeSchema);
