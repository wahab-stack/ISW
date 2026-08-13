const express = require("express");

const {
  addRollReceiving,
  getRollReceivings,
  getRollReceivingById,
} = require("../controllers/rollReceivingController");

const router = express.Router();

// Add a new roll receiving record
router.post("/", addRollReceiving);

// Get all roll receiving records
router.get("/", getRollReceivings);

// Get a single roll receiving record
router.get("/:id", getRollReceivingById);

module.exports = router;