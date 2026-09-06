const RollReceiving = require("../models/RollReceiving");
const SupplierLedger = require("../models/SupplierLedger");
const Inventory = require("../models/Inventory");

// ======================================================
// ADD NEW ROLL RECEIVING
// ======================================================

const addRollReceiving = async (req, res) => {
  try {
    const {
      receiptNo,
      date,
      supplier,
      category,
      gauge,
      description,
      weight,
      rollPrice,
      karachiPeshawar,
      freightCharges,
    } = req.body;

    // --------------------------------------------------
    // 1. Validate Receipt Number
    // --------------------------------------------------

    if (!receiptNo) {
      return res.status(400).json({
        success: false,
        message: "Receipt number is required.",
      });
    }

    // --------------------------------------------------
    // 2. Check Duplicate Receipt Number
    // --------------------------------------------------

    const existingRoll = await RollReceiving.findOne({
      receiptNo: receiptNo.trim(),
    });

    if (existingRoll) {
      return res.status(409).json({
        success: false,
        message:
          "A roll receiving record with this receipt number already exists.",
        receiptNo,
      });
    }

    // --------------------------------------------------
    // 3. Validate Supplier
    // --------------------------------------------------

    if (!supplier) {
      return res.status(400).json({
        success: false,
        message: "Supplier is required.",
      });
    }

    // --------------------------------------------------
    // 4. Validate Category
    // --------------------------------------------------

    if (!category) {
      return res.status(400).json({
        success: false,
        message: "Category is required.",
      });
    }

    const normalizedCategory = category.toLowerCase().trim();

    if (!["iron", "steel"].includes(normalizedCategory)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category. Use iron or steel.",
        category,
      });
    }

    // --------------------------------------------------
    // 5. Validate Gauge
    // --------------------------------------------------

    if (gauge === undefined || gauge === null) {
      return res.status(400).json({
        success: false,
        message: "Gauge is required.",
      });
    }

    const rollGauge = Number(gauge);

    const allowedGauges = [14, 16, 18, 20, 22, 23];

    if (!allowedGauges.includes(rollGauge)) {
      return res.status(400).json({
        success: false,
        message: "Invalid gauge.",
        allowedGauges,
      });
    }

    // --------------------------------------------------
    // 6. Validate Weight
    // --------------------------------------------------

    const rollWeight = Number(weight);

    if (!weight || rollWeight <= 0) {
      return res.status(400).json({
        success: false,
        message: "Roll weight must be greater than 0.",
      });
    }

    // --------------------------------------------------
    // 7. Validate Roll Price
    // --------------------------------------------------

    const rollPriceValue = Number(rollPrice || 0);

    if (rollPriceValue < 0) {
      return res.status(400).json({
        success: false,
        message: "Roll price cannot be negative.",
      });
    }

    // --------------------------------------------------
    // 8. Validate Transport & Freight
    // --------------------------------------------------

    const karachiPeshawarValue = Number(karachiPeshawar || 0);
    const freightChargesValue = Number(freightCharges || 0);

    if (karachiPeshawarValue < 0) {
      return res.status(400).json({
        success: false,
        message: "Karachi to Peshawar charges cannot be negative.",
      });
    }

    if (freightChargesValue < 0) {
      return res.status(400).json({
        success: false,
        message: "Freight charges cannot be negative.",
      });
    }

    // --------------------------------------------------
    // 9. Calculate Total Roll Cost
    //
    // Roll Price
    // + Karachi → Peshawar
    // + Freight Charges
    // = Total Roll Cost
    // --------------------------------------------------

    const totalCostPerRoll =
      rollPriceValue +
      karachiPeshawarValue +
      freightChargesValue;

    // --------------------------------------------------
    // 10. Calculate Cost Per KG
    //
    // Total Roll Cost / Roll Weight
    // --------------------------------------------------

    const costPerKg = Number(
      (totalCostPerRoll / rollWeight).toFixed(2)
    );

    // --------------------------------------------------
    // 11. Find Matching Inventory
    //
    // NEW SYSTEM:
    // No Product model is used anymore.
    //
    // Inventory is identified by:
    // category + gauge
    // --------------------------------------------------

    const inventory = await Inventory.findOne({
      category: normalizedCategory,
      gauge: rollGauge,
    });

    if (!inventory) {
      return res.status(404).json({
        success: false,
        message:
          "Matching inventory was not found for this category and gauge.",
        category: normalizedCategory,
        gauge: rollGauge,
        suggestion:
          "Create the inventory record first before receiving this roll.",
      });
    }

    // --------------------------------------------------
    // 12. Check Duplicate Supplier Ledger Entry
    // --------------------------------------------------

    const existingLedgerEntry =
      await SupplierLedger.findOne({
        transactionType: "PURCHASE",
        reference: receiptNo.trim(),
      });

    if (existingLedgerEntry) {
      return res.status(409).json({
        success: false,
        message:
          "Supplier ledger entry already exists for this receipt number.",
        receiptNo,
      });
    }

    // --------------------------------------------------
    // 13. Get Previous Inventory Values
    //
    // Inventory now uses WEIGHT instead of QUANTITY.
    // --------------------------------------------------

    const previousWeight = Number(inventory.weight || 0);

    const previousStockValue = Number(
      inventory.totalStockValue || 0
    );

    const previousAverageCostPerKg = Number(
      inventory.averageCostPerKg || 0
    );

    // --------------------------------------------------
    // 14. Calculate New Inventory Weight
    // --------------------------------------------------

    const newWeight = previousWeight + rollWeight;

    // --------------------------------------------------
    // 15. Calculate New Stock Value
    //
    // Previous Stock Value
    // + New Roll Cost
    // = New Stock Value
    // --------------------------------------------------

    const newStockValue =
      previousStockValue + totalCostPerRoll;

    // --------------------------------------------------
    // 16. Calculate Weighted Average Cost Per KG
    //
    // New Stock Value / New Weight
    // --------------------------------------------------

    const newAverageCostPerKg =
      newWeight > 0
        ? Number(
            (newStockValue / newWeight).toFixed(2)
          )
        : 0;

    // --------------------------------------------------
    // 17. Calculate Inventory Status
    // --------------------------------------------------

    let inventoryStatus = "Available";

    if (newWeight <= 0) {
      inventoryStatus = "Out of Stock";
    } else if (
      newWeight <= Number(inventory.minimumStock || 0)
    ) {
      inventoryStatus = "Low Stock";
    } else {
      inventoryStatus = "Available";
    }

    // --------------------------------------------------
    // 18. Create Roll Receiving Record
    // --------------------------------------------------

    const rollReceiving = await RollReceiving.create({
      receiptNo: receiptNo.trim(),
      date: date || new Date(),
      supplier,
      category: normalizedCategory,
      gauge: rollGauge,
      description: description || "",
      weight: rollWeight,
      rollPrice: rollPriceValue,
      karachiPeshawar: karachiPeshawarValue,
      freightCharges: freightChargesValue,
      totalCostPerRoll,
      costPerKg,
    });

    // --------------------------------------------------
    // 19. Update Inventory
    // --------------------------------------------------

    inventory.weight = newWeight;

    inventory.totalStockValue = newStockValue;

    inventory.averageCostPerKg = newAverageCostPerKg;

    inventory.status = inventoryStatus;

    await inventory.save();

    // --------------------------------------------------
    // 20. Create Supplier Ledger PURCHASE Entry
    // --------------------------------------------------

    const ledgerEntry = await SupplierLedger.create({
      supplier,
      transactionType: "PURCHASE",
      amount: totalCostPerRoll,
      reference: receiptNo.trim(),
      description:
        `Purchase of ${rollGauge} gauge ${normalizedCategory} roll`,
      date: date || new Date(),
    });

    // --------------------------------------------------
    // 21. Send Response
    // --------------------------------------------------

    res.status(201).json({
      success: true,

      message: "Roll Receiving Added Successfully",

      rollReceiving,

      inventory: {
        category: normalizedCategory,

        gauge: rollGauge,

        weightReceived: rollWeight,

        previousWeight,

        newWeight,

        unit: inventory.unit,

        previousAverageCostPerKg,

        rollCostPerKg: costPerKg,

        newAverageCostPerKg,

        previousStockValue,

        newStockValue,

        status: inventoryStatus,
      },

      ledgerEntry,
    });
  } catch (error) {
    console.error("Roll Receiving Error:", error);

    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// GET ALL ROLL RECEIVINGS
// ======================================================

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
    console.error("Get Roll Receivings Error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// GET SINGLE ROLL RECEIVING
// ======================================================

const getRollReceivingById = async (req, res) => {
  try {
    const rollReceiving = await RollReceiving.findById(
      req.params.id
    ).populate("supplier");

    if (!rollReceiving) {
      return res.status(404).json({
        success: false,
        message: "Roll Receiving record not found.",
      });
    }

    res.status(200).json({
      success: true,
      rollReceiving,
    });
  } catch (error) {
    console.error(
      "Get Roll Receiving By ID Error:",
      error
    );

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// EXPORTS
// ======================================================

module.exports = {
  addRollReceiving,
  getRollReceivings,
  getRollReceivingById,
};