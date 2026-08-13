const express = require("express");

const {
  addSupplierLedgerEntry,
  addSupplierPayment,
  getSupplierLedger,
} = require("../controllers/supplierLedgerController");

const router = express.Router();

// Add supplier ledger transaction
router.post("/", addSupplierLedgerEntry);

// Add supplier payment
router.post("/payment", addSupplierPayment);

// Get supplier ledger
router.get("/:supplierId", getSupplierLedger);

module.exports = router;