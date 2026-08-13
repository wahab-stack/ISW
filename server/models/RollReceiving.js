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

    weight: {
      type: Number,
      required: true,
      min: 0,
    },

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

    rollPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    karachiPeshawar: {
      type: Number,
      default: 0,
      min: 0,
    },

    freightCharges: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalCostPerRoll: {
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