import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import bodyParser from "body-parser";

const app = express();

// Get current directory of app.js (since Vercel runs serverless)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  next();
});

app.get("/meals", async (req, res) => {
  try {
    const mealsPath = path.join(__dirname, "data", "available-meals.json");
    const meals = await fs.readFile(mealsPath, "utf8");
    res.json(JSON.parse(meals));
  } catch (err) {
    res.status(500).json({ message: "Could not read meals file." });
  }
});

app.post("/orders", async (req, res) => {
  const orderData = req.body.order;

  if (
    orderData === null ||
    orderData.items === null ||
    orderData.items.length === 0
  ) {
    return res.status(400).json({
      message: orderData === null ? "Data Missing." : "Order Data Missing.",
    });
  }

  if (Object.keys(orderData.customer)?.length === 0) {
    return res.status(400).json({ message: "Customer Missing." });
  }

  if (
    orderData.customer.email === null ||
    !orderData.customer.email.includes("@") ||
    orderData.customer.name === null ||
    orderData.customer.name.trim() === "" ||
    orderData.customer.street === null ||
    orderData.customer.street.trim() === "" ||
    orderData.customer["postal-code"] === null ||
    orderData.customer["postal-code"].trim() === "" ||
    orderData.customer.city === null ||
    orderData.customer.city.trim() === ""
  ) {
    return res.status(400).json({
      message:
        "Missing data: Email, name, street, postal code or city is missing.",
    });
  }

  try {
    const ordersPath = path.join(__dirname, "data", "orders.json");
    const orders = await fs.readFile(ordersPath, "utf8");
    const allOrders = JSON.parse(orders);
    const newOrder = { ...orderData, id: (Math.random() * 1000).toString() };

    allOrders.push(newOrder);
    await fs.writeFile(ordersPath, JSON.stringify(allOrders));
    res.status(201).json({ message: "Order created!" });
  } catch (err) {
    res.status(500).json({ message: "Could not save order." });
  }
});

// Remove app.listen for Vercel compatibility

export default app; // 👈 Required for Vercel serverless function
