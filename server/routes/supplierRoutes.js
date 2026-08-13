const express = require("express");

const {
  getSuppliers,
  getSupplierById,
  addSupplier,
  updateSupplier,
  deleteSupplier,
} = require("../controllers/supplierController");

const router = express.Router();

// Add a new supplier
router.post("/", addSupplier);

// Get all suppliers
router.get("/", getSuppliers);

// Get a single supplier
router.get("/:id", getSupplierById);

// Update supplier
router.put("/:id", updateSupplier);

// Deactivate supplier
router.delete("/:id", deleteSupplier);

module.exports = router;