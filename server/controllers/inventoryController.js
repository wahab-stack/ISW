const Inventory = require("../models/Inventory");

// ======================================================
// CREATE INVENTORY
// ======================================================

const createInventory = async (req, res) => {
  try {
    const {
      category,
      gauge,
      weight,
      unit,
      minimumStock,
    } = req.body;

    // --------------------------------------------------
    // Validate required fields
    // --------------------------------------------------

    if (!category) {
      return res.status(400).json({
        success: false,
        message: "Category is required.",
      });
    }

    if (!gauge) {
      return res.status(400).json({
        success: false,
        message: "Gauge is required.",
      });
    }

    if (weight === undefined || weight === null) {
      return res.status(400).json({
        success: false,
        message: "Weight is required.",
      });
    }

    if (!unit) {
      return res.status(400).json({
        success: false,
        message: "Unit is required.",
      });
    }

    // --------------------------------------------------
    // Validate gauge
    // --------------------------------------------------

    const allowedGauges = [14, 16, 18, 20, 22, 23];

    if (!allowedGauges.includes(Number(gauge))) {
      return res.status(400).json({
        success: false,
        message: "Invalid gauge.",
        allowedGauges,
      });
    }

    // --------------------------------------------------
    // Validate weight
    // --------------------------------------------------

    if (Number(weight) < 0) {
      return res.status(400).json({
        success: false,
        message: "Weight cannot be negative.",
      });
    }

    // --------------------------------------------------
    // Check duplicate category + gauge
    // --------------------------------------------------

    const existingInventory = await Inventory.findOne({
      category: category.trim(),
      gauge: Number(gauge),
    });

    if (existingInventory) {
      return res.status(409).json({
        success: false,
        message: "Inventory for this category and gauge already exists.",
        inventory: existingInventory,
      });
    }

    // --------------------------------------------------
    // Create inventory
    // --------------------------------------------------

    const inventory = new Inventory({
      category: category.trim(),
      gauge: Number(gauge),
      weight: Number(weight),
      unit: unit.trim(),
      minimumStock: Number(minimumStock || 0),
      averageCostPerKg: 0,
      totalStockValue: 0,
    });

    const savedInventory = await inventory.save();

    // --------------------------------------------------
    // Response
    // --------------------------------------------------

    res.status(201).json({
      success: true,
      message: "Inventory created successfully",
      inventory: savedInventory,
    });

  } catch (error) {
    console.error("Create Inventory Error:", error);

    res.status(400).json({
      success: false,
      message: "Error creating inventory",
      error: error.message,
    });
  }
};


// ======================================================
// GET ALL INVENTORY
// ======================================================

const getInventory = async (req, res) => {
  try {

    const inventory = await Inventory.find()
      .sort({
        category: 1,
        gauge: 1,
      });

    res.status(200).json({
      success: true,
      count: inventory.length,
      inventory,
    });

  } catch (error) {

    console.error("Get Inventory Error:", error);

    res.status(500).json({
      success: false,
      message: "Error fetching inventory",
      error: error.message,
    });
  }
};


// ======================================================
// GET SINGLE INVENTORY BY ID
// ======================================================

const getInventoryById = async (req, res) => {
  try {

    const inventory = await Inventory.findById(req.params.id);

    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: "Inventory record not found.",
      });
    }

    res.status(200).json({
      success: true,
      inventory,
    });

  } catch (error) {

    console.error("Get Inventory By ID Error:", error);

    res.status(500).json({
      success: false,
      message: "Error fetching inventory.",
      error: error.message,
    });
  }
};


// ======================================================
// UPDATE INVENTORY
// ======================================================

const updateInventory = async (req, res) => {
  try {

    const {
      category,
      gauge,
      weight,
      unit,
      minimumStock,
      averageCostPerKg,
      totalStockValue,
      status,
    } = req.body;

    const inventory = await Inventory.findById(req.params.id);

    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: "Inventory record not found.",
      });
    }

    // --------------------------------------------------
    // Update fields only if provided
    // --------------------------------------------------

    if (category !== undefined) {
      inventory.category = category.trim();
    }

    if (gauge !== undefined) {

      const allowedGauges = [14, 16, 18, 20, 22, 23];

      if (!allowedGauges.includes(Number(gauge))) {
        return res.status(400).json({
          success: false,
          message: "Invalid gauge.",
          allowedGauges,
        });
      }

      inventory.gauge = Number(gauge);
    }

    if (weight !== undefined) {

      if (Number(weight) < 0) {
        return res.status(400).json({
          success: false,
          message: "Weight cannot be negative.",
        });
      }

      inventory.weight = Number(weight);
    }

    if (unit !== undefined) {
      inventory.unit = unit.trim();
    }

    if (minimumStock !== undefined) {

      if (Number(minimumStock) < 0) {
        return res.status(400).json({
          success: false,
          message: "Minimum stock cannot be negative.",
        });
      }

      inventory.minimumStock = Number(minimumStock);
    }

    if (averageCostPerKg !== undefined) {

      if (Number(averageCostPerKg) < 0) {
        return res.status(400).json({
          success: false,
          message: "Average cost per kg cannot be negative.",
        });
      }

      inventory.averageCostPerKg = Number(averageCostPerKg);
    }

    if (totalStockValue !== undefined) {

      if (Number(totalStockValue) < 0) {
        return res.status(400).json({
          success: false,
          message: "Total stock value cannot be negative.",
        });
      }

      inventory.totalStockValue = Number(totalStockValue);
    }

    if (status !== undefined) {

      const allowedStatuses = [
        "Available",
        "Low Stock",
        "Out of Stock",
      ];

      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid inventory status.",
          allowedStatuses,
        });
      }

      inventory.status = status;
    }

    // --------------------------------------------------
    // Automatically calculate inventory status
    // --------------------------------------------------

    if (inventory.weight <= 0) {

      inventory.status = "Out of Stock";

    } else if (
      inventory.weight <= inventory.minimumStock
    ) {

      inventory.status = "Low Stock";

    } else {

      inventory.status = "Available";
    }

    // --------------------------------------------------
    // Save updated inventory
    // --------------------------------------------------

    const updatedInventory = await inventory.save();

    res.status(200).json({
      success: true,
      message: "Inventory updated successfully",
      inventory: updatedInventory,
    });

  } catch (error) {

    console.error("Update Inventory Error:", error);

    res.status(400).json({
      success: false,
      message: "Error updating inventory",
      error: error.message,
    });
  }
};


// ======================================================
// DELETE INVENTORY
// ======================================================

const deleteInventory = async (req, res) => {
  try {

    const inventory = await Inventory.findById(req.params.id);

    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: "Inventory record not found.",
      });
    }

    await Inventory.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Inventory deleted successfully.",
      deletedInventory: inventory,
    });

  } catch (error) {

    console.error("Delete Inventory Error:", error);

    res.status(500).json({
      success: false,
      message: "Error deleting inventory.",
      error: error.message,
    });
  }
};


// ======================================================
// EXPORTS
// ======================================================

module.exports = {
  createInventory,
  getInventory,
  getInventoryById,
  updateInventory,
  deleteInventory,
};