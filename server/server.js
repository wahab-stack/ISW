require("dotenv").config();

const express = require("express");
const connectDB = require("./config/db");
const loggerMiddleware = require("./middleware/loggerMiddleware");
const customerRoutes = require("./routes/customerRoutes");

connectDB();

const app = express();

app.use(loggerMiddleware);
app.use(express.json());

app.use("/api/customers", customerRoutes);

// First Route
app.get("/", (req, res) => {
  res.send("Welcome to Smart Indus Steel Works Backend");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
