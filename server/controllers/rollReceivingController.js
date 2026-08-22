const RollReceiving = require("../models/RollReceiving");
const SupplierLedger = require("../models/SupplierLedger");
const Product = require("../models/Product");
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
      gauge,
      type,
      weight,
      processing,
      rollPrice,
      karachiPeshawar,
      freightCharges,
    } = req.body;

    // --------------------------------------------------
    // 1. Check duplicate receipt number
    // --------------------------------------------------

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

    // --------------------------------------------------
    // 2. Validate weight
    // --------------------------------------------------

    const rollWeight = Number(weight || 0);

    if (rollWeight <= 0) {
      return res.status(400).json({
        success: false,
        message: "Roll weight must be greater than 0.",
      });
    }

    // --------------------------------------------------
    // 3. Calculate total roll cost
    //
    // Roll Price
    // + Karachi → Peshawar
    // + Freight
    // = Total Roll Cost
    // --------------------------------------------------

    const totalCostPerRoll =
      Number(rollPrice || 0) +
      Number(karachiPeshawar || 0) +
      Number(freightCharges || 0);

    // --------------------------------------------------
    // 4. Calculate cost per kg
    //
    // Total Roll Cost / Roll Weight
    // --------------------------------------------------

    const costPerKg = Number(
      (totalCostPerRoll / rollWeight).toFixed(2)
    );

    // --------------------------------------------------
    // 5. Determine inventory category
    //
    // PR      -> iron
    // Jastee  -> iron
    // Steel   -> steel
    // --------------------------------------------------

    let inventoryCategory;

    if (type === "PR" || type === "Jastee") {
      inventoryCategory = "iron";
    } else if (type === "Steel") {
      inventoryCategory = "steel";
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid roll type for inventory.",
        type,
        allowedTypes: ["PR", "Jastee", "Steel"],
      });
    }

    // --------------------------------------------------
    // 6. Find matching product
    // --------------------------------------------------

    const product = await Product.findOne({
      category: inventoryCategory,
      gauge: Number(gauge),
      status: "Active",
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Matching product was not found.",
        category: inventoryCategory,
        gauge: Number(gauge),
      });
    }

    // --------------------------------------------------
    // 7. Find inventory for the product
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
        category: product.category,
        gauge: product.gauge,
      });
    }

    // --------------------------------------------------
    // 8. Check duplicate supplier ledger entry
    // --------------------------------------------------

    const existingLedgerEntry =
      await SupplierLedger.findOne({
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

    // --------------------------------------------------
    // 9. Get previous inventory values
    // --------------------------------------------------

    const previousQuantity = Number(
      inventory.quantity || 0
    );

    const previousStockValue = Number(
      inventory.totalStockValue || 0
    );

    const previousAverageCostPerKg = Number(
      inventory.averageCostPerKg || 0
    );

    // --------------------------------------------------
    // 10. Calculate new inventory quantity
    // --------------------------------------------------

    const newQuantity =
      previousQuantity + rollWeight;

    // --------------------------------------------------
    // 11. Calculate new stock value
    //
    // Previous Stock Value
    // + New Roll Cost
    // = New Stock Value
    // --------------------------------------------------

    const newStockValue =
      previousStockValue + totalCostPerRoll;

    // --------------------------------------------------
    // 12. Calculate weighted average cost per kg
    //
    // New Stock Value / New Quantity
    // --------------------------------------------------

    const newAverageCostPerKg =
      newQuantity > 0
        ? Number(
            (newStockValue / newQuantity).toFixed(2)
          )
        : 0;

    // --------------------------------------------------
    // 13. Calculate inventory status
    // --------------------------------------------------

    let inventoryStatus = "Available";

    if (newQuantity <= 0) {
      inventoryStatus = "Out of Stock";
    } else if (
      newQuantity <=
      Number(inventory.minimumStock || 0)
    ) {
      inventoryStatus = "Low Stock";
    }

    // --------------------------------------------------
    // 14. Create Roll Receiving record
    // --------------------------------------------------

    const rollReceiving =
      await RollReceiving.create({
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
        costPerKg,
      });

    // --------------------------------------------------
    // 15. Update inventory
    // --------------------------------------------------

    inventory.quantity = newQuantity;

    inventory.totalStockValue = newStockValue;

    inventory.averageCostPerKg =
      newAverageCostPerKg;

    inventory.status = inventoryStatus;

    await inventory.save();

    // --------------------------------------------------
    // 16. Determine material name
    // --------------------------------------------------

    const materialName =
      inventoryCategory === "iron"
        ? "iron"
        : "steel";

    // --------------------------------------------------
    // 17. Create Supplier Ledger PURCHASE entry
    // --------------------------------------------------

    const ledgerEntry =
      await SupplierLedger.create({
        supplier,
        transactionType: "PURCHASE",
        amount: totalCostPerRoll,
        reference: receiptNo,
        description:
          `Purchase of ${gauge} gauge ${type} ${materialName} roll`,
        date: date || new Date(),
      });

    // --------------------------------------------------
    // 18. Send response
    // --------------------------------------------------

    res.status(201).json({
      success: true,
      message: "Roll Receiving Added Successfully",

      rollReceiving,

      inventory: {
        product: product.productName,
        category: product.category,
        gauge: product.gauge,

        quantityReceived: rollWeight,

        previousQuantity,

        newQuantity,

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
    console.error(
      "Roll Receiving Error:",
      error
    );

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
    const rollReceivings =
      await RollReceiving.find()
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

// ======================================================
// GET SINGLE ROLL RECEIVING
// ======================================================

const getRollReceivingById = async (
  req,
  res
) => {
  try {
    const rollReceiving =
      await RollReceiving.findById(
        req.params.id
      ).populate("supplier");

    if (!rollReceiving) {
      return res.status(404).json({
        success: false,
        message:
          "Roll Receiving record not found",
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

// ======================================================
// EXPORTS
// ======================================================

module.exports = {
  addRollReceiving,
  getRollReceivings,
  getRollReceivingById,
};