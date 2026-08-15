const Sale = require("../models/Sale");
const CustomerLedger = require("../models/CustomerLedger");
const Product = require("../models/Product");
const Inventory = require("../models/Inventory");

// ADD New Sale
const addSale = async (req, res) => {
  try {
    const {
      receiptNo,
      date,
      customer,
      saleCategory,
      gageNumber,
      sheetQuantity,
      weight,
      loading,
      mazdory,
      loaderRent,
      advancePayment,
      totalPayment,
    } = req.body;

    // --------------------------------------------------
    // 1. Check duplicate receipt number
    // --------------------------------------------------
    const existingSale = await Sale.findOne({
      receiptNo,
    });

    if (existingSale) {
      return res.status(409).json({
        success: false,
        message: "A sale with this receipt number already exists.",
        receiptNo,
      });
    }

    // --------------------------------------------------
    // 2. Validate total payment
    // --------------------------------------------------
    if (totalPayment === undefined || Number(totalPayment) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Total payment must be greater than 0.",
      });
    }

    // --------------------------------------------------
    // 3. Validate advance payment
    // --------------------------------------------------
    if (Number(advancePayment || 0) < 0) {
      return res.status(400).json({
        success: false,
        message: "Advance payment cannot be negative.",
      });
    }

    if (
      Number(advancePayment || 0) >
      Number(totalPayment)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Advance payment cannot be greater than the total sale amount.",
        totalPayment,
        advancePayment,
      });
    }

    // --------------------------------------------------
    // 4. Determine inventory category
    //
    // ISW business mapping:
    // Jastee          -> iron
    // Steel           -> steel
    // Profile Chaddar -> profile chaddar
    // --------------------------------------------------
    let inventoryCategory;

    if (saleCategory === "Jastee") {
      inventoryCategory = "iron";
    } else if (saleCategory === "Steel") {
      inventoryCategory = "steel";
    } else if (saleCategory === "Profile Chaddar") {
      inventoryCategory = "profile chaddar";
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid sale category.",
      });
    }

    // --------------------------------------------------
    // 5. Find matching product
    // --------------------------------------------------
    const productQuery = {
      category: inventoryCategory,
      status: "Active",
    };

    // Gauge is required for Jastee and Steel
    if (
      saleCategory === "Jastee" ||
      saleCategory === "Steel"
    ) {
      if (!gageNumber) {
        return res.status(400).json({
          success: false,
          message:
            "Gauge number is required for Jastee and Steel sales.",
        });
      }

      productQuery.gauge = gageNumber;
    }

    const product = await Product.findOne(productQuery);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Matching product was not found.",
        category: inventoryCategory,
        gauge: gageNumber || null,
      });
    }

    // --------------------------------------------------
    // 6. Find inventory for this product
    // --------------------------------------------------
    const inventory = await Inventory.findOne({
      product: product._id,
    });

    if (!inventory) {
      return res.status(404).json({
        success: false,
        message:
          "Inventory record was not found for this product.",
        product: product.productName,
      });
    }

    // --------------------------------------------------
    // 7. Determine quantity to deduct
    // --------------------------------------------------
    let quantityToDeduct;

    if (saleCategory === "Profile Chaddar") {
      quantityToDeduct = Number(sheetQuantity || 0);

      if (quantityToDeduct <= 0) {
        return res.status(400).json({
          success: false,
          message:
            "Sheet quantity must be greater than 0 for Profile Chaddar.",
        });
      }
    } else {
      quantityToDeduct = Number(weight || 0);

      if (quantityToDeduct <= 0) {
        return res.status(400).json({
          success: false,
          message:
            "Weight must be greater than 0 for Jastee and Steel.",
        });
      }
    }

    // --------------------------------------------------
    // 8. Check available stock
    // --------------------------------------------------
    if (quantityToDeduct > inventory.quantity) {
      return res.status(400).json({
        success: false,
        message: "Insufficient inventory stock.",
        product: product.productName,
        availableStock: inventory.quantity,
        requestedQuantity: quantityToDeduct,
        unit: inventory.unit,
      });
    }

    // --------------------------------------------------
    // 9. Calculate remaining stock
    // --------------------------------------------------
    const remainingQuantity =
      inventory.quantity - quantityToDeduct;

    let inventoryStatus = "Available";

    if (remainingQuantity <= 0) {
      inventoryStatus = "Out of Stock";
    } else if (
      remainingQuantity <= inventory.minimumStock
    ) {
      inventoryStatus = "Low Stock";
    }

    // --------------------------------------------------
    // 10. Update inventory
    // --------------------------------------------------
    inventory.quantity = remainingQuantity;
    inventory.status = inventoryStatus;

    await inventory.save();

    // --------------------------------------------------
    // 11. Create Sale
    // --------------------------------------------------
    const sale = await Sale.create({
      receiptNo,
      date,
      customer,
      saleCategory,
      gageNumber,
      sheetQuantity,
      weight,
      loading,
      mazdory,
      loaderRent,
      advancePayment,
      totalPayment,
    });

    // --------------------------------------------------
    // 12. Create Customer Ledger SALE entry
    // --------------------------------------------------
    const ledgerEntry = await CustomerLedger.create({
      customer,
      transactionType: "SALE",
      amount: totalPayment,
      reference: receiptNo,
      description: `Sale of ${saleCategory}`,
      date: date || new Date(),
    });

    // --------------------------------------------------
    // 13. Create Customer Ledger ADVANCE_PAYMENT entry
    // --------------------------------------------------
    let advanceLedgerEntry = null;

    if (Number(advancePayment || 0) > 0) {
      advanceLedgerEntry = await CustomerLedger.create({
        customer,
        transactionType: "ADVANCE_PAYMENT",
        amount: advancePayment,
        reference: receiptNo,
        description:
          `Advance payment received for ${saleCategory}`,
        date: date || new Date(),
      });
    }

    // --------------------------------------------------
    // 14. Response
    // --------------------------------------------------
    res.status(201).json({
      success: true,
      message: "Sale Added Successfully",

      sale,

      inventory: {
        product: product.productName,
        category: product.category,
        gauge: product.gauge,
        quantitySold: quantityToDeduct,
        remainingQuantity,
        unit: inventory.unit,
        status: inventoryStatus,
      },

      ledgerEntry,

      advanceLedgerEntry,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// GET All Sales
const getSales = async (req, res) => {
  try {
    const sales = await Sale.find()
      .populate("customer")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: sales.length,
      sales,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// GET Single Sale
const getSaleById = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id)
      .populate("customer");

    if (!sale) {
      return res.status(404).json({
        success: false,
        message: "Sale not found",
      });
    }

    res.status(200).json({
      success: true,
      sale,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  addSale,
  getSales,
  getSaleById,
};