const mongoose = require("mongoose");

const saleSchema = new mongoose.Schema(
  {
    // Unique sale receipt number
    receiptNo: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    // Sale date
    date: {
      type: Date,
      default: Date.now,
    },

    // Customer who made the purchase
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },

    // What is being sold?
    saleCategory: {
      type: String,
      enum: ["Profile Chaddar", "Jastee", "Steel"],
      required: true,
    },

    // Gauge / thickness
    // Used for Jastee and Steel
    gageNumber: {
      type: Number,
      enum: [16, 18, 20, 22, 23],
    },

    // Number of Profile Chaddar sheets
    sheetQuantity: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Weight in kg
    // Used for Jastee and Steel
    weight: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Additional charges
    loading: {
      type: Number,
      default: 0,
      min: 0,
    },

    mazdory: {
      type: Number,
      default: 0,
      min: 0,
    },

    loaderRent: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Amount paid at the time of sale
    advancePayment: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Complete value of the sale
    totalPayment: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Sale", saleSchema);