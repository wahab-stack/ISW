const Inventory = require("../models/Inventory");

// Create inventory
const createInventory = async (req, res) => {
  try {
    const {
      product,
      quantity,
      unit,
      minimumStock,
    } = req.body;

    const inventory = new Inventory({
      product,
      quantity,
      unit,
      minimumStock,
    });

    const savedInventory = await inventory.save();

    res.status(201).json({
      success: true,
      message: "Inventory created successfully",
      inventory: savedInventory,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Error creating inventory",
      error: error.message,
    });
  }
};

// Get all inventory
const getInventory = async (req, res) => {
  try {
    const inventory = await Inventory.find()
      .populate("product")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: inventory.length,
      inventory,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching inventory",
      error: error.message,
    });
  }
};

module.exports = {
  createInventory,
  getInventory,
};