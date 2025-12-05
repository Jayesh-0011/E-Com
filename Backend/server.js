import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { connectDB } from "./db.js";
import nodemailer from "nodemailer";
import mongoose from "mongoose";

// Import Mongoose models
import {
  User,
  UserAddress,
  CustomerOrder,
  RetailerOrder,
  CustomerQuery,
  RetailerInventory,
  WholesalerInventory
} from "./models/index.js";

import wholesalerRoutes from "./routes/WholesalerRoutes.js";
import retailerRoutes from "./routes/RetailerRoutes.js";
import ConsumerRoutes from "./routes/ConsumerRoutes.js";
import deliveryRoutes from './routes/DeliveryRoutes.js';
import Stripe from "stripe";

dotenv.config();
const app = express();
const SECRET = process.env.SECRET;
console.log(SECRET);

app.use(cors());
app.use(express.json());

// COOP fix
app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "unsafe-none");
  res.setHeader("Cross-Origin-Embedder-Policy", "unsafe-none");
  next();
});

app.use((req, res, next) => {
  next();
});

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// Connect to MongoDB
connectDB();

// JWT authentication
export function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader) return res.status(401).json({ message: "No token provided" });

  const token = authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Token missing" });

  jwt.verify(token, SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ message: "Invalid or expired token" });
    req.user = decoded;
    next();
  });
}

