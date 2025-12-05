// src/App.jsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import HomePage from "./pages/HomePage";
import SignUp from "./pages/SignUp";
import Login from "./pages/Login";

import { AuthProvider } from "./context/AuthProvider";
import { ToastProvider } from "./context/ToastContext";
import PrivateRoute from "./Routes/PrivateRoute";

// Customer (Consumer) pages
import ConsumerDashboard from "./pages/dashboards/customer/ConsumerDashboard";
import ConsumerOrders from "./pages/dashboards/customer/ConsumerOrders";

// Retailer pages
import RetailerHome from "./pages/dashboards/retailer/RetailerHome";
import RetailerInventory from "./pages/dashboards/retailer/RetailerInventory";
import RetailerWholesaleOrders from "./pages/dashboards/retailer/RetailerWholesaleOrders";
import Retailer from "./pages/dashboards/retailer/RetailerCustomerOrder";

// Wholesaler pages
import WholesalerHome from "./pages/dashboards/wholesaler/WholesalerHome";
import WholesalerTransactions from "./pages/dashboards/wholesaler/WholesalerTransactions";

// Delivery pages
import Delivery from "./pages/dashboards/Delivery/Delivery";
import DeliveryPastOrders from "./pages/dashboards/Delivery/DeliveryPastOrders";

// Optional
import Payment from "./pages/Payment";

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Routes>

        {/* PUBLIC ROUTES */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/" element={<HomePage />} />

        {/* ---------------- CUSTOMER ROUTES ---------------- */}
        <Route
          path="/customer/home"
          element={
            <PrivateRoute role="customer">
              <ConsumerDashboard />
            </PrivateRoute>
          }
        />

        <Route
          path="/customer/orders"
          element={
            <PrivateRoute role="customer">
              <ConsumerOrders />
            </PrivateRoute>
          }
        />

        {/* ---------------- RETAILER ROUTES ---------------- */}
        <Route
          path="/retailer/home"  
          element={
            <PrivateRoute role="retailer">
              <RetailerHome />
            </PrivateRoute>
          }
        />

        <Route
          path="/retailer/inventory"
          element={
            <PrivateRoute role="retailer">
              <RetailerInventory />
            </PrivateRoute>
          }
        />

        <Route
          path="/retailer/wholesaler-orders"
          element={
            <PrivateRoute role="retailer">
              <RetailerWholesaleOrders />
            </PrivateRoute>
          }
        />
        <Route
          path="/retailer/customer-orders"
          element={
            <PrivateRoute role="retailer">
              <Retailer />
            </PrivateRoute>
          }
        />

        {/* ---------------- WHOLESALER ROUTES ---------------- */}
        <Route
          path="/wholesaler/home"
          element={
            <PrivateRoute role="wholesaler">
              <WholesalerHome />
            </PrivateRoute>
          }
        />

        <Route
          path="/wholesaler/transactions"
          element={
            <PrivateRoute role="wholesaler">
              <WholesalerTransactions />
            </PrivateRoute>
          }
        />

        {/* ---------------- DELIVERY ROUTES ---------------- */}
        <Route
          path="/delivery/home"
          element={
            <PrivateRoute role="delivery">
              <Delivery />
            </PrivateRoute>
          }
        />
        <Route
          path="/delivery/past-orders"
          element={
            <PrivateRoute role="delivery">
              <DeliveryPastOrders />
            </PrivateRoute>
          }
        />

        <Route
          path="/payment"
          element={
              <Payment />
          }
        />
      </Routes>
      </ToastProvider>
    </AuthProvider>
  );
}
