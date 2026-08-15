const mongoose = require("mongoose");
const Sale = require("../models/Sale");
const Customer = require("../models/Customer");
const Inventory = require("../models/Inventory");
const CustomerLedger = require("../models/CustomerLedger");

// ADD New Sale
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
      sheetQuantity,
      weight,
      loading,
      mazdory,
      loaderRent,
      advancePayment,
      totalPayment,
    } = req.body;

    // --------------------------------------------------
    // 1. CHECK DUPLICATE RECEIPT
    // --------------------------------------------------
    const existingSale = await Sale.findOne({ receiptNo }).session(session);

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

    // --------------------------------------------------
    // 3. VALIDATE ADVANCE PAYMENT
    // --------------------------------------------------
    const advance = Number(advancePayment || 0);
    const total = Number(totalPayment);

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
    const customerRecord = await Customer.findById(customer).session(session);

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
      });
    }

    // --------------------------------------------------
    // 6. FIND INVENTORY PRODUCT
    // --------------------------------------------------
    let inventoryItem = null;

    if (saleCategory === "Jastee") {
      // Jastee is iron
      inventoryItem = await Inventory.findOne({
        unit: "kg",
      })
        .populate("product")
        .session(session);

      // Find specifically an iron product with matching gauge
      if (gageNumber !== undefined) {
        inventoryItem = await Inventory.findOne({
          unit: "kg",
        })
          .populate({
            path: "product",
            match: {
              category: "iron",
              gauge: Number(gageNumber),
              status: "Active",
            },
          })
          .session(session);

        if (inventoryItem && !inventoryItem.product) {
          inventoryItem = null;
        }
      } else {
        inventoryItem = null;
      }
    }

    if (saleCategory === "Steel") {
      // Steel inventory
      if (gageNumber !== undefined) {
        inventoryItem = await Inventory.findOne({
          unit: "kg",
        })
          .populate({
            path: "product",
            match: {
              category: {
                $regex: "steel",
                $options: "i",
              },
              gauge: Number(gageNumber),
              status: "Active",
            },
          })
          .session(session);

        if (inventoryItem && !inventoryItem.product) {
          inventoryItem = null;
        }
      }
    }

    if (saleCategory === "Profile Chaddar") {
      // Profile Chaddar currently requires a registered inventory product.
      inventoryItem = await Inventory.findOne({
        unit: {
          $in: ["sheet", "sheets", "pcs", "piece"],
        },
      })
        .populate({
          path: "product",
          match: {
            category: {
              $regex: "profile",
              $options: "i",
            },
            status: "Active",
          },
        })
        .session(session);

      if (inventoryItem && !inventoryItem.product) {
        inventoryItem = null;
      }
    }

    // --------------------------------------------------
    // 7. CHECK INVENTORY EXISTS
    // --------------------------------------------------
    if (!inventoryItem) {
      await session.abortTransaction();

      return res.status(404).json({
        success: false,
        message: `No inventory product found for ${saleCategory}${
          gageNumber ? ` with gauge ${gageNumber}` : ""
        }. Please register the correct product and inventory first.`,
      });
    }

    // --------------------------------------------------
    // 8. DETERMINE QUANTITY TO DEDUCT
    // --------------------------------------------------
    let quantityToDeduct = 0;

    if (saleCategory === "Profile Chaddar") {
      quantityToDeduct = Number(sheetQuantity || 0);

      if (quantityToDeduct <= 0) {
        await session.abortTransaction();

        return res.status(400).json({
          success: false,
          message:
            "Sheet quantity must be greater than 0 for Profile Chaddar.",
        });
      }
    } else {
      quantityToDeduct = Number(weight || 0);

      if (quantityToDeduct <= 0) {
        await session.abortTransaction();

        return res.status(400).json({
          success: false,
          message:
            "Weight must be greater than 0 for Steel and Jastee sales.",
        });
      }
    }

    // --------------------------------------------------
    // 9. CHECK AVAILABLE STOCK
    // --------------------------------------------------
    if (inventoryItem.quantity < quantityToDeduct) {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message: "Insufficient inventory stock.",
        product: inventoryItem.product.productName,
        availableStock: inventoryItem.quantity,
        requestedQuantity: quantityToDeduct,
        unit: inventoryItem.unit,
      });
    }

    // --------------------------------------------------
    // 10. CREATE SALE
    // --------------------------------------------------
    const sale = await Sale.create(
      [
        {
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
          advancePayment: advance,
          totalPayment: total,
        },
      ],
      { session }
    );

    // --------------------------------------------------
    // 11. DEDUCT INVENTORY
    // --------------------------------------------------
    const previousQuantity = inventoryItem.quantity;

    inventoryItem.quantity =
      previousQuantity - quantityToDeduct;

    // Update inventory status
    if (inventoryItem.quantity === 0) {
      inventoryItem.status = "Out of Stock";
    } else if (
      inventoryItem.quantity <= inventoryItem.minimumStock
    ) {
      inventoryItem.status = "Low Stock";
    } else {
      inventoryItem.status = "Available";
    }

    await inventoryItem.save({ session });

    // --------------------------------------------------
    // 12. CREATE CUSTOMER SALE LEDGER
    // --------------------------------------------------
    const ledgerEntries = [];

    const saleLedgerEntry = await CustomerLedger.create(
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

    ledgerEntries.push(saleLedgerEntry[0]);

    // --------------------------------------------------
    // 13. CREATE ADVANCE PAYMENT LEDGER
    // --------------------------------------------------
    let advanceLedgerEntry = null;

    if (advance > 0) {
      const advanceLedger = await CustomerLedger.create(
        [
          {
            customer,
            transactionType: "ADVANCE_PAYMENT",
            amount: advance,
            reference: receiptNo,
            description: `Advance payment received for ${saleCategory}`,
            date: date || new Date(),
          },
        ],
        { session }
      );

      advanceLedgerEntry = advanceLedger[0];

      ledgerEntries.push(advanceLedgerEntry);
    }

    // --------------------------------------------------
    // 14. COMMIT TRANSACTION
    // --------------------------------------------------
    await session.commitTransaction();

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
        newQuantity: inventoryItem.quantity,
        unit: inventoryItem.unit,
        status: inventoryItem.status,
      },

      ledgerEntry: saleLedgerEntry[0],
      advanceLedgerEntry,
    });
  } catch (error) {
    // --------------------------------------------------
    // 15. ROLLBACK EVERYTHING IF ANYTHING FAILS
    // --------------------------------------------------
    await session.abortTransaction();

    console.error("Sale Transaction Error:", error);

    res.status(400).json({
      success: false,
      message: error.message,
    });
  } finally {
    session.endSession();
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