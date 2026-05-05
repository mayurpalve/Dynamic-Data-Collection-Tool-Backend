import mongoose from "mongoose";

const schemeAnswerSchema = new mongoose.Schema(
  {
    scheme: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Scheme",
      required: true
    },

    schemeDefinition: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SchemeDefinition",
      required: true
    },

    data: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      required: true
    },

    filledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default:null,
      index: true
    },

    hasEdited: {
      type: Boolean,
      default: false
    },

    editedAt: {
      type: Date,
      default: null
    },

    source: {
      type: String,
      enum: ["ONLINE", "EXCEL" , "PUBLIC"],
      default: "ONLINE"
    },

    deletedAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

export default mongoose.model("SchemeAnswer", schemeAnswerSchema);
