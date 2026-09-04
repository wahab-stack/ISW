const express = require("express");

const {
  createInventory,
  getInventory,
  getInventoryById,
  updateInventory,
  deleteInventory,
} = require("../controllers/inventoryController");

const router = express.Router();

// Create inventory
router.post("/", createInventory);

// Get all inventory
router.get("/", getInventory);

// Get inventory by ID
router.get("/:id", getInventoryById);

// Update inventory
router.put("/:id", updateInventory);

// Delete inventory
router.delete("/:id", deleteInventory);

module.exports = router;