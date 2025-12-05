import express from "express";
import { authenticateToken, sendOrderStatusEmail, createTransporter } from "../server.js";
import {
  User,
  UserAddress,
  CustomerOrder,
  RetailerOrder,
  RetailerInventory,
  WholesalerInventory
} from "../models/index.js";

const router = express.Router();

// Store delivery OTPs: order_id -> { otp, expiresAt, recipient_email, order_type }
const deliveryOtpStore = new Map();

// Generate 6-digit OTP
function generateDeliveryOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Create delivery OTP email template
function createDeliveryOTPEmailTemplate(otp, orderNumber) {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Delivery Confirmation OTP - QuickShop</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%);">
      <table role="presentation" style="width: 100%; border-collapse: collapse; background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%); padding: 40px 20px;">
        <tr>
          <td align="center">
            <table role="presentation" style="max-width: 600px; width: 100%; background: rgba(0, 0, 0, 0.8); border-radius: 20px; overflow: hidden; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5); border: 1px solid rgba(249, 115, 22, 0.3);">
              <tr>
                <td style="background: linear-gradient(135deg, #f97316 0%, #fb923c 100%); padding: 40px 30px; text-align: center;">
                  <div style="display: inline-block; background: rgba(255, 255, 255, 0.2); backdrop-filter: blur(10px); padding: 12px 20px; border-radius: 12px; margin-bottom: 20px;">
                    <span style="color: white; font-size: 28px; font-weight: bold; letter-spacing: 2px;">QS</span>
                  </div>
                  <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 700; text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);">QuickShop</h1>
                  <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 16px;">🚚 Delivery Confirmation</p>
                </td>
              </tr>
              <tr>
                <td style="padding: 50px 30px; text-align: center;">
                  <h2 style="color: #e2e8f0; margin: 0 0 20px 0; font-size: 24px; font-weight: 600;">Your Delivery Driver Has Arrived!</h2>
                  <p style="color: #94a3b8; margin: 0 0 40px 0; font-size: 16px; line-height: 1.6;">
                    Your delivery driver has reached your location for Order #${orderNumber}. Please provide the OTP below to confirm delivery.
                  </p>
                  <div style="background: linear-gradient(135deg, rgba(249, 115, 22, 0.2) 0%, rgba(251, 146, 60, 0.2) 100%); border: 2px solid rgba(249, 115, 22, 0.4); border-radius: 16px; padding: 30px; margin: 30px 0; backdrop-filter: blur(10px);">
                    <p style="color: #cbd5e1; margin: 0 0 15px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Your Delivery Confirmation Code</p>
                    <div style="display: inline-block; background: rgba(0, 0, 0, 0.4); padding: 20px 40px; border-radius: 12px; border: 1px solid rgba(249, 115, 22, 0.3);">
                      <span style="color: #fb923c; font-size: 42px; font-weight: 700; letter-spacing: 8px; font-family: 'Courier New', monospace; text-shadow: 0 0 20px rgba(251, 146, 60, 0.5);">${otp}</span>
                    </div>
                    <p style="color: #64748b; margin: 20px 0 0 0; font-size: 13px;">This code will expire in 10 minutes</p>
                  </div>
                  <div style="background: rgba(249, 115, 22, 0.1); border-left: 4px solid #f97316; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: left;">
                    <p style="color: #fdba74; margin: 0; font-size: 14px; line-height: 1.6;">
                      <strong>⚠️ Important:</strong> Only share this OTP with the delivery driver when they arrive at your location. Do not share it with anyone else.
                    </p>
                  </div>
                </td>
              </tr>
              <tr>
                <td style="padding: 30px; text-align: center; border-top: 1px solid rgba(249, 115, 22, 0.2); background: rgba(15, 23, 42, 0.5);">
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

