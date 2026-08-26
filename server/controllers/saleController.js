
const mongoose = require("mongoose");
const Sale = require("../models/Sale");
const Customer = require("../models/Customer");
const Inventory = require("../models/Inventory");
const CustomerLedger = require("../models/CustomerLedger");

// ======================================================
// ADD NEW SALE
// ======================================================

const addSale = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      receiptNo,
      date,
      customer,
      saleCategory,
      gageNumber,
      weight,
      loading,
      mazdory,
      loaderRent,
      advancePayment,
      totalPayment,
    } = req.body;

    // --------------------------------------------------
    // 1. CHECK DUPLICATE RECEIPT NUMBER
    // --------------------------------------------------

    const existingSale = await Sale.findOne({
      receiptNo,
    }).session(session);

    if (existingSale) {
      await session.abortTransaction();

      return res.status(409).json({
        success: false,
        message: "A sale with this receipt number already exists.",
        receiptNo,
      });
    }

    // --------------------------------------------------
    // 2. VALIDATE TOTAL PAYMENT
    // --------------------------------------------------

    if (totalPayment === undefined || Number(totalPayment) <= 0) {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message: "Total payment must be greater than 0.",
      });
    }

    const total = Number(totalPayment);

    // --------------------------------------------------
    // 3. VALIDATE ADVANCE PAYMENT
    // --------------------------------------------------

    const advance = Number(advancePayment || 0);

    if (advance < 0) {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message: "Advance payment cannot be negative.",
      });
    }

    if (advance > total) {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message:
          "Advance payment cannot be greater than the total sale amount.",
        totalPayment: total,
        advancePayment: advance,
      });
    }

    // --------------------------------------------------
    // 4. CHECK CUSTOMER
    // --------------------------------------------------

    const customerRecord = await Customer.findById(customer)
      .session(session);

    if (!customerRecord) {
      await session.abortTransaction();

      return res.status(404).json({
        success: false,
        message: "Customer not found.",
      });
    }

    if (customerRecord.status !== "Active") {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message: "This customer is inactive.",
      });
    }

    // --------------------------------------------------
    // 5. VALIDATE SALE CATEGORY
    // --------------------------------------------------

    const validCategories = [
      "Profile Chaddar",
      "Jastee",
      "Steel",
    ];

    if (!validCategories.includes(saleCategory)) {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message: "Invalid sale category.",
        allowedCategories: validCategories,
      });
    }

    // --------------------------------------------------
    // 6. VALIDATE GAUGE
    // --------------------------------------------------

    if (gageNumber === undefined || gageNumber === null) {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message: "Gauge number is required.",
      });
    }

    const gauge = Number(gageNumber);

    const allowedGauges = [14, 16, 18, 20, 22, 23];

    if (!allowedGauges.includes(gauge)) {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message: "Invalid gauge number.",
        allowedGauges,
      });
    }

    // --------------------------------------------------
    // 7. VALIDATE WEIGHT
    // --------------------------------------------------

    const quantityToDeduct = Number(weight || 0);

    if (quantityToDeduct <= 0) {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message: "Weight must be greater than 0.",
      });
    }

    // --------------------------------------------------
    // 8. DETERMINE INVENTORY CATEGORY
    //
    // Jastee -> iron
    // Steel  -> steel
    // Profile Chaddar -> profile chaddar
    // --------------------------------------------------

    let inventoryCategory;

    if (saleCategory === "Jastee") {
      inventoryCategory = "iron";
    } else if (saleCategory === "Steel") {
      inventoryCategory = "steel";
    } else if (saleCategory === "Profile Chaddar") {
      inventoryCategory = "profile chaddar";
    }

    // --------------------------------------------------
    // 9. FIND MATCHING INVENTORY
    // --------------------------------------------------

    let inventoryItem;

    inventoryItem = await Inventory.findOne({
      unit: "kg",
    })
      .populate({
        path: "product",
        match: {
          category:
            saleCategory === "Steel"
              ? {
                  $regex: "^steel$",
                  $options: "i",
                }
              : saleCategory === "Profile Chaddar"
              ? {
                  $regex: "profile",
                  $options: "i",
                }
              : "iron",

          gauge: gauge,
          status: "Active",
        },
      })
      .session(session);

    // If populate found an inventory record but product didn't match
    if (inventoryItem && !inventoryItem.product) {
      inventoryItem = null;
    }

    // --------------------------------------------------
    // 10. CHECK INVENTORY EXISTS
    // --------------------------------------------------

    if (!inventoryItem) {
      await session.abortTransaction();

      return res.status(404).json({
        success: false,
        message:
          "Matching inventory product was not found. Please register the product and inventory for this gauge first.",
        category: inventoryCategory,
        gauge,
      });
    }

    // --------------------------------------------------
    // 11. CHECK AVAILABLE STOCK
    // --------------------------------------------------

    const previousQuantity = Number(
      inventoryItem.quantity || 0
    );

    if (quantityToDeduct > previousQuantity) {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message: "Insufficient inventory stock.",
        product: inventoryItem.product.productName,
        availableStock: previousQuantity,
        requestedQuantity: quantityToDeduct,
        unit: inventoryItem.unit,
      });
    }

    // --------------------------------------------------
    // 12. CALCULATE NEW INVENTORY QUANTITY
    // --------------------------------------------------

    const newQuantity =
      previousQuantity - quantityToDeduct;

    // --------------------------------------------------
    // 13. UPDATE INVENTORY STATUS
    // --------------------------------------------------

    let inventoryStatus = "Available";

    if (newQuantity <= 0) {
      inventoryStatus = "Out of Stock";
    } else if (
      newQuantity <=
      Number(inventoryItem.minimumStock || 0)
    ) {
      inventoryStatus = "Low Stock";
    }

    // --------------------------------------------------
    // 14. CREATE SALE
    // --------------------------------------------------

    const sale = await Sale.create(
      [
        {
          receiptNo,
          date,
          customer,
          saleCategory,
          gageNumber: gauge,
          weight: quantityToDeduct,
          loading,
          mazdory,
          loaderRent,
          advancePayment: advance,
          totalPayment: total,
        },
      ],
      { session }
    );

    // --------------------------------------------------
    // 15. UPDATE INVENTORY
    // --------------------------------------------------

    inventoryItem.quantity = newQuantity;
    inventoryItem.status = inventoryStatus;

    await inventoryItem.save({
      session,
    });

    // --------------------------------------------------
    // 16. CREATE CUSTOMER SALE LEDGER
    // --------------------------------------------------

    const saleLedgerEntry =
      await CustomerLedger.create(
        [
          {
            customer,
            transactionType: "SALE",
            amount: total,
            reference: receiptNo,
            description: `Sale of ${saleCategory}`,
            date: date || new Date(),
          },
        ],
        { session }
      );

    // --------------------------------------------------
    // 17. CREATE ADVANCE PAYMENT LEDGER
    // --------------------------------------------------

    let advanceLedgerEntry = null;

    if (advance > 0) {
      const advanceLedger =
        await CustomerLedger.create(
          [
            {
              customer,
              transactionType: "ADVANCE_PAYMENT",
              amount: advance,
              reference: receiptNo,
              description:
                `Advance payment received for ${saleCategory}`,
              date: date || new Date(),
            },
          ],
          { session }
        );

      advanceLedgerEntry = advanceLedger[0];
    }

    // --------------------------------------------------
    // 18. COMMIT TRANSACTION
    // --------------------------------------------------

    await session.commitTransaction();

    // --------------------------------------------------
    // 19. RESPONSE
    // --------------------------------------------------

    res.status(201).json({
      success: true,
      message: "Sale Added Successfully",

      sale: sale[0],

      inventory: {
        product: inventoryItem.product.productName,
        category: inventoryItem.product.category,
        gauge: inventoryItem.product.gauge,

        quantitySold: quantityToDeduct,
        previousQuantity,
        newQuantity,

        unit: inventoryItem.unit,
        status: inventoryStatus,
      },

      ledgerEntry: saleLedgerEntry[0],

      advanceLedgerEntry,
    });
  } catch (error) {
    // --------------------------------------------------
    // ROLLBACK EVERYTHING IF SOMETHING FAILS
    // --------------------------------------------------

    await session.abortTransaction();

    console.error(
      "Sale Transaction Error:",
      error
    );

    res.status(400).json({
      success: false,
      message: error.message,
    });
  } finally {
    session.endSession();
  }
};

// ======================================================
// GET ALL SALES
// ======================================================

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

// ======================================================
// GET SINGLE SALE
// ======================================================

const getSaleById = async (req, res) => {
  try {
    const sale = await Sale.findById(
      req.params.id
    ).populate("customer");

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
