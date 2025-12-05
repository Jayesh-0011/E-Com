//Retailer Routes
import express from "express";
import { authenticateToken, sendOrderStatusEmail } from "../server.js";
import {
  User,
  CustomerOrder,
  RetailerOrder,
  CustomerQuery,
  RetailerInventory,
  WholesalerInventory
} from "../models/index.js";

const router = express.Router();

// DELETE inventory item
router.delete("/del/del", async (req, res) => {
  try {
    const { uid } = req.user;
    const { product_id } = req.body;

    if (!product_id) {
      return res.status(400).json({ error: "product_id is required" });
    }

    await RetailerInventory.deleteOne({ uid, product_id });

    res.json({ success: true, message: "Item deleted" });
  } catch (err) {
    console.error("❌ Delete error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET retailer inventory
router.get("/inventory/get", authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const inventory = await RetailerInventory.find({ uid });
    res.json(inventory);
  } catch (err) {
    console.error("❌ Error fetching inventory:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ADD or UPDATE inventory item
router.post("/inventory", authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;

    const {
      product_id,
      product_name,
      product_price,
      product_stock,
      product_category,
      image
    } = req.body;

    // Check if product already exists for this retailer
    const existing = await RetailerInventory.findOne({ uid, product_id });

    if (existing) {
      // Product exists → UPDATE it
      await RetailerInventory.updateOne(
        { uid, product_id },
        {
          product_name,
          product_price: product_price || 0,
          product_stock: product_stock || 0,
          product_category: product_category || 'General',
          image: image || ""
        }
      );

      return res.json({
        success: true,
        action: "updated",
        message: "Product updated successfully",
        data: { product_id, product_name, product_price, product_stock, product_category, image: image || "" }
      });
    }

    // Product does NOT exist → INSERT new
    const newProduct = new RetailerInventory({
      uid,
      product_id,
      product_name,
      product_price: product_price || 0,
      product_stock: product_stock || 0,
      product_category: product_category || 'General',
      image: image || ""
    });
    await newProduct.save();

    res.json({
      success: true,
      action: "inserted",
      message: "Product added successfully",
      data: { product_id, product_name, product_price, product_stock, product_category, image: image || "" }
    });

  } catch (err) {
    console.error("❌ Error saving inventory:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Add product to inventory from delivered wholesaler order
router.post("/orders/:order_id/add-to-inventory", authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user; // Retailer UID
    const { order_id } = req.params;
    const { retail_price } = req.body;

    if (!retail_price || Number(retail_price) <= 0) {
      return res.status(400).json({ error: "Valid retail price is required" });
    }

    // 1. Verify order belongs to this retailer and is delivered
    const order = await RetailerOrder.findOne({ _id: order_id, retailer_uid: uid });

    if (!order) {
      return res.status(404).json({ error: "Order not found or not authorized" });
    }

    if (order.status !== "Delivered") {
      return res.status(400).json({ error: "Order must be delivered before adding to inventory" });
    }

    // Get product details from wholesaler inventory
    const wholesalerProduct = await WholesalerInventory.findOne({
      product_id: order.product_id,
      uid: order.wholesaler_uid
    });

    // 2. Check if product already exists in retailer inventory
    const existingProduct = await RetailerInventory.findOne({ uid, product_id: order.product_id });

    if (existingProduct) {
      if (existingProduct.product_stock > 0) {
        return res.status(400).json({
          error: "Product already exists in inventory with stock. Please order more from wholesaler when stock runs out."
        });
      }

      // If stock = 0, update stock with new quantity
      await RetailerInventory.updateOne(
        { uid, product_id: order.product_id },
        {
          $inc: { product_stock: order.product_quantity },
          product_price: Math.round(Number(retail_price))
        }
      );

      return res.json({
        success: true,
        message: `Stock updated successfully. Added ${order.product_quantity} units.`,
        action: "updated"
      });
    }

    // 3. Product doesn't exist - create new entry
    const newProduct = new RetailerInventory({
      uid,
      product_id: order.product_id,
      product_name: wholesalerProduct?.product_name || "Product",
      product_price: Math.round(Number(retail_price)),
      product_stock: order.product_quantity,
      product_category: wholesalerProduct?.product_category || "General",
      image: wholesalerProduct?.image || ""
    });
    await newProduct.save();

    res.json({
      success: true,
      message: "Product added to inventory successfully",
      action: "inserted"
    });

  } catch (err) {
    console.error("❌ Error adding product to inventory:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET customer orders for this retailer
router.get("/customer-orders", authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;

    const orders = await CustomerOrder.find({ retailer_uid: uid }).sort({ createdAt: -1 });

    // Enrich with product and customer details
    const enrichedOrders = await Promise.all(orders.map(async (order) => {
      const product = await RetailerInventory.findOne({
        product_id: order.product_id,
        uid: order.retailer_uid
      });
      const customer = await User.findOne({ uid: order.customer_uid });

      return {
        s_no: order._id,
        customer_uid: order.customer_uid,
        retailer_uid: order.retailer_uid,
        product_id: order.product_id,
        product_quantity: order.product_quantity,
        product_price: product?.product_price || 0,
        status: order.status,
        delivery_driver_uid: order.delivery_driver_uid,
        order_date: order.order_date || order.createdAt,
        delivered_date: order.delivered_date,
        customer_name: customer?.username || "Unknown",
        product_name: product?.product_name || "Unknown Product",
        product_category: product?.product_category || "General",
        product_image: product?.image || "",
        total: (product?.product_price || 0) * (order.product_quantity || 0)
      };
    }));

    res.json(enrichedOrders);
  } catch (err) {
    console.error("❌ Error fetching customer orders:", err);
    res.status(500).json({ message: "Error fetching orders", error: err.message });
  }
});

// Get queries for a customer order
router.get("/queries/:order_id", authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user; // retailer uid
    const { order_id } = req.params;

    // Verify the order belongs to the retailer
    const order = await CustomerOrder.findOne({ _id: order_id, retailer_uid: uid });

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const queries = await CustomerQuery.find({ order_id }).sort({ created_at: 1 });

    res.json({ success: true, queries });
  } catch (err) {
    console.error("❌ Error fetching queries:", err);
    res.status(500).json({ success: false, message: "Error fetching queries" });
  }
});

// Reply to a customer query
router.post("/queries/:order_id/reply", authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user; // retailer uid
    const { order_id } = req.params;
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: "Message is required" });
    }

    // Verify the order belongs to the retailer
    const order = await CustomerOrder.findOne({ _id: order_id, retailer_uid: uid });

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // Create the reply
    const newQuery = new CustomerQuery({
      order_id,
      customer_uid: order.customer_uid,
      retailer_uid: uid,
      product_id: order.product_id,
      message: message.trim(),
      sender_role: "retailer"
    });
    await newQuery.save();

    res.json({ success: true, query: newQuery });
  } catch (err) {
    console.error("❌ Error replying to query:", err);
    res.status(500).json({ success: false, message: "Error replying to query" });
  }
});

// Get retailer dashboard metrics
router.get("/metrics", authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;

    // Total products in inventory
    const totalProducts = await RetailerInventory.countDocuments({
      uid,
      product_stock: { $gt: 0 }
    });

    // Pending wholesale orders
    const pendingWholesaleOrders = await RetailerOrder.countDocuments({
      retailer_uid: uid,
      status: { $in: ['Placed', 'Confirmed', 'Dispatched'] }
    });

    // Revenue from customer orders (all delivered orders)
    const deliveredOrders = await CustomerOrder.find({
      retailer_uid: uid,
      status: 'Delivered'
    });

    let revenue7d = 0;
    for (const order of deliveredOrders) {
      const product = await RetailerInventory.findOne({
        product_id: order.product_id,
        uid: order.retailer_uid
      });
      if (product) {
        revenue7d += (product.product_price || 0) * (order.product_quantity || 0);
      }
    }

    res.json({
      totalProducts,
      pendingWholesaleOrders,
      revenue7d: Math.round(revenue7d * 100) / 100
    });
  } catch (err) {
    console.error("❌ Error fetching retailer metrics:", err);
    res.status(500).json({ message: "Error fetching metrics" });
  }
});

