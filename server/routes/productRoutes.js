const express = require("express");

const {
  createProduct,
  getProducts,
} = require("../controllers/productController");

const router = express.Router();

// Create a new product
router.post("/", createProduct);

// Get all products
router.get("/", getProducts);

module.exports = router;