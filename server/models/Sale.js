const mongoose = require("mongoose");

const saleSchema = new mongoose.Schema(
  {
    // ======================================================
    // UNIQUE SALE RECEIPT NUMBER
    // ======================================================
    receiptNo: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    // ======================================================
    // SALE DATE
    // ======================================================
    date: {
      type: Date,
      default: Date.now,
    },

    // ======================================================
    // CUSTOMER
    // ======================================================
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },

    // ======================================================
    // TYPE OF MATERIAL BEING SOLD
    // ======================================================
    saleCategory: {
      type: String,
      enum: ["Jastee", "Steel"],
      required: true,
    },

    // ======================================================
    // GAUGE / THICKNESS
    // ======================================================
    // ISW deals with:
    // 14, 16, 18, 20, 22 and 23 gauge
    // ======================================================
    gageNumber: {
      type: Number,
      enum: [14, 16, 18, 20, 22, 23],
      required: true,
    },

    // ======================================================
    // WEIGHT SOLD IN KG
    // ======================================================
    // ISW purchases and sells material according to weight.
    // Example: 50 KG, 100 KG, 250 KG, etc.
    // ======================================================
    weight: {
      type: Number,
      required: true,
      min: 0.01,
    },

    // ======================================================
    // SELLING PRICE PER KG
    // ======================================================
    // Example:
    // 50 KG × Rs. 290/KG
    // ======================================================
    sellingPricePerKg: {
      type: Number,
      required: true,
      min: 0.01,
    },

    // ======================================================
    // ADDITIONAL SALE CHARGES
    // ======================================================
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

    // ======================================================
    // ADVANCE PAYMENT
    // ======================================================
    // Amount received from customer at the time of sale.
    // ======================================================
    advancePayment: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ======================================================
    // TOTAL SALE AMOUNT
    // ======================================================
    // This value should be calculated by saleController.js:
    //
    // Weight × Selling Price Per KG
    // + Additional Charges
    //
    // Example:
    // 50 KG × Rs. 290 = Rs. 14,500
    // ======================================================
    totalPayment: {
      type: Number,
      required: true,
      min: 0.01,
    },
  },

  {
    // Automatically creates:
    // createdAt
    // updatedAt
    timestamps: true,
  }
);

module.exports = mongoose.model("Sale", saleSchema);