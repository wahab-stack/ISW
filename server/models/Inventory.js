const mongoose = require("mongoose");

const inventorySchema = new mongoose.Schema(
  {
    // Material category
    category: {
      type: String,
      required: true,
      trim: true,
      enum: ["iron", "steel"],
    },

    // Gauge / thickness of the material
    gauge: {
      type: Number,
      required: true,
      enum: [14, 16, 18, 20, 22, 23],
    },

    // Current quantity/weight available in stock (KG)
    weight: {
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
      default: "kg",
    },

    // Minimum stock level before showing Low Stock
    minimumStock: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Weighted average purchase cost per KG
    averageCostPerKg: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Total monetary value of current inventory
    totalStockValue: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Current inventory status
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

module.exports = mongoose.model("Inventory", inventorySchema);