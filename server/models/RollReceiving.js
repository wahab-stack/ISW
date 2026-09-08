const mongoose = require("mongoose");

const rollReceivingSchema = new mongoose.Schema(
  {
    // ======================================================
    // Receipt Number
    // ======================================================

    receiptNo: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    // ======================================================
    // Date of Receiving
    // ======================================================

    date: {
      type: Date,
      required: true,
      default: Date.now,
    },

    // ======================================================
    // Supplier
    // ======================================================

    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier",
      required: true,
    },

    // ======================================================
    // Material Category
    // ======================================================

    category: {
      type: String,
      required: true,
      enum: ["iron", "steel"],
      lowercase: true,
      trim: true,
    },

    // ======================================================
    // Gauge
    // ======================================================

    gauge: {
      type: Number,
      enum: [14, 16, 18, 20, 22, 23],
      required: true,
    },

    // ======================================================
    // Description
    // ======================================================

    description: {
      type: String,
      required: true,
      trim: true,
    },

    // ======================================================
    // Weight in KG
    // ======================================================

    weight: {
      type: Number,
      required: true,
      min: 0.01,
    },

    // ======================================================
    // Original Roll Price
    // ======================================================

    rollPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    // ======================================================
    // Karachi → Peshawar Transportation
    // ======================================================

    karachiPeshawar: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ======================================================
    // Other Freight Charges
    // ======================================================

    freightCharges: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ======================================================
    // Total Cost of Roll
    //
    // rollPrice
    // + karachiPeshawar
    // + freightCharges
    // ======================================================

    totalCostPerRoll: {
      type: Number,
      required: true,
      min: 0,
    },

    // ======================================================
    // Cost Per KG
    //
    // totalCostPerRoll / weight
    // ======================================================

    costPerKg: {
      type: Number,
      required: true,
      min: 0,
    },

    // ======================================================
    // Receiving Status
    // ======================================================

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

module.exports = mongoose.model(
  "RollReceiving",
  rollReceivingSchema
);