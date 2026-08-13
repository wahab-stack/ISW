const mongoose = require("mongoose");

const supplierSchema = new mongoose.Schema(
  {
    supplierId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    supplierName: {
      type: String,
      required: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    address: {
      type: String,
      default: "",
      trim: true,
    },

    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Supplier", supplierSchema);