// ----------------------------------------------------------------------
// MANUAL SIGNUP
// ----------------------------------------------------------------------
app.post("/manual-signup", async (req, res) => {
  try {
    const { user } = req.body;
    const { uid, name, email, role, phone, password, addressLine1, addressLine2, city, pincode, state } = user;

    console.log("REQ BODY:", req.body);

    // VALIDATION - Address not required for delivery role
    if (!uid || !name || !email || !role || !phone || !password) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    if (role !== "delivery" && (!addressLine1 || !city || !pincode || !state)) {
      return res.status(400).json({ error: "Address is required for this role (Address Line 1, City, Pincode, State)" });
    }

    // CHECK IF USER EXISTS
    const existingUser = await User.findOne({ uid });
    if (existingUser) {
      return res.status(409).json({ error: "User already exists" });
    }

    // HASH PASSWORD
    const hashedPassword = await bcrypt.hash(password, 10);

    // CREATE USER
    const newUser = new User({
      uid,
      username: name,
      phone_no: phone,
      email,
      role,
      password: hashedPassword,
      email_verified: true // Verified since OTP was checked
    });
    await newUser.save();

    // INSERT ADDRESS if not delivery role
    let addressObj = null;
    if (role !== "delivery" && addressLine1 && city && pincode && state) {
      const newAddress = new UserAddress({
        uid,
        address_line1: addressLine1,
        address_line2: addressLine2 || null,
        city,
        pincode,
        state
      });
      await newAddress.save();

      addressObj = {
        addressLine1: newAddress.address_line1,
        addressLine2: newAddress.address_line2,
        city: newAddress.city,
        pincode: newAddress.pincode,
        state: newAddress.state
      };
    }

    const token = jwt.sign({ uid, email, role }, process.env.SECRET, { expiresIn: "30d" });

    res.json({
      token,
      user: { uid, name, email, role, phone, address: addressObj }
    });

  } catch (err) {
    console.error("manual-signup error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// ----------------------------------------------------------------------
// GOOGLE SIGNUP
// ----------------------------------------------------------------------
app.post("/google-signup", async (req, res) => {
  try {
    const { user } = req.body;

    console.log("REQ BODY:", req.body);

    // VALIDATION
    if (!user) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const existingUser = await User.findOne({ uid: user.uid });
    if (existingUser) {
      return res.status(409).json({ error: "User already exists" });
    }

    const { addressLine1, addressLine2, city, pincode, state } = user;

    // CREATE USER
    const newUser = new User({
      uid: user.uid,
      username: user.username,
      phone_no: user.phone_no,
      email: user.email,
      role: user.role,
      password: null, // google users have no password
      email_verified: true // Google users are pre-verified
    });
    await newUser.save();

    // INSERT ADDRESS if not delivery role and address fields provided
    let addressObj = null;
    if (user.role !== "delivery" && addressLine1 && city && pincode && state) {
      const newAddress = new UserAddress({
        uid: user.uid,
        address_line1: addressLine1,
        address_line2: addressLine2 || null,
        city,
        pincode,
        state
      });
      await newAddress.save();

      addressObj = {
        addressLine1: newAddress.address_line1,
        addressLine2: newAddress.address_line2,
        city: newAddress.city,
        pincode: newAddress.pincode,
        state: newAddress.state
      };
    }

    const token = jwt.sign({ uid: user.uid, email: user.email, role: user.role }, process.env.SECRET, { expiresIn: "30d" });

    res.json({
      token,
      user: {
        uid: user.uid,
        name: user.username,
        email: user.email,
        role: user.role,
        phone: user.phone_no,
        address: addressObj
      }
    });

  } catch (err) {
    console.error("google-signup error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// ----------------------------------------------------------------------
// MANUAL LOGIN
// ----------------------------------------------------------------------
app.post("/manual-login", async (req, res) => {
  try {
    const { user } = req.body;
    const { identifier, password, role } = user;

    if (!identifier || !password || !role) {
      return res.status(400).json({ error: "Missing login fields" });
    }

    const foundUser = await User.findOne({
      $or: [{ email: identifier }, { username: identifier }],
      role: role
    });

    if (!foundUser) {
      return res.status(404).json({ error: "User not found or role mismatch" });
    }

    // Check if email is verified
    if (!foundUser.email_verified) {
      return res.status(403).json({
        error: "Email not verified. Please verify your email before logging in.",
        requiresVerification: true
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, foundUser.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Incorrect username or password" });
    }

    // Create token with user data from database
    const tokenPayload = {
      uid: foundUser.uid,
      email: foundUser.email,
      role: foundUser.role
    };
    const token = jwt.sign(tokenPayload, SECRET, { expiresIn: "30d" });

    // Fetch address from user_addresses collection
    let addressObj = null;
    if (foundUser.role !== "delivery") {
      const address = await UserAddress.findOne({ uid: foundUser.uid });
      if (address) {
        addressObj = {
          addressLine1: address.address_line1,
          addressLine2: address.address_line2,
          city: address.city,
          pincode: address.pincode,
          state: address.state
        };
      }
    }

    res.json({
      token,
      user: {
        uid: foundUser.uid,
        name: foundUser.username,
        email: foundUser.email,
        role: foundUser.role,
        phone: foundUser.phone_no,
        address: addressObj
      }
    });

  } catch (err) {
    console.error("manual-login error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// ----------------------------------------------------------------------
// GOOGLE LOGIN
// ----------------------------------------------------------------------
app.post("/google-login", async (req, res) => {
  try {
    const { user } = req.body;

    if (!user) {
      return res.status(400).json({ error: "Firebase UID and role required" });
    }

    const foundUser = await User.findOne({ uid: user.uid });

    if (!foundUser) {
      return res.status(404).json({ error: "User not registered" });
    }

    // Fetch address from user_addresses collection
    let addressObj = null;
    if (foundUser.role !== "delivery") {
      const address = await UserAddress.findOne({ uid: foundUser.uid });
      if (address) {
        addressObj = {
          addressLine1: address.address_line1,
          addressLine2: address.address_line2,
          city: address.city,
          pincode: address.pincode,
          state: address.state
        };
      }
    }

    // Create token
    const tokenPayload = {
      uid: foundUser.uid,
      email: foundUser.email,
      role: foundUser.role
    };
    const token = jwt.sign(tokenPayload, SECRET, { expiresIn: "30d" });

    res.json({
      token,
      user: {
        uid: foundUser.uid,
        name: foundUser.username,
        email: foundUser.email,
        role: foundUser.role,
        phone: foundUser.phone_no,
        address: addressObj
      }
    });

  } catch (err) {
    console.error("google-login error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// ----------------------------------------------------------------------
// RETAILER ORDERS (Place order to wholesaler)
// ----------------------------------------------------------------------
app.post("/api/retailer/orders", authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;  // from JWT (retailer uid)
    const { items } = req.body;
    console.log("🔥 Retailer order items:", JSON.stringify(items, null, 2));

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        error: "No items in order. Please add items to cart before placing order."
      });
    }

    let ordersCreated = 0;
    const errors = [];

    for (const it of items) {
      const productId = it.id || it.product_id;

      if (!productId) {
        console.error("❌ Missing product_id in item:", it);
        errors.push(`Missing product ID for item: ${it.title || 'Unknown'}`);
        continue;
      }

      // Look up the wholesaler_uid from the wholesaler_inventory
      const product = await WholesalerInventory.findOne({ product_id: productId });

      if (!product) {
        console.error(`❌ Product ${productId} not found in wholesaler_inventory`);
        errors.push(`Product ${it.title || productId} not found`);
        continue;
      }

      const wholesalerUid = product.uid;

      if (!wholesalerUid) {
        console.error(`❌ No wholesaler_uid found for product ${productId}`);
        errors.push(`No wholesaler found for product ${it.title || productId}`);
        continue;
      }

      console.log(`✅ Ordering product ${productId} from wholesaler ${wholesalerUid}`);

      const quantity = it.qty || 1;

      // Check current stock before placing order
      if (product.product_stock < quantity) {
        errors.push(`Insufficient stock for ${it.title || productId}. Available: ${product.product_stock}, Requested: ${quantity}`);
        continue;
      }

      // Create the order
      const newOrder = new RetailerOrder({
        retailer_uid: uid,
        wholesaler_uid: wholesalerUid,
        product_id: productId,
        product_quantity: quantity,
        status: "Placed"
      });
      await newOrder.save();

      // Decrease stock in wholesaler_inventory
      await WholesalerInventory.updateOne(
        { product_id: productId, uid: wholesalerUid },
        { $inc: { product_stock: -quantity } }
      );

      ordersCreated++;
      console.log(`✅ Order created for product ${productId}, quantity ${quantity}`);
    }

    if (ordersCreated === 0) {
      return res.status(400).json({
        error: "Failed to create any orders.",
        errors: errors
      });
    }

    if (errors.length > 0) {
      return res.status(207).json({
        message: `Order placed successfully for ${ordersCreated} item(s). Some items could not be ordered.`,
        ordersCreated,
        errors
      });
    }

    res.json({ message: "Order placed successfully", ordersCreated });
  } catch (err) {
    console.error("❌ Place order error:", err);
    res.status(500).json({ error: "Database error", message: err.message });
  }
});

// GET retailer orders
app.get("/api/retailer/orders", authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;

    const orders = await RetailerOrder.find({ retailer_uid: uid }).sort({ createdAt: -1 });

    // Enrich with product and wholesaler details
    const enrichedOrders = await Promise.all(orders.map(async (order) => {
      const product = await WholesalerInventory.findOne({
        product_id: order.product_id,
        uid: order.wholesaler_uid
      });
      const wholesaler = await User.findOne({ uid: order.wholesaler_uid });

      return {
        s_no: order._id,
        retailer_uid: order.retailer_uid,
        wholesaler_uid: order.wholesaler_uid,
        wholesaler_name: wholesaler?.username || "Unknown",
        product_id: order.product_id,
        product_name: product?.product_name || "Unknown Product",
        product_category: product?.product_category || "General",
        product_image: product?.image || "",
        product_quantity: order.product_quantity,
        product_price: product?.product_price || 0,
        total: (order.product_quantity || 0) * (product?.product_price || 0),
        status: order.status || "Placed",
        order_date: order.order_date || order.createdAt,
        delivered_date: order.delivered_date || null,
        delivery_confirmed: order.delivery_confirmed || false
      };
    }));

    res.json(enrichedOrders);
  } catch (err) {
    console.error("Fetch orders error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// GET retailer orders for wholesaler
app.get("/api/retailer/orders/wholesaler", authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user; // wholesaler UID from token

    const orders = await RetailerOrder.find({ wholesaler_uid: uid });

    res.json(orders);

  } catch (err) {
    console.error("Fetch wholesaler retailer_orders error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// UPDATE retailer order status
app.put("/api/retailer/orders/status", authenticateToken, async (req, res) => {
  try {
    let { status, s_no } = req.body;

    if (!s_no || !status) {
      return res.status(400).json({ error: "orderId and status required" });
    }

    const order = await RetailerOrder.findByIdAndUpdate(
      s_no,
      { status },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json({
      message: "Status updated successfully",
      order: order,
    });

  } catch (err) {
    console.error("Update status error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// Stripe Checkout Session
app.post("/create-checkout-session", async (req, res) => {
  try {
    const { amount, role = "customer" } = req.body;

    if (!amount) {
      return res.status(400).json({ error: "Amount missing" });
    }

    const amountNum = Number(amount);
    const minAmount = 50; // Minimum ₹50 for Stripe

    if (isNaN(amountNum) || amountNum < minAmount) {
      return res.status(400).json({
        error: `Minimum payment amount is ₹${minAmount}. Your order total is ₹${amountNum.toFixed(2)}.`
      });
    }

    // Determine success and cancel URLs based on role
    const baseUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const successUrl = role === "customer"
      ? `${baseUrl}/customer/home?payment=success`
      : `${baseUrl}/retailer/home?payment=success`;
    const cancelUrl = role === "customer"
      ? `${baseUrl}/customer/home?payment=cancelled`
      : `${baseUrl}/retailer/home?payment=cancelled`;

    const unitAmount = Math.round(amountNum * 100); // Convert to paise

    if (unitAmount < 5000) {
      return res.status(400).json({
        error: `Minimum payment amount is ₹${minAmount}. Your order total is ₹${amountNum.toFixed(2)}.`
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "inr",
            product_data: { name: "QuickShop Order" },
            unit_amount: unitAmount,
          },
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        role: role,
        amount: amountNum.toString()
      }
    });

    return res.json({ url: session.url });

  } catch (err) {
    console.error("Stripe error:", err);

    if (err.code === 'amount_too_small') {
      return res.status(400).json({
        error: "Payment amount is too small. Minimum amount is ₹50. Please add more items to your cart."
      });
    }

    return res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------------------------
// ROUTES
// ----------------------------------------------------------------------
app.use("/api/wholesaler", authenticateToken, wholesalerRoutes);
app.use("/api/retailer", authenticateToken, retailerRoutes);
app.use("/api/consumer", authenticateToken, ConsumerRoutes);
app.use("/api/delivery", authenticateToken, deliveryRoutes);

// ----------------------------------------------------------------------
// OTP VERIFICATION
// ----------------------------------------------------------------------
const otpStore = new Map(); // email -> { otp, expiresAt }

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function createTransporter() {
  const emailUser = process.env.EMAIL_USER || process.env.GMAIL_USER;
  const emailPass = process.env.EMAIL_PASS || process.env.GMAIL_APP_PASSWORD;

  if (!emailUser || !emailPass) {
    console.warn("⚠️ Email credentials not configured. OTP will be logged to console.");
    return null;
  }

  const config = {
    service: "gmail",
    auth: {
      user: emailUser,
      pass: emailPass
    },
    pool: true,
    maxConnections: 1,
    maxMessages: 3
  };

  const transporter = nodemailer.createTransport(config);

  transporter.verify().then(() => {
    console.log("✅ Email transporter ready. Sender:", emailUser);
  }).catch((error) => {
    console.error("❌ Email transporter verification failed:", error.message);
  });

  return transporter;
}

// Create order status email template
function createOrderStatusEmailTemplate(orderDetails) {
  const { orderNumber, productName, status, quantity, total, orderDate, deliveredDate } = orderDetails;

  const statusConfig = {
    "Confirmed": {
      title: "Order Confirmed! 🎉",
      message: "Great news! Your order has been confirmed and is being prepared for dispatch.",
      color: "#fbbf24",
      gradient: "linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)",
      icon: "✅"
    },
    "Dispatched": {
      title: "Order Dispatched! 🚚",
      message: "Your order is on the way! It has been dispatched and will arrive soon.",
      color: "#3b82f6",
      gradient: "linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)",
      icon: "📦"
    },
    "Delivered": {
      title: "Order Delivered! 🎊",
      message: "Your order has been successfully delivered! We hope you enjoy your purchase.",
      color: "#10b981",
      gradient: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
      icon: "🎁"
    }
  };

  const config = statusConfig[status] || {
    title: `Order ${status}`,
    message: `Your order status has been updated to ${status}.`,
    color: "#94a3b8",
    gradient: "linear-gradient(135deg, #64748b 0%, #94a3b8 100%)",
    icon: "📋"
  };

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Update - QuickShop</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%);">
      <table role="presentation" style="width: 100%; border-collapse: collapse; background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%); padding: 40px 20px;">
        <tr>
          <td align="center">
            <table role="presentation" style="max-width: 600px; width: 100%; background: rgba(0, 0, 0, 0.8); border-radius: 20px; overflow: hidden; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5); border: 1px solid rgba(59, 130, 246, 0.3);">
              <tr>
                <td style="background: ${config.gradient}; padding: 40px 30px; text-align: center;">
                  <div style="display: inline-block; background: rgba(255, 255, 255, 0.2); backdrop-filter: blur(10px); padding: 12px 20px; border-radius: 12px; margin-bottom: 20px;">
                    <span style="color: white; font-size: 28px; font-weight: bold; letter-spacing: 2px;">QS</span>
                  </div>
                  <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 700; text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);">QuickShop</h1>
                  <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 16px;">${config.icon} ${config.title}</p>
                </td>
              </tr>
              <tr>
                <td style="padding: 50px 30px;">
                  <p style="color: #e2e8f0; margin: 0 0 30px 0; font-size: 16px; line-height: 1.6;">
                    ${config.message}
                  </p>
                  <div style="background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(59, 130, 246, 0.2); border-radius: 16px; padding: 25px; margin: 30px 0;">
                    <h3 style="color: #cbd5e1; margin: 0 0 20px 0; font-size: 18px; font-weight: 600; border-bottom: 1px solid rgba(59, 130, 246, 0.2); padding-bottom: 10px;">Order Details</h3>
                    <table role="presentation" style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="padding: 8px 0; color: #94a3b8; font-size: 14px; width: 40%;">Order Number:</td>
                        <td style="padding: 8px 0; color: #e2e8f0; font-size: 14px; font-weight: 600;">#${orderNumber}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #94a3b8; font-size: 14px;">Product:</td>
                        <td style="padding: 8px 0; color: #e2e8f0; font-size: 14px; font-weight: 600;">${productName}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #94a3b8; font-size: 14px;">Quantity:</td>
                        <td style="padding: 8px 0; color: #e2e8f0; font-size: 14px; font-weight: 600;">${quantity}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #94a3b8; font-size: 14px;">Total Amount:</td>
                        <td style="padding: 8px 0; color: #fbbf24; font-size: 16px; font-weight: 700;">₹${total}</td>
                      </tr>
                      ${orderDate ? `
                      <tr>
                        <td style="padding: 8px 0; color: #94a3b8; font-size: 14px;">Order Date:</td>
                        <td style="padding: 8px 0; color: #e2e8f0; font-size: 14px;">${new Date(orderDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</td>
                      </tr>
                      ` : ''}
                      ${deliveredDate ? `
                      <tr>
                        <td style="padding: 8px 0; color: #94a3b8; font-size: 14px;">Delivered Date:</td>
                        <td style="padding: 8px 0; color: #10b981; font-size: 14px; font-weight: 600;">${new Date(deliveredDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</td>
                      </tr>
                      ` : ''}
                      <tr>
                        <td style="padding: 8px 0; color: #94a3b8; font-size: 14px;">Status:</td>
                        <td style="padding: 8px 0;">
                          <span style="display: inline-block; background: ${config.color}20; color: ${config.color}; padding: 6px 12px; border-radius: 8px; font-size: 13px; font-weight: 600; border: 1px solid ${config.color}40;">
                            ${status}
                          </span>
                        </td>
                      </tr>
                    </table>
                  </div>
                  <div style="text-align: center; margin: 40px 0 20px 0;">
                    <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/customer/orders" style="display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 600; font-size: 15px; box-shadow: 0 4px 15px rgba(37, 99, 235, 0.4);">
                      View Order Details
                    </a>
                  </div>
                </td>
              </tr>
              <tr>
                <td style="padding: 30px; text-align: center; border-top: 1px solid rgba(59, 130, 246, 0.2); background: rgba(15, 23, 42, 0.5);">
                  <p style="color: #64748b; margin: 0 0 10px 0; font-size: 12px;">© ${new Date().getFullYear()} QuickShop. All rights reserved.</p>
                  <p style="color: #475569; margin: 0; font-size: 11px;">This is an automated email, please do not reply.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

export async function sendOrderStatusEmail(customerEmail, orderDetails) {
  const transporter = createTransporter();

  if (!transporter) {
    console.log("📧 EMAIL NOT CONFIGURED - Order status update:");
    console.log("📧 To:", customerEmail);
    console.log("📧 Order:", orderDetails.orderNumber, "- Status:", orderDetails.status);
    return;
  }

  try {
    const emailUser = process.env.EMAIL_USER || process.env.GMAIL_USER;
    const senderName = process.env.EMAIL_SENDER_NAME || "QuickShop";
    const senderEmail = process.env.EMAIL_SENDER_EMAIL && process.env.EMAIL_SENDER_EMAIL !== emailUser
      ? process.env.EMAIL_SENDER_EMAIL
      : emailUser;
    const replyTo = process.env.EMAIL_REPLY_TO || senderEmail;

    const statusEmojis = {
      "Confirmed": "🎉",
      "Dispatched": "🚚",
      "Delivered": "🎊"
    };

    const mailOptions = {
      from: `"${senderName}" <${senderEmail}>`,
      replyTo: replyTo,
      to: customerEmail,
      subject: `${statusEmojis[orderDetails.status] || "📦"} Order #${orderDetails.orderNumber} - ${orderDetails.status} | QuickShop`,
      html: createOrderStatusEmailTemplate(orderDetails),
      text: `Your order #${orderDetails.orderNumber} (${orderDetails.productName}) has been updated to ${orderDetails.status}. Total: ₹${orderDetails.total}`
    };

    await transporter.sendMail(mailOptions);
    console.log("✅ Order status email sent successfully to:", customerEmail);
  } catch (emailError) {
    console.error("❌ Error sending order status email:", emailError);
  }
}

// OTP Email Template
function createOTPEmailTemplate(otp) {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Email Verification - QuickShop</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%);">
      <table role="presentation" style="width: 100%; border-collapse: collapse; background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%); padding: 40px 20px;">
        <tr>
          <td align="center">
            <table role="presentation" style="max-width: 600px; width: 100%; background: rgba(0, 0, 0, 0.8); border-radius: 20px; overflow: hidden; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5); border: 1px solid rgba(59, 130, 246, 0.3);">
              <tr>
                <td style="background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%); padding: 40px 30px; text-align: center;">
                  <div style="display: inline-block; background: rgba(255, 255, 255, 0.2); backdrop-filter: blur(10px); padding: 12px 20px; border-radius: 12px; margin-bottom: 20px;">
                    <span style="color: white; font-size: 28px; font-weight: bold; letter-spacing: 2px;">QS</span>
                  </div>
                  <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 700; text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);">QuickShop</h1>
                  <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 16px;">Email Verification</p>
                </td>
              </tr>
              <tr>
                <td style="padding: 50px 30px; text-align: center;">
                  <h2 style="color: #e2e8f0; margin: 0 0 20px 0; font-size: 24px; font-weight: 600;">Verify Your Email Address</h2>
                  <p style="color: #94a3b8; margin: 0 0 40px 0; font-size: 16px; line-height: 1.6;">
                    Thank you for signing up! Please use the verification code below to complete your registration.
                  </p>
                  <div style="background: linear-gradient(135deg, rgba(37, 99, 235, 0.2) 0%, rgba(59, 130, 246, 0.2) 100%); border: 2px solid rgba(59, 130, 246, 0.4); border-radius: 16px; padding: 30px; margin: 30px 0; backdrop-filter: blur(10px);">
                    <p style="color: #cbd5e1; margin: 0 0 15px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Your Verification Code</p>
                    <div style="display: inline-block; background: rgba(0, 0, 0, 0.4); padding: 20px 40px; border-radius: 12px; border: 1px solid rgba(59, 130, 246, 0.3);">
                      <span style="color: #60a5fa; font-size: 42px; font-weight: 700; letter-spacing: 8px; font-family: 'Courier New', monospace; text-shadow: 0 0 20px rgba(96, 165, 250, 0.5);">${otp}</span>
                    </div>
                    <p style="color: #64748b; margin: 20px 0 0 0; font-size: 13px;">This code will expire in 10 minutes</p>
                  </div>
                  <p style="color: #94a3b8; margin: 40px 0 0 0; font-size: 14px; line-height: 1.6;">
                    If you didn't request this code, you can safely ignore this email.
                  </p>
                </td>
              </tr>
              <tr>
                <td style="padding: 30px; text-align: center; border-top: 1px solid rgba(59, 130, 246, 0.2); background: rgba(15, 23, 42, 0.5);">
                  <p style="color: #64748b; margin: 0 0 10px 0; font-size: 12px;">© ${new Date().getFullYear()} QuickShop. All rights reserved.</p>
                  <p style="color: #475569; margin: 0; font-size: 11px;">This is an automated email, please do not reply.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

// Send OTP endpoint
app.post("/api/auth/send-otp", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const otp = generateOTP();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    otpStore.set(email, { otp, expiresAt });

    const transporter = createTransporter();

    if (!transporter) {
      console.log("📧 ========================================");
      console.log("📧 EMAIL NOT CONFIGURED - OTP for testing:");
      console.log("📧 To:", email);
      console.log("📧 OTP Code:", otp);
      console.log("📧 ========================================");

      res.json({
        success: true,
        message: "OTP generated (email not configured, check console)",
        otp: otp
      });
      return;
    }

    try {
      const emailUser = process.env.EMAIL_USER || process.env.GMAIL_USER;
      const senderName = process.env.EMAIL_SENDER_NAME || "QuickShop";
      const senderEmail = process.env.EMAIL_SENDER_EMAIL && process.env.EMAIL_SENDER_EMAIL !== emailUser
        ? process.env.EMAIL_SENDER_EMAIL
        : emailUser;
      const replyTo = process.env.EMAIL_REPLY_TO || senderEmail;

      const mailOptions = {
        from: `"${senderName}" <${senderEmail}>`,
        replyTo: replyTo,
        to: email,
        subject: "🔐 Verify Your Email - QuickShop",
        html: createOTPEmailTemplate(otp),
        text: `Your QuickShop verification code is: ${otp}. This code will expire in 10 minutes.`
      };

      await transporter.sendMail(mailOptions);
      console.log("✅ Email sent successfully to:", email);

      res.json({
        success: true,
        message: "OTP sent to your email",
        otp: process.env.NODE_ENV === "development" ? otp : undefined
      });
    } catch (emailError) {
      console.error("❌ Error sending email:", emailError);

      res.json({
        success: true,
        message: "OTP generated (email service unavailable, check console)",
        otp: otp
      });
    }

  } catch (err) {
    console.error("❌ Error sending OTP:", err);
    res.status(500).json({ error: "Failed to send OTP" });
  }
});

// Verify OTP endpoint
app.post("/api/auth/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: "Email and OTP are required" });
    }

    const stored = otpStore.get(email);

    if (!stored) {
      return res.status(400).json({ error: "OTP not found or expired. Please request a new OTP." });
    }

    if (Date.now() > stored.expiresAt) {
      otpStore.delete(email);
      return res.status(400).json({ error: "OTP has expired. Please request a new OTP." });
    }

    if (stored.otp !== otp) {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    otpStore.delete(email);

    // Update user's email_verified status in database if user exists
    try {
      await User.updateOne({ email }, { email_verified: true });
    } catch (dbErr) {
      console.log("Note: User not found for email verification update (may be during signup)");
    }

    res.json({
      success: true,
      message: "Email verified successfully"
    });

  } catch (err) {
    console.error("❌ Error verifying OTP:", err);
    res.status(500).json({ error: "Failed to verify OTP" });
  }
});

// ----------------------------------------------------------------------
// UPDATE USER PROFILE
// ----------------------------------------------------------------------
app.put("/api/user/profile", authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { username, phone, email, password, addressLine1, addressLine2, city, pincode, state } = req.body;

    if (!uid) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const currentUser = await User.findOne({ uid });

    if (!currentUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // Build update object
    const updateObj = {};

    if (username) updateObj.username = username;
    if (phone) {
      if (phone.length > 20) {
        return res.status(400).json({ error: "Phone number is too long. Maximum 20 characters allowed." });
      }
      updateObj.phone_no = phone;
    }
    if (email) updateObj.email = email;
    if (password) {
      updateObj.password = await bcrypt.hash(password, 10);
    }

    // Update user if there are fields to update
    if (Object.keys(updateObj).length > 0) {
      await User.updateOne({ uid }, updateObj);
    }

    // Handle address update (only for non-delivery users)
    if (currentUser.role !== "delivery" && (addressLine1 !== undefined || city !== undefined || pincode !== undefined || state !== undefined)) {
      const existingAddress = await UserAddress.findOne({ uid });

      if (existingAddress) {
        const addressUpdate = {};
        if (addressLine1 !== undefined) addressUpdate.address_line1 = addressLine1;
        if (addressLine2 !== undefined) addressUpdate.address_line2 = addressLine2 || null;
        if (city !== undefined) addressUpdate.city = city;
        if (pincode !== undefined) addressUpdate.pincode = pincode;
        if (state !== undefined) addressUpdate.state = state;

        if (Object.keys(addressUpdate).length > 0) {
          await UserAddress.updateOne({ uid }, addressUpdate);
        }
      } else if (addressLine1 && city && pincode && state) {
        const newAddress = new UserAddress({
          uid,
          address_line1: addressLine1,
          address_line2: addressLine2 || null,
          city,
          pincode,
          state
        });
        await newAddress.save();
      }
    }

    // Fetch updated user data
    const updatedUser = await User.findOne({ uid });

    // Fetch updated address
    let addressObj = null;
    if (updatedUser.role !== "delivery") {
      const address = await UserAddress.findOne({ uid });
      if (address) {
        addressObj = {
          addressLine1: address.address_line1,
          addressLine2: address.address_line2,
          city: address.city,
          pincode: address.pincode,
          state: address.state
        };
      }
    }

    res.json({
      success: true,
      message: "Profile updated successfully",
      user: {
        uid: updatedUser.uid,
        name: updatedUser.username,
        email: updatedUser.email,
        role: updatedUser.role,
        phone: updatedUser.phone_no,
        address: addressObj
      }
    });

  } catch (err) {
    console.error("❌ Error updating profile:", err);
    res.status(500).json({ error: "Database error" });
  }
});

/* --- Retailer confirms delivery --- */
app.post("/api/retailer/orders/:order_id/confirm-delivery", authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { order_id } = req.params;

    // Verify the order belongs to this retailer
    const order = await RetailerOrder.findOne({ _id: order_id, retailer_uid: uid });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    if (order.status !== "Delivered") {
      return res.status(400).json({ error: "Order must be delivered before confirmation" });
    }

    // Update delivery_confirmed
    await RetailerOrder.updateOne({ _id: order_id }, { delivery_confirmed: true });

    res.json({ success: true, message: "Delivery confirmed successfully" });
  } catch (err) {
    console.error("❌ Error confirming delivery:", err);
    res.status(500).json({ error: "Error confirming delivery" });
  }
});

// ----------------------------------------------------------------------
app.use((req, res) => res.status(404).json({ error: "Route not found" }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => { });
console.log(`Server running on port ${PORT}`);
