const mongoose = require("mongoose");

const rollReceivingSchema = new mongoose.Schema(
  {
    // Receipt number
    receiptNo: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    // Date of receiving
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },

    // Supplier
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier",
      required: true,
    },

    // Material category
    // iron = Jastee / iron material
    // steel = steel material
    category: {
      type: String,
      required: true,
      enum: ["iron", "steel"],
      lowercase: true,
      trim: true,
    },

    // Gauge
    gauge: {
      type: Number,
      enum: [14, 16, 18, 20, 22, 23],
      required: true,
    },

    // Description of the received roll
    description: {
      type: String,
      required: true,
      trim: true,
    },

    // Total weight of received roll in kg
    weight: {
      type: Number,
      required: true,
      min: 0,
    },

    // Original price paid for the roll
    rollPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    // Transportation cost from Karachi to Peshawar
    karachiPeshawar: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Other freight charges
    freightCharges: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Roll Price + Karachi/Peshawar + Freight
    totalCostPerRoll: {
      type: Number,
      required: true,
      min: 0,
    },

    // Total Roll Cost / Roll Weight
    costPerKg: {
      type: Number,
      required: true,
      min: 0,
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

module.exports = mongoose.model(
  "RollReceiving",
  rollReceivingSchema
);