// Wholesaler routes
import express from "express";
import { authenticateToken, sendOrderStatusEmail } from "../server.js";
import {
  User,
  RetailerOrder,
  WholesalerInventory
} from "../models/index.js";

const router = express.Router();

// ------------------------------
// GET all stock items for current wholesaler
// If retailer, return all products from all wholesalers
// If wholesaler, return only their own products
// ------------------------------
router.get("/stock", authenticateToken, async (req, res) => {
  try {
    const { uid, role } = req.user;

    let products;
    if (role === "retailer") {
      // Retailers should see all products from all wholesalers
      products = await WholesalerInventory.find().sort({ createdAt: 1 });
    } else {
      // Wholesalers see only their own products
      products = await WholesalerInventory.find({ uid }).sort({ createdAt: 1 });
    }

    res.json(products);
  } catch (err) {
    console.error("❌ Error fetching wholesaler inventory:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// ------------------------------
// ADD new inventory item
// ------------------------------
router.post("/stock", authenticateToken, async (req, res) => {
  try {
    if (!req.user) {
      console.error("❌ req.user is undefined");
      return res.status(401).json({ error: "Unauthorized: User not authenticated" });
    }

    if (!req.user.uid) {
      console.error("❌ req.user.uid is missing. req.user:", JSON.stringify(req.user));
      return res.status(401).json({ error: "Unauthorized: User ID not found in token" });
    }

    const { uid } = req.user;
    const { product_id, product_name, product_price, product_stock, product_category, product_image } = req.body;

    if (!product_id || !product_name) {
      return res.status(400).json({ error: "product_id and product_name are required" });
    }

    // Check if product already exists
    const existing = await WholesalerInventory.findOne({ uid, product_id });

    if (existing) {
      return res.status(400).json({ error: "Product with this ID already exists. Use PUT to update." });
    }

    // CREATE new product
    const newProduct = new WholesalerInventory({
      uid,
      product_id,
      product_name,
      product_price: product_price || 0,
      product_stock: product_stock || 0,
      product_category: product_category || 'General',
      image: product_image || ""
    });
    await newProduct.save();

    res.json({ message: "Inventory added successfully" });
  } catch (err) {
    console.error("❌ Error saving inventory:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// ------------------------------
// UPDATE stock item (PUT route)
// ------------------------------
router.put("/stock/:product_id", authenticateToken, async (req, res) => {
  try {
    if (!req.user || !req.user.uid) {
      return res.status(401).json({ error: "Unauthorized: User ID not found" });
    }

    const { uid } = req.user;
    const { product_id } = req.params;
    const { product_name, product_price, product_stock, product_category, product_image } = req.body;

    if (!product_name) {
      return res.status(400).json({ error: "product_name is required" });
    }

    await WholesalerInventory.updateOne(
      { uid, product_id },
      {
        product_name,
        product_price: product_price || 0,
        product_stock: product_stock || 0,
        product_category: product_category || 'General',
        image: product_image || ""
      }
    );

    res.json({ message: "Inventory updated successfully" });
  } catch (err) {
    console.error("❌ Error updating inventory:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// ------------------------------
// DELETE stock item
// ------------------------------
router.delete("/stock/:product_id", authenticateToken, async (req, res) => {
  try {
    if (!req.user || !req.user.uid) {
      return res.status(401).json({ error: "Unauthorized: User ID not found" });
    }

    const { uid } = req.user;
    const { product_id } = req.params;

    const result = await WholesalerInventory.deleteOne({ uid, product_id });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Item not found" });
    }

    res.json({ message: "Stock deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting stock:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// ------------------------------
// GET all retailer orders for this wholesaler
// ------------------------------
router.get("/orders", authenticateToken, async (req, res) => {
  try {
    if (!req.user || !req.user.uid) {
      return res.status(401).json({ error: "Unauthorized: User ID not found" });
    }

    const { uid } = req.user;

    const orders = await RetailerOrder.find({ wholesaler_uid: uid }).sort({ createdAt: -1 });

    // Enrich with product and retailer details
    const enrichedOrders = await Promise.all(orders.map(async (order) => {
      const product = await WholesalerInventory.findOne({
        product_id: order.product_id,
        uid: order.wholesaler_uid
      });
      const retailer = await User.findOne({ uid: order.retailer_uid });

      return {
        s_no: order._id,
        retailer_uid: order.retailer_uid,
        wholesaler_uid: order.wholesaler_uid,
        product_id: order.product_id,
        product_quantity: order.product_quantity,
        status: order.status,
        order_date: order.order_date || order.createdAt,
        delivered_date: order.delivered_date,
        product_name: product?.product_name || "Unknown Product",
        product_price: product?.product_price || 0,
        product_category: product?.product_category || "General",
        product_image: product?.image || "",
        retailer_name: retailer?.username || "Unknown",
        total: (order.product_quantity || 0) * (product?.product_price || 0)
      };
    }));

    res.json(enrichedOrders);
  } catch (err) {
    console.error("❌ Error fetching retailer orders:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// ------------------------------
// Get available delivery drivers
// ------------------------------
router.get("/delivery-drivers", authenticateToken, async (req, res) => {
  try {
    const drivers = await User.find({ role: 'delivery' })
      .select('uid username email phone_no')
      .sort({ username: 1 });

    res.json(drivers);
  } catch (err) {
    console.error("Error fetching delivery drivers:", err);
    res.status(500).json({ error: "Failed to fetch delivery drivers" });
  }
});

// ------------------------------
// UPDATE order status
// ------------------------------
router.put("/orders/:orderId/status", authenticateToken, async (req, res) => {
  const { orderId } = req.params;
  const { status, delivery_driver_uid } = req.body;

  try {
    if (!req.user || !req.user.uid) {
      return res.status(401).json({ error: "Unauthorized: User ID not found" });
    }

    // Wholesaler cannot mark orders as "Delivered" - only delivery driver can
    if (status === "Delivered") {
      return res.status(403).json({ error: "Wholesalers cannot mark orders as delivered. Only delivery drivers can." });
    }

    const { uid } = req.user;

    // Check current order status
    const order = await RetailerOrder.findOne({ _id: orderId, wholesaler_uid: uid });

    if (!order) {
      return res.status(404).json({ error: "Order not found or not authorized" });
    }

    // Validate status progression
    const statusOrder = ["Placed", "Confirmed", "Dispatched", "Delivered"];
    const currentIndex = statusOrder.indexOf(order.status);
    const newIndex = statusOrder.indexOf(status);

    if (newIndex < currentIndex) {
      return res.status(400).json({ error: "Cannot move status backwards" });
    }

    // If dispatching, require delivery driver selection
    if (status === "Dispatched" && !delivery_driver_uid) {
      return res.status(400).json({ error: "Please select a delivery driver when dispatching" });
    }

    // Fetch order details for email notification
    const product = await WholesalerInventory.findOne({
      product_id: order.product_id,
      uid: order.wholesaler_uid
    });
    const retailer = await User.findOne({ uid: order.retailer_uid });

    // Update order status
    const updateObj = { status };
    if (status === "Dispatched" && delivery_driver_uid) {
      updateObj.delivery_driver_uid = delivery_driver_uid;
    }

    await RetailerOrder.updateOne({ _id: orderId }, updateObj);

    // Get updated orders list
    const updatedOrders = await RetailerOrder.find({ wholesaler_uid: uid }).sort({ createdAt: -1 });

    const enrichedOrders = await Promise.all(updatedOrders.map(async (o) => {
      const prod = await WholesalerInventory.findOne({
        product_id: o.product_id,
        uid: o.wholesaler_uid
      });
      const ret = await User.findOne({ uid: o.retailer_uid });

      return {
        s_no: o._id,
        retailer_uid: o.retailer_uid,
        wholesaler_uid: o.wholesaler_uid,
        product_id: o.product_id,
        product_quantity: o.product_quantity,
        status: o.status,
        order_date: o.order_date || o.createdAt,
        delivered_date: o.delivered_date,
        product_name: prod?.product_name || "Unknown Product",
        product_price: prod?.product_price || 0,
        product_category: prod?.product_category || "General",
        product_image: prod?.image || "",
        retailer_name: ret?.username || "Unknown",
        total: (o.product_quantity || 0) * (prod?.product_price || 0)
      };
    }));

    res.json({ message: "Status updated successfully", result: enrichedOrders });

    // Send email notification to retailer in background
    if ((status === "Confirmed" || status === "Dispatched") && retailer?.email) {
      const total = (order.product_quantity || 0) * (product?.product_price || 0);
      sendOrderStatusEmail(retailer.email, {
        orderNumber: order._id,
        productName: product?.product_name || "Product",
        status: status,
        quantity: order.product_quantity || 1,
        total: total,
        orderDate: order.order_date || order.createdAt,
        deliveredDate: order.delivered_date
      }).catch(err => {
        console.error("❌ Error sending email (non-blocking):", err);
      });
    }
  } catch (err) {
    console.error("❌ Error updating order status:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// ------------------------------
// GET wholesaler dashboard metrics
// ------------------------------
router.get("/metrics", authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;

    // Total products
    const totalProducts = await WholesalerInventory.countDocuments({ uid });

    // Pending retailer orders
    const pendingOrders = await RetailerOrder.countDocuments({
      wholesaler_uid: uid,
      status: { $in: ['Placed', 'Confirmed', 'Dispatched'] }
    });

    // Revenue from retailer orders (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const deliveredOrders = await RetailerOrder.find({
      wholesaler_uid: uid,
      status: 'Delivered',
      delivered_date: { $gte: sevenDaysAgo }
    });

    let revenue7d = 0;
    for (const order of deliveredOrders) {
      const product = await WholesalerInventory.findOne({
        product_id: order.product_id,
        uid: order.wholesaler_uid
      });
      if (product) {
        revenue7d += (product.product_price || 0) * (order.product_quantity || 0);
      }
    }

    res.json({
      totalProducts,
      pendingOrders,
      revenue7d: Math.round(revenue7d * 100) / 100
    });
  } catch (err) {
    console.error("❌ Error fetching wholesaler metrics:", err);
    res.status(500).json({ error: "Database error" });
  }
});

export default router;