// Get available delivery drivers
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

// Update customer order status
router.put("/put/put/put/update-status", authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { order_id, status, delivery_driver_uid } = req.body;

    if (!order_id || !status) {
      return res.status(400).json({ error: "order_id and status are required" });
    }

    // Retailer cannot mark orders as "Delivered" - only delivery driver can
    if (status === "Delivered") {
      return res.status(403).json({ error: "Retailers cannot mark orders as delivered. Only delivery drivers can." });
    }

    const order = await CustomerOrder.findById(order_id);

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    if (order.retailer_uid !== uid) {
      return res.status(403).json({ error: "Unauthorized" });
    }

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
    const product = await RetailerInventory.findOne({
      product_id: order.product_id,
      uid: order.retailer_uid
    });
    const customer = await User.findOne({ uid: order.customer_uid });

    // Update order status
    const updateObj = { status };
    if (status === "Dispatched" && delivery_driver_uid) {
      updateObj.delivery_driver_uid = delivery_driver_uid;
    }

    await CustomerOrder.updateOne({ _id: order_id }, updateObj);

    // Get updated orders
    const result = await CustomerOrder.find({ retailer_uid: uid });
    console.log(result);
    res.json({ result });

    // Send email notification to customer in background
    if (customer?.email) {
      const total = (order.product_quantity || 0) * (product?.product_price || 0);
      sendOrderStatusEmail(customer.email, {
        orderNumber: order._id,
        productName: product?.product_name || "Product",
        status: status,
        quantity: order.product_quantity || 1,
        total: total,
        orderDate: order.order_date || order.createdAt,
        deliveredDate: status === "Delivered" ? new Date() : order.delivered_date
      }).catch(err => {
        console.error("❌ Error sending email (non-blocking):", err);
      });
    }

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET retailer stock by UID
router.get("/stock/:uid", async (req, res) => {
  const { uid } = req.params;

  try {
    const inventory = await RetailerInventory.find({ uid })
      .select('_id uid product_id product_name product_price product_stock product_category');

    res.json(inventory);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching stock" });
  }
});

// UPDATE retailer stock
router.put("/stock/:s_no", async (req, res) => {
  const { s_no } = req.params;
  const { product_stock } = req.body;

  try {
    await RetailerInventory.updateOne({ _id: s_no }, { product_stock });
    res.json({ success: true });
  } catch (err) {
    console.error("❌ Error updating inventory:", err);
    res.status(500).json({ message: "Error updating stock" });
  }
});

// GET retailer customer orders by retailer_uid
router.get("/orders/:retailer_uid", async (req, res) => {
  const { retailer_uid } = req.params;

  try {
    const orders = await CustomerOrder.find({ retailer_uid }).sort({ createdAt: -1 });

    // Enrich with customer details
    const enrichedOrders = await Promise.all(orders.map(async (order) => {
      const customer = await User.findOne({ uid: order.customer_uid });

      return {
        s_no: order._id,
        customer_uid: order.customer_uid,
        retailer_uid: order.retailer_uid,
        product_id: order.product_id,
        product_quantity: order.product_quantity,
        status: order.status,
        customer_name: customer?.username || "Unknown"
      };
    }));

    res.json(enrichedOrders);

  } catch (err) {
    console.error("❌ Error fetching retailer customer orders:", err);
    res.status(500).json({ message: "Error fetching orders" });
  }
});

// UPDATE customer order status
router.put("/orders/:s_no/status", async (req, res) => {
  const { s_no } = req.params;
  const { status } = req.body;

  const allowed = ["Confirmed", "Dispatched", "Delivered"];
  if (!allowed.includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  try {
    await CustomerOrder.updateOne({ _id: s_no }, { status });
    res.json({ success: true });

  } catch (err) {
    console.error("❌ Error updating status:", err);
    res.status(500).json({ message: "Error updating status" });
  }
});

export default router;
