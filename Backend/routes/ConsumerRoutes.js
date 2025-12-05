// Consumer routes
import express from "express";
import { authenticateToken } from "../server.js";
import {
  User,
  UserAddress,
  CustomerOrder,
  CustomerQuery,
  RetailerInventory
} from "../models/index.js";

const router = express.Router();

/* ============================================================
   GET PRODUCTS FROM ALL RETAILERS
=============================================================== */
router.get("/retailer-products", async (req, res) => {
  try {
    // Get all products from retailer inventory
    const products = await RetailerInventory.find();

    // Enrich with retailer address and calculate average ratings
    const enrichedProducts = await Promise.all(products.map(async (product) => {
      // Get retailer address
      const address = await UserAddress.findOne({ uid: product.uid });

      // Calculate average rating from customer orders
      const ratingAggregation = await CustomerOrder.aggregate([
        {
          $match: {
            product_id: product.product_id,
            retailer_uid: product.uid,
            rating: { $ne: null }
          }
        },
        {
          $group: {
            _id: null,
            avg_rating: { $avg: "$rating" },
            review_count: { $sum: 1 }
          }
        }
      ]);

      const ratingData = ratingAggregation[0] || { avg_rating: 0, review_count: 0 };

      return {
        ...product.toObject(),
        address_line1: address?.address_line1 || null,
        address_line2: address?.address_line2 || null,
        city: address?.city || null,
        pincode: address?.pincode || null,
        state: address?.state || null,
        avg_rating: ratingData.avg_rating || 0,
        review_count: ratingData.review_count || 0
      };
    }));

    console.log(enrichedProducts);
    res.json(enrichedProducts);
  } catch (err) {
    console.error("❌ Error fetching retailer products:", err);
    res.status(500).json({ message: "Error fetching products" });
  }
});

// Get all reviews for a specific product
router.get("/product-reviews/:retailer_uid/:product_id", async (req, res) => {
  try {
    const { retailer_uid, product_id } = req.params;

    const orders = await CustomerOrder.find({
      retailer_uid,
      product_id,
      rating: { $ne: null }
    }).sort({ createdAt: -1 });

    // Enrich with customer names
    const reviews = await Promise.all(orders.map(async (order) => {
      const customer = await User.findOne({ uid: order.customer_uid });

      return {
        rating: order.rating,
        feedback: order.feedback,
        order_id: order._id,
        customer_name: customer?.username || "Unknown",
        product_quantity: order.product_quantity,
        status: order.status,
        s_no: order._id
      };
    }));

    res.json(reviews);
  } catch (err) {
    console.error("❌ Error fetching product reviews:", err);
    res.status(500).json({ message: "Error fetching reviews" });
  }
});

// Submit feedback for an order
router.post("/orders/feedback", async (req, res) => {
  try {
    const { s_no, rating, feedback } = req.body;
    const { uid } = req.user;
    console.log("📝 Feedback submission:", { s_no, rating, feedback, uid });

    if (!s_no || !rating) {
      return res.status(400).json({ success: false, message: "s_no and rating are required" });
    }

    // Update the customer_orders with rating and feedback
    await CustomerOrder.updateOne(
      { _id: s_no, customer_uid: uid },
      { rating, feedback: feedback || "" }
    );

    res.json({ success: true, message: "Feedback submitted successfully" });

  } catch (err) {
    console.error("❌ Error saving feedback:", err);
    res.status(500).json({ success: false, message: "Error saving feedback" });
  }
});

/* --- Place order --- */
router.post("/orders", async (req, res) => {
  const { items } = req.body;
  const { uid } = req.user;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      message: "No items in order. Please add items to cart before placing order."
    });
  }

  try {
    let ordersCreated = 0;
    const errors = [];

    for (const item of items) {
      const productId = item.id || item.product_id;

      if (!productId) {
        console.error("❌ Missing product_id in item:", item);
        errors.push(`Missing product ID for item: ${item.title || 'Unknown'}`);
        continue;
      }

      // Look up the retailer_uid from the retailer_inventory
      const product = await RetailerInventory.findOne({ product_id: productId });

      if (!product) {
        console.error(`❌ Product ${productId} not found in retailer_inventory`);
        errors.push(`Product ${item.title || productId} not found`);
        continue;
      }

      const retailerUid = product.uid;

      if (!retailerUid) {
        console.error(`❌ No retailer_uid found for product ${productId}`);
        errors.push(`No retailer found for product ${item.title || productId}`);
        continue;
      }

      const quantity = item.qty || 1;

      // Check current stock before placing order
      if (product.product_stock < quantity) {
        errors.push(`Insufficient stock for ${item.title || productId}. Available: ${product.product_stock}, Requested: ${quantity}`);
        continue;
      }

      // Create the order
      const newOrder = new CustomerOrder({
        customer_uid: uid,
        retailer_uid: retailerUid,
        product_id: productId,
        product_quantity: quantity,
        status: "Placed"
      });
      await newOrder.save();

      // Decrease stock in retailer_inventory
      await RetailerInventory.updateOne(
        { product_id: productId, uid: retailerUid },
        { $inc: { product_stock: -quantity } }
      );

      ordersCreated++;
      console.log(`✅ Order created for product ${productId}, quantity ${quantity}`);
    }

    if (ordersCreated === 0) {
      return res.status(400).json({
        message: "Failed to create any orders.",
        errors: errors
      });
    }

    if (errors.length > 0) {
      return res.status(207).json({
        success: true,
        message: `Order placed successfully for ${ordersCreated} item(s). Some items could not be ordered.`,
        ordersCreated,
        errors
      });
    }

    res.json({ success: true, message: "Order placed successfully", ordersCreated });

  } catch (err) {
    console.error("❌ Error placing order:", err);
    res.status(500).json({ message: "Order failed", error: err.message });
  }
});

