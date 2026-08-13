const express = require("express");

const {
  addSale,
  getSales,
  getSaleById,
} = require("../controllers/saleController");

const router = express.Router();

// ADD Sale
router.post("/", addSale);

// GET All Sales
router.get("/", getSales);

// GET Single Sale
router.get("/:id", getSaleById);

module.exports = router;