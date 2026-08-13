const express = require("express");

const {
  createInventory,
  getInventory,
} = require("../controllers/inventoryController");

const router = express.Router();

// Create inventory
router.post("/", createInventory);

// Get all inventory
router.get("/", getInventory);

module.exports = router;