const mongoose = require("mongoose");

const supplierLedgerSchema = new mongoose.Schema(
  {
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier",
      required: true,
    },

    transactionType: {
      type: String,
      enum: [
        "PURCHASE",
        "ADVANCE_PAYMENT",
        "WEEKLY_PAYMENT",
        "ADJUSTMENT",
      ],
      required: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    reference: {
      type: String,
      default: "",
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    date: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "SupplierLedger",
  supplierLedgerSchema
);