// GET active delivery orders
router.get("/orders", authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;

    // Fetch customer orders (Dispatched)
    const customerOrders = await CustomerOrder.find({
      status: 'Dispatched',
      delivery_driver_uid: uid
    });

    // Fetch retailer orders (wholesaler to retailer) (Dispatched)
    const retailerOrders = await RetailerOrder.find({
      status: 'Dispatched',
      delivery_driver_uid: uid
    });

    // Enrich customer orders with address and names
    const enrichedCustomerOrders = await Promise.all(customerOrders.map(async (order) => {
      const address = await UserAddress.findOne({ uid: order.customer_uid });
      const customer = await User.findOne({ uid: order.customer_uid });
      const retailer = await User.findOne({ uid: order.retailer_uid });

      return {
        id: order._id,
        s_no: order._id,
        customer_uid: order.customer_uid,
        retailer_uid: order.retailer_uid,
        product_id: order.product_id,
        product_quantity: order.product_quantity,
        status: order.status,
        delivery_driver_uid: order.delivery_driver_uid,
        customer_name: customer?.username || "Unknown",
        retailer_name: retailer?.username || "Unknown",
        order_type: 'customer_order',
        address: address ? {
          addressLine1: address.address_line1,
          addressLine2: address.address_line2,
          city: address.city,
          pincode: address.pincode,
          state: address.state
        } : null
      };
    }));

    // Enrich retailer orders with address and names
    const enrichedRetailerOrders = await Promise.all(retailerOrders.map(async (order) => {
      const address = await UserAddress.findOne({ uid: order.retailer_uid });
      const retailer = await User.findOne({ uid: order.retailer_uid });
      const wholesaler = await User.findOne({ uid: order.wholesaler_uid });

      return {
        id: order._id,
        s_no: order._id,
        customer_uid: order.retailer_uid,
        retailer_uid: order.wholesaler_uid,
        product_id: order.product_id,
        product_quantity: order.product_quantity,
        status: order.status,
        delivery_driver_uid: order.delivery_driver_uid,
        customer_name: retailer?.username || "Unknown",
        retailer_name: wholesaler?.username || "Unknown",
        order_type: 'retailer_order',
        address: address ? {
          addressLine1: address.address_line1,
          addressLine2: address.address_line2,
          city: address.city,
          pincode: address.pincode,
          state: address.state
        } : null
      };
    }));

    const allOrders = [...enrichedCustomerOrders, ...enrichedRetailerOrders];

    res.json(allOrders);

  } catch (err) {
    console.error("Fetch delivery orders error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// Get past delivered orders for the delivery driver
router.get("/past-orders", authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;

    // Fetch past customer orders
    const customerOrders = await CustomerOrder.find({
      status: 'Delivered',
      delivery_driver_uid: uid
    }).sort({ delivered_date: -1 });

    // Fetch past retailer orders
    const retailerOrders = await RetailerOrder.find({
      status: 'Delivered',
      delivery_driver_uid: uid
    }).sort({ delivered_date: -1 });

    // Enrich customer orders
    const enrichedCustomerOrders = await Promise.all(customerOrders.map(async (order) => {
      const customer = await User.findOne({ uid: order.customer_uid });
      const retailer = await User.findOne({ uid: order.retailer_uid });
      const product = await RetailerInventory.findOne({
        product_id: order.product_id,
        uid: order.retailer_uid
      });

      return {
        id: order._id,
        s_no: order._id,
        customer_uid: order.customer_uid,
        retailer_uid: order.retailer_uid,
        product_id: order.product_id,
        product_quantity: order.product_quantity,
        status: order.status,
        delivery_driver_uid: order.delivery_driver_uid,
        delivered_date: order.delivered_date,
        customer_name: customer?.username || "Unknown",
        retailer_name: retailer?.username || "Unknown",
        product_name: product?.product_name || "Product",
        order_type: 'customer_order'
      };
    }));

    // Enrich retailer orders
    const enrichedRetailerOrders = await Promise.all(retailerOrders.map(async (order) => {
      const retailer = await User.findOne({ uid: order.retailer_uid });
      const wholesaler = await User.findOne({ uid: order.wholesaler_uid });
      const product = await WholesalerInventory.findOne({
        product_id: order.product_id,
        uid: order.wholesaler_uid
      });

      return {
        id: order._id,
        s_no: order._id,
        customer_uid: order.retailer_uid,
        retailer_uid: order.wholesaler_uid,
        product_id: order.product_id,
        product_quantity: order.product_quantity,
        status: order.status,
        delivery_driver_uid: order.delivery_driver_uid,
        delivered_date: order.delivered_date,
        customer_name: retailer?.username || "Unknown",
        retailer_name: wholesaler?.username || "Unknown",
        product_name: product?.product_name || "Product",
        order_type: 'retailer_order'
      };
    }));

    // Combine and sort by delivered_date
    const allOrders = [...enrichedCustomerOrders, ...enrichedRetailerOrders].sort((a, b) => {
      const dateA = a.delivered_date ? new Date(a.delivered_date) : new Date(0);
      const dateB = b.delivered_date ? new Date(b.delivered_date) : new Date(0);
      return dateB - dateA;
    });

    res.json(allOrders);

  } catch (err) {
    console.error("Fetch past orders error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// Update order status
router.put("/orders/status", authenticateToken, async (req, res) => {
  try {
    const { id, status, order_type } = req.body;
    const { uid } = req.user;

    const isRetailerOrder = order_type === 'retailer_order';

    // Verify the order is assigned to this delivery driver
    let order;
    if (isRetailerOrder) {
      order = await RetailerOrder.findById(id);
    } else {
      order = await CustomerOrder.findById(id);
    }

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Prevent direct status change to "Delivered" - must use OTP verification
    if (status === "Delivered") {
      return res.status(400).json({ error: "Cannot mark order as delivered directly. Please use OTP verification." });
    }

    if (order.delivery_driver_uid !== uid) {
      return res.status(403).json({ error: "This order is not assigned to you" });
    }

    // Update status
    if (isRetailerOrder) {
      await RetailerOrder.updateOne({ _id: id }, { status });
    } else {
      await CustomerOrder.updateOne({ _id: id }, { status });
    }

    res.json({ success: true, message: "Order status updated" });
  } catch (err) {
    console.error("Update order status error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// Generate and send delivery OTP
router.post("/orders/:orderId/request-otp", authenticateToken, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { order_type } = req.body;
    const { uid } = req.user;

    const isRetailerOrder = order_type === 'retailer_order';

    // Verify order exists and is assigned to this driver
    let order;
    let recipientEmail;
    let recipientName;

    if (isRetailerOrder) {
      order = await RetailerOrder.findOne({ _id: orderId, delivery_driver_uid: uid });
      if (order) {
        const retailer = await User.findOne({ uid: order.retailer_uid });
        recipientEmail = retailer?.email;
        recipientName = retailer?.username;
      }
    } else {
      order = await CustomerOrder.findOne({ _id: orderId, delivery_driver_uid: uid });
      if (order) {
        const customer = await User.findOne({ uid: order.customer_uid });
        recipientEmail = customer?.email;
        recipientName = customer?.username;
      }
    }

    if (!order) {
      return res.status(404).json({ error: "Order not found or not assigned to you" });
    }

    if (order.status !== "Dispatched") {
      return res.status(400).json({ error: "OTP can only be requested for Dispatched orders" });
    }

    // Generate OTP
    const otp = generateDeliveryOTP();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Store OTP
    const otpKey = `${orderId}_${order_type}`;
    deliveryOtpStore.set(otpKey, {
      otp,
      expiresAt,
      recipient_email: recipientEmail,
      order_type,
      order_id: orderId
    });

    // Send OTP email
    const transporter = createTransporter();
    if (!transporter) {
      console.log("📧 ========================================");
      console.log("📧 DELIVERY OTP (Email not configured):");
      console.log("📧 Order ID:", orderId);
      console.log("📧 Recipient:", recipientEmail);
      console.log("📧 OTP Code:", otp);
      console.log("📧 ========================================");

      return res.json({
        success: true,
        message: "OTP generated (email not configured, check console)",
        otp: otp
      });
    }

    try {
      const emailUser = process.env.EMAIL_USER || process.env.GMAIL_USER;
      const senderName = process.env.EMAIL_SENDER_NAME || "QuickShop";
      const senderEmail = process.env.EMAIL_SENDER_EMAIL && process.env.EMAIL_SENDER_EMAIL !== emailUser
        ? process.env.EMAIL_SENDER_EMAIL
        : emailUser;

      const mailOptions = {
        from: `"${senderName}" <${senderEmail}>`,
        to: recipientEmail,
        subject: `🚚 Delivery Confirmation OTP for Order #${orderId} | QuickShop`,
        html: createDeliveryOTPEmailTemplate(otp, orderId),
        text: `Your delivery driver has arrived! Please provide this OTP to confirm delivery: ${otp}`
      };

      await transporter.sendMail(mailOptions);
      console.log("✅ Delivery OTP email sent to:", recipientEmail);

      res.json({
        success: true,
        message: "OTP sent to recipient's email"
      });
    } catch (emailError) {
      console.error("❌ Error sending delivery OTP email:", emailError);
      res.json({
        success: true,
        message: "OTP generated but email failed (check console)",
        otp: otp
      });
    }
  } catch (err) {
    console.error("❌ Error requesting delivery OTP:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// Verify OTP and mark order as delivered
router.post("/orders/:orderId/verify-otp", authenticateToken, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { otp, order_type } = req.body;
    const { uid } = req.user;

    if (!otp) {
      return res.status(400).json({ error: "OTP is required" });
    }

    const isRetailerOrder = order_type === 'retailer_order';
    const otpKey = `${orderId}_${order_type}`;
    const storedOtp = deliveryOtpStore.get(otpKey);

    if (!storedOtp) {
      return res.status(400).json({ error: "OTP not found or expired. Please request a new OTP." });
    }

    if (Date.now() > storedOtp.expiresAt) {
      deliveryOtpStore.delete(otpKey);
      return res.status(400).json({ error: "OTP has expired. Please request a new OTP." });
    }

    if (storedOtp.otp !== otp) {
      return res.status(400).json({ error: "Invalid OTP. Please try again." });
    }

    // Verify order is assigned to this driver and status is "Dispatched"
    let order;
    let recipientEmail;
    let product;

    if (isRetailerOrder) {
      order = await RetailerOrder.findOne({ _id: orderId, delivery_driver_uid: uid });
      if (order) {
        const retailer = await User.findOne({ uid: order.retailer_uid });
        recipientEmail = retailer?.email;
        product = await WholesalerInventory.findOne({
          product_id: order.product_id,
          uid: order.wholesaler_uid
        });
      }
    } else {
      order = await CustomerOrder.findOne({ _id: orderId, delivery_driver_uid: uid });
      if (order) {
        const customer = await User.findOne({ uid: order.customer_uid });
        recipientEmail = customer?.email;
        product = await RetailerInventory.findOne({
          product_id: order.product_id,
          uid: order.retailer_uid
        });
      }
    }

    if (!order) {
      return res.status(404).json({ error: "Order not found or not assigned to you" });
    }

    if (order.status !== "Dispatched") {
      return res.status(400).json({ error: "Order status must be 'Dispatched' to verify OTP" });
    }

    // Mark order as delivered
    const deliveredDate = new Date();
    if (isRetailerOrder) {
      await RetailerOrder.updateOne(
        { _id: orderId },
        { status: 'Delivered', delivered_date: deliveredDate, delivery_confirmed: false }
      );
    } else {
      await CustomerOrder.updateOne(
        { _id: orderId },
        { status: 'Delivered', delivered_date: deliveredDate, delivery_confirmed: false }
      );
    }

    // Send delivery confirmation email
    if (recipientEmail) {
      const total = (order.product_quantity || 0) * (product?.product_price || 0);
      await sendOrderStatusEmail(recipientEmail, {
        orderNumber: order._id,
        productName: product?.product_name || "Product",
        status: "Delivered",
        quantity: order.product_quantity || 1,
        total: total,
        orderDate: order.order_date || order.createdAt,
        deliveredDate: deliveredDate
      });
    }

    // Delete OTP from store
    deliveryOtpStore.delete(otpKey);

    res.json({
      success: true,
      message: "OTP verified successfully. Order marked as delivered."
    });
  } catch (err) {
    console.error("❌ Error verifying delivery OTP:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// Get metrics for delivery driver
router.get("/metrics", authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;

    // Count active deliveries (Dispatched orders assigned to this driver)
    const activeCustomerOrders = await CustomerOrder.countDocuments({
      status: 'Dispatched',
      delivery_driver_uid: uid
    });

    const activeRetailerOrders = await RetailerOrder.countDocuments({
      status: 'Dispatched',
      delivery_driver_uid: uid
    });

    const activeDeliveries = activeCustomerOrders + activeRetailerOrders;

    // Count completed today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const completedCustomerToday = await CustomerOrder.countDocuments({
      status: 'Delivered',
      delivery_driver_uid: uid,
      delivered_date: { $gte: today }
    });

    const completedRetailerToday = await RetailerOrder.countDocuments({
      status: 'Delivered',
      delivery_driver_uid: uid,
      delivered_date: { $gte: today }
    });

    const completedToday = completedCustomerToday + completedRetailerToday;

    // Count total delivered
    const totalCustomerDelivered = await CustomerOrder.countDocuments({
      status: 'Delivered',
      delivery_driver_uid: uid
    });

    const totalRetailerDelivered = await RetailerOrder.countDocuments({
      status: 'Delivered',
      delivery_driver_uid: uid
    });

    const totalDelivered = totalCustomerDelivered + totalRetailerDelivered;

    res.json({
      activeDeliveries,
      completedToday,
      totalDelivered
    });
  } catch (err) {
    console.error("❌ Error fetching delivery metrics:", err);
    res.status(500).json({ error: "Error fetching metrics" });
  }
});

export default router;
