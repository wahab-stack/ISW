const mongoose = require("mongoose");

const saleSchema = new mongoose.Schema(
  {
    receiptNo: {
      type: String,
      required: true,
      unique: true,
    },

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

    // Gage/thickness - used for Jastee and Steel
    gageNumber: {
      type: Number,
      enum: [16, 18, 20, 22, 23],
    },

    // Number of Profile Chaddar sheets
    sheetQuantity: {
      type: Number,
      default: 0,
    },

    // Weight in kg - used for Jastee and Steel
    weight: {
      type: Number,
      default: 0,
    },

    // Money amounts
    loading: {
      type: Number,
      default: 0,
    },

    mazdory: {
      type: Number,
      default: 0,
    },

    loaderRent: {
      type: Number,
      default: 0,
    },

    advancePayment: {
      type: Number,
      default: 0,
    },

    totalPayment: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Sale", saleSchema);