/* --- Get customer orders --- */
router.get("/orders", async (req, res) => {
  const { uid } = req.user;

  try {
    const orders = await CustomerOrder.find({ customer_uid: uid }).sort({ createdAt: -1 });

    // Enrich with product and retailer details
    const enrichedOrders = await Promise.all(orders.map(async (order) => {
      const product = await RetailerInventory.findOne({
        product_id: order.product_id,
        uid: order.retailer_uid
      });
      const retailer = await User.findOne({ uid: order.retailer_uid });

      return {
        s_no: order._id,
        customer_uid: order.customer_uid,
        retailer_uid: order.retailer_uid,
        product_id: order.product_id,
        product_quantity: order.product_quantity,
        product_price: product?.product_price || 0,
        status: order.status,
        rating: order.rating,
        feedback: order.feedback,
        order_date: order.order_date || order.createdAt,
        delivered_date: order.delivered_date,
        delivery_confirmed: order.delivery_confirmed || false,
        retailer_name: retailer?.username || "Unknown",
        product_name: product?.product_name || "Unknown Product",
        product_category: product?.product_category || "General",
        product_image: product?.image || "",
        total: (product?.product_price || 0) * (order.product_quantity || 0)
      };
    }));

    res.json(enrichedOrders);
  } catch (err) {
    console.error("❌ Error loading orders:", err);
    res.status(500).json({ message: "Error loading orders", error: err.message });
  }
});

/* --- Create a query for a delivered order --- */
router.post("/queries", async (req, res) => {
  try {
    const { uid } = req.user;
    const { order_id, message } = req.body;

    if (!order_id || !message || !message.trim()) {
      return res.status(400).json({ success: false, message: "Order ID and message are required" });
    }

    // Verify the order belongs to the customer and is delivered
    const order = await CustomerOrder.findOne({ _id: order_id, customer_uid: uid });

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (order.status !== "Delivered") {
      return res.status(400).json({ success: false, message: "Queries can only be raised for delivered orders" });
    }

    // Create the query
    const newQuery = new CustomerQuery({
      order_id,
      customer_uid: uid,
      retailer_uid: order.retailer_uid,
      product_id: order.product_id,
      message: message.trim(),
      sender_role: "customer"
    });
    await newQuery.save();

    res.json({ success: true, query: newQuery });
  } catch (err) {
    console.error("❌ Error creating query:", err);
    res.status(500).json({ success: false, message: "Error creating query" });
  }
});

/* --- Get queries for an order --- */
router.get("/queries/:order_id", async (req, res) => {
  try {
    const { uid } = req.user;
    const { order_id } = req.params;

    // Verify the order belongs to the customer
    const order = await CustomerOrder.findOne({ _id: order_id, customer_uid: uid });

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

/* --- Mark query as resolved --- */
router.put("/queries/:order_id/resolve", async (req, res) => {
  try {
    const { uid } = req.user;
    const { order_id } = req.params;

    // Verify the order belongs to the customer
    const order = await CustomerOrder.findOne({ _id: order_id, customer_uid: uid });

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // Mark all queries for this order as resolved
    await CustomerQuery.updateMany({ order_id }, { is_resolved: true });

    res.json({ success: true, message: "Query marked as resolved" });
  } catch (err) {
    console.error("❌ Error resolving query:", err);
    res.status(500).json({ success: false, message: "Error resolving query" });
  }
});

/* --- Get customer dashboard metrics --- */
router.get("/metrics", async (req, res) => {
  const { uid } = req.user;

  try {
    // Total products available
    const totalProducts = await RetailerInventory.countDocuments({ product_stock: { $gt: 0 } });

    // Active orders count
    const activeOrders = await CustomerOrder.countDocuments({
      customer_uid: uid,
      status: { $in: ['Placed', 'Confirmed', 'Dispatched'] }
    });

    // Total spent (all delivered orders)
    const deliveredOrders = await CustomerOrder.find({
      customer_uid: uid,
      status: 'Delivered'
    });

    let spent7d = 0;
    for (const order of deliveredOrders) {
      const product = await RetailerInventory.findOne({
        product_id: order.product_id,
        uid: order.retailer_uid
      });
      if (product) {
        spent7d += (product.product_price || 0) * (order.product_quantity || 0);
      }
    }

    res.json({
      totalProducts,
      activeOrders,
      spent7d: Math.round(spent7d * 100) / 100
    });
  } catch (err) {
    console.error("❌ Error fetching customer metrics:", err);
    res.status(500).json({ message: "Error fetching metrics" });
  }
});

/* --- Customer confirms delivery --- */
router.post("/orders/:order_id/confirm-delivery", authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { order_id } = req.params;

    // Verify the order belongs to this customer
    const order = await CustomerOrder.findOne({ _id: order_id, customer_uid: uid });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    if (order.status !== "Delivered") {
      return res.status(400).json({ error: "Order must be delivered before confirmation" });
    }

    // Update delivery_confirmed
    await CustomerOrder.updateOne({ _id: order_id }, { delivery_confirmed: true });

    res.json({ success: true, message: "Delivery confirmed successfully" });
  } catch (err) {
    console.error("❌ Error confirming delivery:", err);
    res.status(500).json({ error: "Error confirming delivery" });
  }
});

export default router;
