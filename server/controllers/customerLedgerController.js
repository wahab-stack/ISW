const CustomerLedger = require("../models/CustomerLedger");

// ADD Customer Ledger Entry
const addCustomerLedgerEntry = async (req, res) => {
  try {
    const {
      customer,
      transactionType,
      amount,
      reference,
      description,
      date,
    } = req.body;

    const ledgerEntry = await CustomerLedger.create({
      customer,
      transactionType,
      amount,
      reference,
      description,
      date,
    });

    res.status(201).json({
      success: true,
      message: "Customer Ledger Entry Added Successfully",
      ledgerEntry,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// ADD Customer Payment
const addCustomerPayment = async (req, res) => {
  try {
    const {
      customer,
      transactionType,
      amount,
      reference,
      description,
      date,
    } = req.body;

    // Only payment transactions are allowed
    if (
      transactionType !== "PAYMENT" &&
      transactionType !== "ADVANCE_PAYMENT"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid payment type. Use PAYMENT or ADVANCE_PAYMENT.",
      });
    }

    // Validate amount
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Payment amount must be greater than 0.",
      });
    }

    // Get customer's existing ledger
    const ledgerEntries = await CustomerLedger.find({
      customer,
    });

    // Calculate current outstanding balance
    let balance = 0;

    ledgerEntries.forEach((entry) => {
      if (entry.transactionType === "SALE") {
        balance += entry.amount;
      } else if (
        entry.transactionType === "PAYMENT" ||
        entry.transactionType === "ADVANCE_PAYMENT"
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

    // Create payment entry
    const payment = await CustomerLedger.create({
      customer,
      transactionType,
      amount,
      reference,
      description,
      date,
    });

    const newBalance = balance - amount;

    res.status(201).json({
      success: true,
      message: "Customer Payment Added Successfully",
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

// GET Customer Ledger
const getCustomerLedger = async (req, res) => {
  try {
    const { customerId } = req.params;

    const ledgerEntries = await CustomerLedger.find({
      customer: customerId,
    })
      .populate("customer")
      .sort({ date: 1, createdAt: 1 });

    let balance = 0;

    ledgerEntries.forEach((entry) => {
      if (entry.transactionType === "SALE") {
        balance += entry.amount;
      } else if (
        entry.transactionType === "PAYMENT" ||
        entry.transactionType === "ADVANCE_PAYMENT"
      ) {
        balance -= entry.amount;
      }
    });

    res.status(200).json({
      success: true,
      customer:
        ledgerEntries.length > 0
          ? ledgerEntries[0].customer
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
  addCustomerLedgerEntry,
  addCustomerPayment,
  getCustomerLedger,
};