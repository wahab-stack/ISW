const SupplierLedger = require("../models/SupplierLedger");

// ADD Supplier Ledger Transaction
const addSupplierLedgerEntry = async (req, res) => {
  try {
    const {
      supplier,
      transactionType,
      amount,
      reference,
      description,
      date,
    } = req.body;

    const ledgerEntry = await SupplierLedger.create({
      supplier,
      transactionType,
      amount,
      reference,
      description,
      date,
    });

    res.status(201).json({
      success: true,
      message: "Supplier Ledger Entry Added Successfully",
      ledgerEntry,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// ADD Supplier Payment
const addSupplierPayment = async (req, res) => {
  try {
    const {
      supplier,
      transactionType,
      amount,
      reference,
      description,
      date,
    } = req.body;

    // Only payment transactions are allowed here
    if (
      transactionType !== "ADVANCE_PAYMENT" &&
      transactionType !== "WEEKLY_PAYMENT"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid payment type. Use ADVANCE_PAYMENT or WEEKLY_PAYMENT.",
      });
    }

    // Validate amount
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Payment amount must be greater than 0.",
      });
    }

    // Get all supplier ledger transactions
    const ledgerEntries = await SupplierLedger.find({
      supplier,
    });

    // Calculate current outstanding balance
    let balance = 0;

    ledgerEntries.forEach((entry) => {
      if (entry.transactionType === "PURCHASE") {
        balance += entry.amount;
      } else if (
        entry.transactionType === "ADVANCE_PAYMENT" ||
        entry.transactionType === "WEEKLY_PAYMENT"
      ) {
        balance -= entry.amount;
      }
    });

    // Prevent overpayment
    if (amount > balance) {
      return res.status(400).json({
        success: false,
        message: "Payment amount cannot exceed the outstanding balance.",
        currentBalance: balance,
        requestedPayment: amount,
      });
    }

    // Create payment ledger entry
    const payment = await SupplierLedger.create({
      supplier,
      transactionType,
      amount,
      reference,
      description,
      date,
    });

    // Calculate new balance
    const newBalance = balance - amount;

    res.status(201).json({
      success: true,
      message: "Supplier Payment Added Successfully",
      payment,
      previousBalance: balance,
      newBalance,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// GET Supplier Ledger
const getSupplierLedger = async (req, res) => {
  try {
    const { supplierId } = req.params;

    const ledgerEntries = await SupplierLedger.find({
      supplier: supplierId,
    })
      .populate("supplier")
      .sort({ date: 1, createdAt: 1 });

    let balance = 0;

    ledgerEntries.forEach((entry) => {
      if (entry.transactionType === "PURCHASE") {
        balance += entry.amount;
      } else if (
        entry.transactionType === "ADVANCE_PAYMENT" ||
        entry.transactionType === "WEEKLY_PAYMENT"
      ) {
        balance -= entry.amount;
      }
    });

    res.status(200).json({
      success: true,
      supplier:
        ledgerEntries.length > 0
          ? ledgerEntries[0].supplier
          : null,
      count: ledgerEntries.length,
      balance,
      ledger: ledgerEntries,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  addSupplierLedgerEntry,
  addSupplierPayment,
  getSupplierLedger,
};