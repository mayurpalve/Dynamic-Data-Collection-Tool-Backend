import mongoose from "mongoose";

const fieldSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      trim: true
    },
    label: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: ["TEXT", "NUMBER", "AMOUNT", "DATE", "SELECT"],
      required: true
    },
    required: {
      type: Boolean,
      default: false
    },
    options: {
      type: [String],
      default: []
    },
    uniqueGroup: {
      type: String,
      default: null
    }
  },
  { _id: false }
);

const schemeDefinitionSchema = new mongoose.Schema(
  {
    /* ===============================
       LINK TO SCHEME
    ================================ */
    scheme: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Scheme",
      required: true,
      unique: true
    },

    /* ===============================
       DYNAMIC FORM FIELDS
    ================================ */
    fields: {
      type: [fieldSchema],
      required: true
    },

    /* ===============================
       LOCATION ASSIGNMENT (NEW)
    ================================ */
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      default: null
    },

    division: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Division",
      default: null
    },

    district: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "District",
      default: null
    },

    taluka: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Taluka",
      default: null
    },

    region: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Region",
      default: null
    },

    /* ===============================
       ACCESS CONTROL
    ================================ */
    assignedRoles: {
      type: [String],
      default: []
    },

    assignedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    ],

    /*  Public Link */
    publicLinkId: {
      type: String,
      unique: true,
      index: true
    },

    isPublic: {
      type: Boolean,
      default: false
    },

    /* ===============================
       SOFT DELETE
    ================================ */
    deletedAt: {
      type: Date,
      default: null
    }
    
  },
  {
    timestamps: true
  }
);

export default mongoose.model(
  "SchemeDefinition",
  schemeDefinitionSchema
);