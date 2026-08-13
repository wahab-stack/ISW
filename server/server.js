require("dotenv").config();

const express = require("express");
const connectDB = require("./config/db");
const loggerMiddleware = require("./middleware/loggerMiddleware");
const customerRoutes = require("./routes/customerRoutes");
const productRoutes = require("./routes/productRoutes");
const inventoryRoutes = require("./routes/inventoryRoutes");
const supplierRoutes = require("./routes/supplierRoutes");
const rollReceivingRoutes = require("./routes/rollReceivingRoutes");
const supplierLedgerRoutes = require("./routes/supplierLedgerRoutes");
const customerLedgerRoutes = require("./routes/customerLedgerRoutes");
const saleRoutes = require("./routes/saleRoutes");


connectDB();

const app = express();

app.use(loggerMiddleware);
app.use(express.json());

app.use("/api/customers", customerRoutes);
app.use("/api/products", productRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/suppliers", supplierRoutes);
app.use("/api/roll-receiving", rollReceivingRoutes);
app.use("/api/supplier-ledger", supplierLedgerRoutes);
app.use("/api/customer-ledger", customerLedgerRoutes);
app.use("/api/sales", saleRoutes);
// First Route
app.get("/", (req, res) => {
  res.send("Welcome to Smart Indus Steel Works Backend");
});

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
