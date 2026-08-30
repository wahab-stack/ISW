const mongoose = require("mongoose");

const inventorySchema = new mongoose.Schema(
  {
// Product linked to this inventory
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

// Current quantity in stock
    quantity: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

// Unit of measurement
    unit: {
      type: String,
      required: true,
      trim: true,
    },

// Minimum quantity before stock becomes Low Stock
    minimumStock: {
      type: Number,
      default: 0,
      min: 0,
    },

    
// NEW: Weighted average cost per kg
    averageCostPerKg: {
      type: Number,
      default: 0,
      min: 0,
    },

  
 // NEW: Total monetary value of current inventory

    totalStockValue: {
      type: Number,
      default: 0,
      min: 0,
    },

 // Inventory status
    status: {
      type: String,
      enum: ["Available", "Low Stock", "Out of Stock"],
      default: "Available",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Inventory",
  inventorySchema
);