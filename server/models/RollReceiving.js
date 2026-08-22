const mongoose = require("mongoose");

const rollReceivingSchema = new mongoose.Schema(
  {
    receiptNo: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    date: {
      type: Date,
      required: true,
      default: Date.now,
    },

    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier",
      required: true,
    },

    gauge: {
      type: Number,
      enum: [14, 16, 18, 20, 22, 23],
      required: true,
    },

    type: {
      type: String,
      required: true,
      trim: true,
    },

    // Total weight of the received roll in kg
    weight: {
      type: Number,
      required: true,
      min: 0,
    },

    // Processing breakdown
    processing: {
      g14PR: {
        type: Number,
        default: 0,
        min: 0,
      },

      g16PR: {
        type: Number,
        default: 0,
        min: 0,
      },

      g18PR: {
        type: Number,
        default: 0,
        min: 0,
      },

      g20PR: {
        type: Number,
        default: 0,
        min: 0,
      },

      g22PR: {
        type: Number,
        default: 0,
        min: 0,
      },

      g23PR: {
        type: Number,
        default: 0,
        min: 0,
      },

      golden: {
        type: Number,
        default: 0,
        min: 0,
      },

      silver: {
        type: Number,
        default: 0,
        min: 0,
      },

      profileChaddar: {
        type: Number,
        default: 0,
        min: 0,
      },
    },

    // Original price of the roll
    rollPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    // Transportation from Karachi to Peshawar
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

    // Roll price + transportation + freight
    totalCostPerRoll: {
      type: Number,
      required: true,
      min: 0,
    },

    // Total cost of the roll divided by total weight
    costPerKg: {
      type: Number,
      required: true,
      min: 0,
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