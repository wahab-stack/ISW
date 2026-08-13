const RollReceiving = require("../models/RollReceiving");
const SupplierLedger = require("../models/SupplierLedger");

// ADD New Roll Receiving
const addRollReceiving = async (req, res) => {
  try {
    const {
      receiptNo,
      date,
      supplier,
      gauge,
      type,
      weight,
      processing,
      rollPrice,
      karachiPeshawar,
      freightCharges,
    } = req.body;

    // Check if this receipt already exists in Roll Receiving
    const existingRoll = await RollReceiving.findOne({
      receiptNo,
    });

    if (existingRoll) {
      return res.status(409).json({
        success: false,
        message:
          "A roll receiving record with this receipt number already exists.",
        receiptNo,
      });
    }

    // Calculate total cost automatically
    const totalCostPerRoll =
      Number(rollPrice || 0) +
      Number(karachiPeshawar || 0) +
      Number(freightCharges || 0);

    // Create Roll Receiving record
    const rollReceiving = await RollReceiving.create({
      receiptNo,
      date,
      supplier,
      gauge,
      type,
      weight,
      processing,
      rollPrice,
      karachiPeshawar,
      freightCharges,
      totalCostPerRoll,
    });

    // Check if a PURCHASE ledger entry already exists
    const existingLedgerEntry = await SupplierLedger.findOne({
      transactionType: "PURCHASE",
      reference: receiptNo,
    });

    if (existingLedgerEntry) {
      return res.status(409).json({
        success: false,
        message:
          "Supplier ledger entry already exists for this receipt number.",
        receiptNo,
      });
    }

    // Automatically create Supplier Ledger PURCHASE entry
    const ledgerEntry = await SupplierLedger.create({
      supplier,
      transactionType: "PURCHASE",
      amount: totalCostPerRoll,
      reference: receiptNo,
      description: `Purchase of ${gauge} gauge ${type} iron roll`,
      date: date || new Date(),
    });

    res.status(201).json({
      success: true,
      message: "Roll Receiving Added Successfully",
      rollReceiving,
      ledgerEntry,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// GET All Roll Receivings
const getRollReceivings = async (req, res) => {
  try {
    const rollReceivings = await RollReceiving.find()
      .populate("supplier")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: rollReceivings.length,
      rollReceivings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// GET Single Roll Receiving
const getRollReceivingById = async (req, res) => {
  try {
    const rollReceiving = await RollReceiving.findById(req.params.id)
      .populate("supplier");

    if (!rollReceiving) {
      return res.status(404).json({
        success: false,
        message: "Roll Receiving record not found",
      });
    }

    res.status(200).json({
      success: true,
      rollReceiving,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  addRollReceiving,
  getRollReceivings,
  getRollReceivingById,
};