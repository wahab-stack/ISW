const express = require("express");

const {
  addCustomerLedgerEntry,
  addCustomerPayment,
  getCustomerLedger,
} = require("../controllers/customerLedgerController");

const router = express.Router();

// Add customer ledger entry
router.post("/", addCustomerLedgerEntry);

// Add customer payment
router.post("/payment", addCustomerPayment);

// Get customer ledger
router.get("/:customerId", getCustomerLedger);

module.exports = router;