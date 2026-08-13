const Sale = require("../models/Sale");
const CustomerLedger = require("../models/CustomerLedger");

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

    // Check duplicate receipt number
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

    // Validate total payment
    if (totalPayment === undefined || totalPayment <= 0) {
      return res.status(400).json({
        success: false,
        message: "Total payment must be greater than 0.",
      });
    }

    // Validate advance payment
    if (advancePayment < 0) {
      return res.status(400).json({
        success: false,
        message: "Advance payment cannot be negative.",
      });
    }

    // Advance payment cannot exceed total sale value
    if (advancePayment > totalPayment) {
      return res.status(400).json({
        success: false,
        message:
          "Advance payment cannot be greater than the total sale amount.",
        totalPayment,
        advancePayment,
      });
    }

    // Create Sale
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

    // Create Customer Ledger SALE entry
    const ledgerEntry = await CustomerLedger.create({
      customer,
      transactionType: "SALE",
      amount: totalPayment,
      reference: receiptNo,
      description: `Sale of ${saleCategory}`,
      date: date || new Date(),
    });

    // Create Customer Ledger ADVANCE_PAYMENT entry
    let advanceLedgerEntry = null;

    if (advancePayment > 0) {
      advanceLedgerEntry = await CustomerLedger.create({
        customer,
        transactionType: "ADVANCE_PAYMENT",
        amount: advancePayment,
        reference: receiptNo,
        description: `Advance payment received for ${saleCategory}`,
        date: date || new Date(),
      });
    }

    res.status(201).json({
      success: true,
      message: "Sale Added Successfully",
      sale,
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
    const sale = await Sale.findById(req.params.id).populate("customer");

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