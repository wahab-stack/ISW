const Product = require("../models/Product");

// Create a new product
const createProduct = async (req, res) => {
  try {
    const { productName, category, description, status } = req.body;

    const product = new Product({
      productName,
      category,
      description,
      status,
    });

    const savedProduct = await product.save();

    res.status(201).json({
      message: "Product created successfully",
      product: savedProduct,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error creating product",
      error: error.message,
    });
  }
};

// Get all products
const getProducts = async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });

    res.status(200).json({
      count: products.length,
      products,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching products",
      error: error.message,
    });
  }
};

module.exports = {
  createProduct,
  getProducts,
};