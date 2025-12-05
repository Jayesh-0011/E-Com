import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthProvider";
import { useToast } from "../context/ToastContext";

const Payment = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { token } = useContext(AuthContext);
  const { success, error: showError } = useToast();

  const [amount, setAmount] = useState("");
  const [showUPI, setShowUPI] = useState(false);
  const [upiId, setUpiId] = useState("");
  const [role, setRole] = useState("customer");
  const [loading, setLoading] = useState(false);

  // Load amount and role from location state or sessionStorage
  useEffect(() => {
    const pendingOrder = sessionStorage.getItem("pendingOrder");
    if (pendingOrder) {
      const orderData = JSON.parse(pendingOrder);
      setAmount(orderData.total || location.state?.amount || "");
      setRole(orderData.role || location.state?.role || "customer");
    } else if (location.state?.amount) {
      setAmount(location.state.amount);
      setRole(location.state.role || "customer");
    }
  }, [location]);

  const completeOrder = async (paymentMethod, paymentId) => {
    try {
      const pendingOrder = sessionStorage.getItem("pendingOrder");
      if (!pendingOrder) {
        showError("Order data not found. Please try again.");
        navigate(role === "customer" ? "/customer/home" : "/retailer/home");
        return;
      }

      const orderData = JSON.parse(pendingOrder);
      const endpoint = role === "customer" 
        ? "http://localhost:5000/api/consumer/orders"
        : "http://localhost:5000/api/retailer/orders";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ items: orderData.items }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to place order");
      }

      // Clear pending order from sessionStorage
      sessionStorage.removeItem("pendingOrder");
      
      success("Order placed successfully!");
      navigate(role === "customer" ? "/customer/home" : "/retailer/home");
    } catch (err) {
      console.error("Error completing order:", err);
      showError(`Error placing order: ${err.message}`);
    }
  };

  const handleStripePayment = async () => {
    // Validate minimum amount before calling Stripe
    const amountNum = Number(amount);
    const minAmount = 50; // Minimum ₹50 for Stripe

    if (isNaN(amountNum) || amountNum < minAmount) {
      showError(`Minimum payment amount is ₹${minAmount}. Your order total is ₹${amountNum.toFixed(2)}. Please add more items to your cart.`);
      return;
    }

    // Ensure pendingOrder exists before redirecting
    let pendingOrder = sessionStorage.getItem("pendingOrder");
    if (!pendingOrder) {
      console.error("❌ No pendingOrder found in sessionStorage before Stripe redirect");
      showError("Order data not found. Please try adding items to cart again.");
      return;
    }

    // Parse and validate order data
    let orderData;
    try {
      orderData = JSON.parse(pendingOrder);
      if (!orderData.items || !Array.isArray(orderData.items) || orderData.items.length === 0) {
        console.error("❌ Invalid order data structure:", orderData);
        showError("Invalid order data. Please try adding items to cart again.");
        return;
      }
      console.log("✅ Order data validated before Stripe redirect:", orderData);
    } catch (parseError) {
      console.error("❌ Error parsing pendingOrder:", parseError);
      showError("Invalid order data. Please try adding items to cart again.");
      return;
    }

    // Save to localStorage as backup
    try {
      localStorage.setItem("pendingOrder_backup", pendingOrder);
      console.log("✅ Order data backed up to localStorage");
    } catch (storageError) {
      console.warn("⚠️ Could not save to localStorage:", storageError);
    }

    try {
      setLoading(true);
      console.log("📤 Creating Stripe checkout session...");
      const response = await axios.post("http://localhost:5000/create-checkout-session", {
        amount: amount,
        role: role
      });
      
      if (!response.data?.url) {
        throw new Error("No checkout URL received from server");
      }
      
      console.log("✅ Stripe checkout session created, redirecting...");
      // Redirect to Stripe
      window.location.href = response.data.url;
    } catch (err) {
      setLoading(false);
      
      // Show specific error message from backend
      if (err.response?.data?.error) {
        showError(err.response.data.error);
      } else if (err.code === 'amount_too_small' || err.message?.includes('amount_too_small')) {
        showError("Payment amount is too small. Minimum amount is ₹50. Please add more items to your cart.");
      } else {
        showError("Error starting Stripe Payment. Please try again.");
      }
      console.error("❌ Stripe payment error:", err);
    }
  };

  const handleCODPayment = async () => {
    setLoading(true);
    const paymentId = "cod_" + Math.random().toString(36).substring(2, 10).toUpperCase();
    await completeOrder("COD", paymentId);
    setLoading(false);
  };

  const generateUPITransactionID = () => {
    return "upi_" + Math.random().toString(36).substring(2, 10).toUpperCase();
  };

  const completeUPIPayment = async () => {
    if (!upiId) {
      showError("Please enter your UPI ID");
      return;
    }
    setLoading(true);
    const txid = generateUPITransactionID();
    await completeOrder("UPI", txid);
    setLoading(false);
  };

  const themeColors = {
    customer: {
      gradient: "from-blue-600 to-blue-800",
      button: "bg-blue-600 hover:bg-blue-700"
    },
    retailer: {
      gradient: "from-emerald-600 to-emerald-800",
      button: "bg-emerald-600 hover:bg-emerald-700"
    }
  };

  const theme = themeColors[role] || themeColors.customer;

  return (
    <div 
      className={`h-screen flex items-center justify-center relative overflow-hidden`}
      style={{
        background: role === "customer" 
          ? "linear-gradient(135deg, #1e3a8a 0%, #1e40af 50%, #1e3a8a 100%)"
          : "linear-gradient(135deg, #065f46 0%, #047857 50%, #065f46 100%)"
      }}
    >
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div 
          className="absolute rounded-full opacity-20 blur-3xl"
          style={{
            width: "500px",
            height: "500px",
            background: role === "customer" ? "rgba(59, 130, 246, 0.5)" : "rgba(16, 185, 129, 0.5)",
            top: "-200px",
            right: "-200px",
            animation: "float 6s ease-in-out infinite"
          }}
        />
        <div 
          className="absolute rounded-full opacity-20 blur-3xl"
          style={{
            width: "400px",
            height: "400px",
            background: role === "customer" ? "rgba(37, 99, 235, 0.5)" : "rgba(5, 150, 105, 0.5)",
            bottom: "-150px",
            left: "-150px",
            animation: "float 8s ease-in-out infinite reverse"
          }}
        />
      </div>

      {/* Main Payment Card */}
      <div 
        className="relative z-10 bg-black/80 backdrop-blur-2xl p-8 rounded-3xl shadow-2xl w-full max-w-md text-center border border-white/10"
        style={{
          boxShadow: role === "customer" 
            ? "0 20px 60px rgba(37, 99, 235, 0.3), 0 0 0 1px rgba(59, 130, 246, 0.1)"
            : "0 20px 60px rgba(5, 150, 105, 0.3), 0 0 0 1px rgba(16, 185, 129, 0.1)",
          animation: "fadeInUp 0.6s ease-out"
        }}
      >
        {/* Header */}
        <div className="mb-6">
          <div 
            className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
            style={{
              background: role === "customer"
                ? "linear-gradient(135deg, rgba(37, 99, 235, 0.3), rgba(59, 130, 246, 0.3))"
                : "linear-gradient(135deg, rgba(5, 150, 105, 0.3), rgba(16, 185, 129, 0.3))",
              border: `2px solid ${role === "customer" ? "rgba(59, 130, 246, 0.5)" : "rgba(16, 185, 129, 0.5)"}`
            }}
          >
            <span className="text-3xl">💳</span>
          </div>
          <h1 className="font-bold text-white text-3xl mb-2 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Payment Gateway
          </h1>
          <p className="text-gray-400 text-sm">Secure & Fast Payment Processing</p>
        </div>

        {/* Amount Display */}
        <div 
          className="mb-6 p-6 rounded-2xl"
          style={{
            background: "rgba(255, 255, 255, 0.05)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            backdropFilter: "blur(10px)"
          }}
        >
          <p className="text-gray-400 text-sm mb-2">Total Amount</p>
          <div className="flex items-center justify-center gap-2">
            <span className="text-gray-400 text-lg">₹</span>
            <input
              type="number"
              className="text-4xl font-bold bg-transparent border-none outline-none text-white text-center w-full"
              value={amount}
              readOnly
              style={{ WebkitAppearance: "none", MozAppearance: "textfield" }}
            />
          </div>
          {amount && Number(amount) < 50 && (
            <p className="text-yellow-400 text-xs mt-2 text-center">
              ⚠️ Minimum ₹50 required for card payment
            </p>
          )}
        </div>

        {/* Payment Methods */}
        <div className="mb-4">
          <h3 className="text-white font-semibold text-lg mb-4">Choose Payment Method</h3>
          <div className="flex flex-col gap-3">
            {/* Stripe Card Payment */}
            <button
              onClick={handleStripePayment}
              disabled={loading || !amount || Number(amount) < 50}
              className="group relative overflow-hidden py-4 px-6 rounded-xl text-white font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: role === "customer"
                  ? "linear-gradient(135deg, rgba(37, 99, 235, 0.9), rgba(59, 130, 246, 0.9))"
                  : "linear-gradient(135deg, rgba(5, 150, 105, 0.9), rgba(16, 185, 129, 0.9))",
                boxShadow: role === "customer"
                  ? "0 4px 15px rgba(37, 99, 235, 0.4)"
                  : "0 4px 15px rgba(5, 150, 105, 0.4)"
              }}
              onMouseEnter={(e) => {
                if (!loading && amount) {
                  e.currentTarget.style.transform = "translateY(-2px) scale(1.02)";
                  e.currentTarget.style.boxShadow = role === "customer"
                    ? "0 8px 25px rgba(37, 99, 235, 0.6)"
                    : "0 8px 25px rgba(5, 150, 105, 0.6)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0) scale(1)";
                e.currentTarget.style.boxShadow = role === "customer"
                  ? "0 4px 15px rgba(37, 99, 235, 0.4)"
                  : "0 4px 15px rgba(5, 150, 105, 0.4)";
              }}
            >
              <div className="flex items-center justify-center gap-3">
                <span className="text-2xl">💳</span>
                <span>{loading ? "Processing..." : "Pay with Card (Stripe)"}</span>
                {!loading && <span className="text-lg">→</span>}
              </div>
            </button>

            {/* UPI Payment */}
            <button
              onClick={() => setShowUPI(true)}
              disabled={loading || !amount}
              className="group relative overflow-hidden py-4 px-6 rounded-xl text-white font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: "linear-gradient(135deg, rgba(34, 197, 94, 0.9), rgba(22, 163, 74, 0.9))",
                boxShadow: "0 4px 15px rgba(34, 197, 94, 0.4)"
              }}
              onMouseEnter={(e) => {
                if (!loading && amount) {
                  e.currentTarget.style.transform = "translateY(-2px) scale(1.02)";
                  e.currentTarget.style.boxShadow = "0 8px 25px rgba(34, 197, 94, 0.6)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0) scale(1)";
                e.currentTarget.style.boxShadow = "0 4px 15px rgba(34, 197, 94, 0.4)";
              }}
            >
              <div className="flex items-center justify-center gap-3">
                <span className="text-2xl">📱</span>
                <span>Pay with UPI</span>
                {!loading && <span className="text-lg">→</span>}
              </div>
            </button>

            {/* Cash on Delivery */}
            <button
              onClick={handleCODPayment}
              disabled={loading || !amount}
              className="group relative overflow-hidden py-4 px-6 rounded-xl text-white font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: "linear-gradient(135deg, rgba(245, 158, 11, 0.9), rgba(217, 119, 6, 0.9))",
                boxShadow: "0 4px 15px rgba(245, 158, 11, 0.4)"
              }}
              onMouseEnter={(e) => {
                if (!loading && amount) {
                  e.currentTarget.style.transform = "translateY(-2px) scale(1.02)";
                  e.currentTarget.style.boxShadow = "0 8px 25px rgba(245, 158, 11, 0.6)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0) scale(1)";
                e.currentTarget.style.boxShadow = "0 4px 15px rgba(245, 158, 11, 0.4)";
              }}
            >
              <div className="flex items-center justify-center gap-3">
                <span className="text-2xl">💰</span>
                <span>Cash on Delivery</span>
                {!loading && <span className="text-lg">→</span>}
              </div>
            </button>
          </div>
        </div>

        {/* Security Badge */}
        <div className="mt-6 pt-4 border-t border-white/10">
          <div className="flex items-center justify-center gap-2 text-gray-400 text-xs">
            <span>🔒</span>
            <span>Secure Payment • SSL Encrypted</span>
          </div>
        </div>
      </div>

      {/* UPI Modal */}
      {showUPI && (
        <div 
          className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50"
          style={{ animation: "fadeIn 0.3s ease-out" }}
          onClick={() => !loading && setShowUPI(false)}
        >
          <div 
            className="bg-black/95 backdrop-blur-2xl p-8 rounded-3xl w-full max-w-sm text-center shadow-2xl border border-white/10 relative"
            style={{
              boxShadow: "0 25px 50px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)",
              animation: "slideUp 0.4s ease-out"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setShowUPI(false)}
              disabled={loading}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
              style={{ fontSize: "24px" }}
            >
              ×
            </button>

            {/* Header */}
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 bg-gradient-to-br from-green-500/20 to-green-600/20 border-2 border-green-500/30">
                <span className="text-3xl">📱</span>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">UPI Payment</h2>
              <p className="text-gray-400 text-sm">Scan QR or Enter UPI ID</p>
            </div>

            {/* QR Code */}
            <div 
              className="mb-6 p-4 rounded-2xl inline-block"
              style={{
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)"
              }}
            >
              <img
                src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay"
                alt="UPI QR Code"
                className="w-48 h-48 rounded-xl border-2 border-white/20"
              />
            </div>

            {/* UPI ID Input */}
            <div className="mb-6">
              <input
                type="text"
                className="w-full px-4 py-3 border border-white/20 rounded-xl bg-black/50 text-white placeholder-gray-500 outline-none focus:border-green-500/50 focus:ring-2 focus:ring-green-500/20 transition-all"
                placeholder="Enter UPI ID (e.g. name@upi)"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                disabled={loading}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              <button
                onClick={completeUPIPayment}
                disabled={loading || !upiId}
                className="w-full py-3 px-6 rounded-xl text-white font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: "linear-gradient(135deg, rgba(34, 197, 94, 0.9), rgba(22, 163, 74, 0.9))",
                  boxShadow: "0 4px 15px rgba(34, 197, 94, 0.4)"
                }}
                onMouseEnter={(e) => {
                  if (!loading && upiId) {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 8px 25px rgba(34, 197, 94, 0.6)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 15px rgba(34, 197, 94, 0.4)";
                }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin">⏳</span>
                    Processing...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <span>✓</span>
                    Complete Payment
                  </span>
                )}
              </button>

              <button
                onClick={() => setShowUPI(false)}
                disabled={loading}
                className="w-full py-2.5 px-6 rounded-xl text-gray-300 font-medium transition-all duration-300 hover:text-white disabled:opacity-50"
                style={{
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.1)"
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSS Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(50px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes float {
          0%, 100% {
            transform: translate(0, 0) rotate(0deg);
          }
          50% {
            transform: translate(20px, -20px) rotate(5deg);
          }
        }
      `}</style>

    </div>
  );
};

export default Payment;
