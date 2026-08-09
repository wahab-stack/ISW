const express = require("express");
const router = express.Router();

const {
  getCustomers,
  getCustomerById,
  addCustomer,
  updateCustomer,
  deleteCustomer,
} = require("../controllers/customerController");

// GET all customers
router.get("/", getCustomers);

// GET Single Customer
router.get("/:id", getCustomerById);

// ADD new customer
router.post("/", addCustomer);

//UPDATE csutomer
router.put("/:id", updateCustomer);

//DELETE Customer
router.delete("/:id", deleteCustomer);

module.exports = router;
 