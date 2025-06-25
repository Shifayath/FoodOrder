import fs from "node:fs/promises";
import path from "path";
import { fileURLToPath } from "node:url";
import express from "express";
import bodyParser from "body-parser";
import { db } from "./db/firebaseAdmin.js";
const app = express();

// Get current directory (important for Vercel serverless)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse JSON bodies
app.use(bodyParser.json());

// ✅ Serve static files from /public/images under /images route
app.use("/images", express.static(path.join(__dirname, "public", "images")));

// ✅ Optional: Serve other static assets from /public if needed
app.use(express.static(path.join(__dirname, "public")));

// CORS setup
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  next();
});

// ✅ GET /meals
app.get("/meals", async (req, res) => {
  try {
    const mealsPath = path.join(__dirname, "data", "available-meals.json");
    const meals = await fs.readFile(mealsPath, "utf8");
    res.json(JSON.parse(meals));
  } catch (err) {
    res.status(500).json({ message: "Could not read meals file." });
  }
});

// ✅ POST /orders
app.post("/orders", async (req, res) => {
  const orderData = req.body.order;

  if (!orderData || !orderData.items || orderData.items.length === 0) {
    return res.status(400).json({
      message: orderData === null ? "Data Missing." : "Order Data Missing.",
    });
  }

  if (!orderData.customer || Object.keys(orderData.customer).length === 0) {
    return res.status(400).json({ message: "Customer Missing." });
  }

  const { email, name, street, city, ["postal-code"]: postalCode } = orderData.customer;

  if (
    !email?.includes("@") ||
    !name?.trim() ||
    !street?.trim() ||
    !postalCode?.trim() ||
    !city?.trim()
  ) {
    return res.status(400).json({
      message:
        "Missing data: Email, name, street, postal code or city is missing.",
    });
  }

  // try {
  //   const ordersPath = path.join(__dirname, "data", "orders.json");
  //   const orders = await fs.readFile(ordersPath, "utf8");
  //   const allOrders = JSON.parse(orders);
  //   const newOrder = { ...orderData, id: Date.now().toString() };

  //   allOrders.push(newOrder);
  //   await fs.writeFile(ordersPath, JSON.stringify(allOrders));
    
  //   res.status(201).json({ message: "Order created!" });
  // } catch (err) {
  //   res.status(500).json({ message: "Could not save order." });
  // }

   try {
    const ordersRef = db.collection("orders");
    const newOrderRef = await ordersRef.add({
      ...orderData,
      createdAt: new Date().toISOString(),
    });

    res.status(201).json({ message: "Order created!", orderId: newOrderRef.id });
  } catch (err) {
    console.error("Error writing to Firestore:", err);
    res.status(500).json({ message: "Could not save order to Firestore." });
  }
});

// ✅ Export for Vercel
export default app;
