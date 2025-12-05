import React, { useState, useEffect } from "react";
import { useToast } from "../../../context/ToastContext";
import { useContext } from "react";
import { AuthContext } from "../../../context/AuthProvider";

const STAGES = ["Placed", "Confirmed", "Dispatched", "Delivered"];

export default function OrderCard({ order, onUpdate, theme, onRefresh }) {
  const { token } = useContext(AuthContext);
  const { success, error: showError } = useToast();
  const [otp, setOtp] = useState("");
  const [requestingOtp, setRequestingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpRequested, setOtpRequested] = useState(false);
  
  // Reset OTP state when order changes
  useEffect(() => {
    setOtp("");
    setOtpRequested(false);
  }, [order.s_no, order.id]);
  
  const currentIndex = STAGES.indexOf(order.status || "Placed");
  const allowed = STAGES.slice(currentIndex + 1); // Only show next stages

  const handleRequestOTP = async () => {
    setRequestingOtp(true);
    try {
      const res = await fetch(`http://localhost:5000/api/delivery/orders/${order.s_no || order.id}/request-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ order_type: order.order_type })
      });

      const data = await res.json();
      if (res.ok) {
        success(data.message || "OTP sent to recipient's email");
        if (data.otp) {
          console.log("📧 OTP for testing:", data.otp);
        }
        setOtpRequested(true);
        if (onRefresh) onRefresh();
      } else {
        showError(data.error || "Failed to request OTP");
      }
    } catch (err) {
      console.error("Error requesting OTP:", err);
      showError("Failed to request OTP");
    } finally {
      setRequestingOtp(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      showError("Please enter a valid 6-digit OTP");
      return;
    }

    setVerifyingOtp(true);
    try {
      const res = await fetch(`http://localhost:5000/api/delivery/orders/${order.s_no || order.id}/verify-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ otp, order_type: order.order_type })
      });

      const data = await res.json();
      if (res.ok) {
        success(data.message || "OTP verified! Order marked as delivered.");
        setOtp("");
        setOtpRequested(false);
        if (onRefresh) onRefresh();
      } else {
        showError(data.error || "Failed to verify OTP");
      }
    } catch (err) {
      console.error("Error verifying OTP:", err);
      showError("Failed to verify OTP");
    } finally {
      setVerifyingOtp(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Delivered":
        return "rgba(16, 185, 129, 0.2)";
      case "Dispatched":
        return "rgba(249, 115, 22, 0.2)";
      case "Confirmed":
        return "rgba(59, 130, 246, 0.2)";
      default:
        return "rgba(251, 191, 36, 0.2)";
    }
  };

  const getStatusBorderColor = (status) => {
    switch (status) {
      case "Delivered":
        return "rgba(16, 185, 129, 0.3)";
      case "Dispatched":
        return "rgba(249, 115, 22, 0.3)";
      case "Confirmed":
        return "rgba(59, 130, 246, 0.3)";
      default:
        return "rgba(251, 191, 36, 0.3)";
    }
  };

  const getStatusTextColor = (status) => {
    switch (status) {
      case "Delivered":
        return "rgb(16, 185, 129)";
      case "Dispatched":
        return "rgb(249, 115, 22)";
      case "Confirmed":
        return "rgb(59, 130, 246)";
      default:
        return "rgb(251, 191, 36)";
    }
  };

  return (
    <div
      style={{
        background: "rgba(0, 0, 0, 0.4)",
        backdropFilter: "blur(10px)",
        borderRadius: 16,
        padding: 20,
        border: `1px solid ${theme?.accentRgba || "rgba(249, 115, 22, 0.3)"}`,
        boxShadow: `0 4px 6px -1px ${theme?.accentRgbaLight || "rgba(249, 115, 22, 0.1)"}`,
        transition: "all 0.3s ease",
        display: "flex",
        flexDirection: "column",
        gap: 16
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = `0 12px 28px ${theme?.accentRgba || "rgba(249, 115, 22, 0.2)"}`;
        e.currentTarget.style.borderColor = theme?.accentLight || "rgba(251, 146, 60, 0.5)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0px)";
        e.currentTarget.style.boxShadow = `0 4px 6px -1px ${theme?.accentRgbaLight || "rgba(249, 115, 22, 0.1)"}`;
        e.currentTarget.style.borderColor = theme?.accentRgba || "rgba(249, 115, 22, 0.3)";
      }}
    >
      {/* Order Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 18, color: "white", marginBottom: 8 }}>
            Order #{order.s_no || order.id}
          </div>
          <div style={{ color: "rgb(148, 163, 184)", fontSize: 14, display: "flex", flexDirection: "column", gap: 4 }}>
            <div>Product ID: <span style={{ color: "white" }}>{order.product_id || "N/A"}</span></div>
            <div>Quantity: <span style={{ color: "white" }}>{order.product_quantity || 1}</span></div>
            <div>
              {order.order_type === 'retailer_order' ? 'Retailer' : 'Customer'}: 
              <span style={{ color: "white" }}>{order.customer_name || order.customer_uid || "N/A"}</span>
            </div>
            {order.order_type === 'customer_order' && order.retailer_name && (
              <div>
                Retailer: <span style={{ color: "white" }}>{order.retailer_name}</span>
              </div>
            )}
            {order.order_type === 'retailer_order' && order.retailer_name && (
              <div>
                Wholesaler: <span style={{ color: "white" }}>{order.retailer_name}</span>
              </div>
            )}
            {order.order_type === 'retailer_order' && (
              <div style={{ 
                padding: "4px 8px", 
                borderRadius: 4, 
                background: "rgba(147, 51, 234, 0.2)", 
                color: "rgb(168, 85, 247)",
                fontSize: 12,
                fontWeight: 600,
                display: "inline-block",
                marginTop: 4
              }}>
                Wholesaler Order
              </div>
            )}
            {order.order_type === 'customer_order' && (
              <div style={{ 
                padding: "4px 8px", 
                borderRadius: 4, 
                background: "rgba(59, 130, 246, 0.2)", 
                color: "rgb(96, 165, 250)",
                fontSize: 12,
                fontWeight: 600,
                display: "inline-block",
                marginTop: 4
              }}>
                Retailer Order
              </div>
            )}
          </div>
        </div>
        <div
          style={{
            padding: "8px 16px",
            borderRadius: 8,
            background: getStatusColor(order.status),
            border: `1px solid ${getStatusBorderColor(order.status)}`,
            color: getStatusTextColor(order.status),
            fontWeight: 600,
            fontSize: 14
          }}
        >
          {order.status || "Placed"}
        </div>
      </div>

      {/* Address */}
      {order.address && (
        <div style={{ paddingTop: 12, borderTop: `1px solid ${theme?.accentRgbaLight || "rgba(249, 115, 22, 0.1)"}` }}>
          <div style={{ color: "rgb(148, 163, 184)", fontSize: 13, marginBottom: 4 }}>📍 Delivery Address</div>
          <div style={{ color: "white", fontSize: 14, fontWeight: 500 }}>
            {order.address.addressLine1}
            {order.address.addressLine2 && `, ${order.address.addressLine2}`}
            <br />
            {order.address.city}, {order.address.pincode}
            <br />
            {order.address.state}
          </div>
        </div>
      )}

      {/* Ask for OTP Button (for Dispatched orders, when OTP not yet requested) */}
      {order.status === "Dispatched" && !otpRequested && (
        <div>
          <button
            onClick={handleRequestOTP}
            disabled={requestingOtp}
            style={{
              width: "100%",
              padding: "12px 16px",
              borderRadius: 8,
              background: "linear-gradient(135deg, rgba(168, 85, 247, 0.9), rgba(147, 51, 234, 0.9))",
              border: "1px solid rgba(168, 85, 247, 0.3)",
              color: "white",
              fontSize: 14,
              fontWeight: 600,
              cursor: requestingOtp ? "not-allowed" : "pointer",
              opacity: requestingOtp ? 0.6 : 1,
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8
            }}
            onMouseEnter={(e) => {
              if (!requestingOtp) {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 8px 25px rgba(168, 85, 247, 0.4)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            {requestingOtp ? (
              <>
                <span className="animate-spin">⏳</span>
                Requesting OTP...
              </>
            ) : (
              <>
                <span>🔐</span>
                Ask for OTP
              </>
            )}
          </button>
        </div>
      )}

      {/* OTP Input (for Dispatched orders when OTP has been requested) */}
      {order.status === "Dispatched" && otpRequested && (
        <div>
          <label style={{ color: "rgb(148, 163, 184)", fontSize: 13, marginBottom: 8, display: "block" }}>
            Enter OTP to Confirm Delivery
          </label>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              type="text"
              value={otp}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                setOtp(value);
              }}
              placeholder="Enter 6-digit OTP"
              maxLength={6}
              style={{
                flex: 1,
                padding: "10px 12px",
                borderRadius: 8,
                background: "rgba(15, 23, 42, 0.5)",
                border: `1px solid rgba(168, 85, 247, 0.3)`,
                color: "white",
                fontSize: 16,
                fontWeight: 600,
                letterSpacing: 4,
                textAlign: "center",
                fontFamily: "monospace",
                outline: "none",
                transition: "all 0.2s ease"
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "rgba(168, 85, 247, 0.5)";
                e.currentTarget.style.boxShadow = "0 0 0 3px rgba(168, 85, 247, 0.1)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "rgba(168, 85, 247, 0.3)";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
            <button
              onClick={handleVerifyOTP}
              disabled={verifyingOtp || otp.length !== 6}
              style={{
                padding: "10px 20px",
                borderRadius: 8,
                background: otp.length === 6 
                  ? "linear-gradient(135deg, rgba(16, 185, 129, 0.9), rgba(5, 150, 105, 0.9))"
                  : "rgba(16, 185, 129, 0.3)",
                border: "1px solid rgba(16, 185, 129, 0.3)",
                color: "white",
                fontSize: 14,
                fontWeight: 600,
                cursor: (verifyingOtp || otp.length !== 6) ? "not-allowed" : "pointer",
                opacity: (verifyingOtp || otp.length !== 6) ? 0.6 : 1,
                transition: "all 0.2s ease",
                whiteSpace: "nowrap"
              }}
              onMouseEnter={(e) => {
                if (otp.length === 6 && !verifyingOtp) {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 8px 25px rgba(16, 185, 129, 0.4)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              {verifyingOtp ? "Verifying..." : "Verify"}
            </button>
          </div>
          <p style={{ color: "rgb(148, 163, 184)", fontSize: 12, marginTop: 8, textAlign: "center" }}>
            OTP has been sent to the recipient's email
          </p>
        </div>
      )}

      {/* Status Update (for other statuses) */}
      {allowed.length > 0 && order.status !== "Dispatched" && (
        <div>
          <label style={{ color: "rgb(148, 163, 184)", fontSize: 13, marginBottom: 8, display: "block" }}>
            Update Status
          </label>
          <select
            onChange={(e) => onUpdate(order.s_no || order.id, e.target.value)}
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: 8,
              background: "rgba(15, 23, 42, 0.5)",
              border: `1px solid ${theme?.accentRgba || "rgba(249, 115, 22, 0.3)"}`,
              color: "white",
              outline: "none",
              cursor: "pointer",
              fontSize: 14,
              fontWeight: 500,
              transition: "all 0.2s ease"
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = theme?.accentLight || "rgba(251, 146, 60, 0.5)";
              e.currentTarget.style.boxShadow = `0 0 0 3px ${theme?.accentRgbaLight || "rgba(249, 115, 22, 0.1)"}`;
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = theme?.accentRgba || "rgba(249, 115, 22, 0.3)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <option value="">Select status...</option>
            {allowed.map((s) => (
              <option key={s} value={s} style={{ background: "#1e293b", color: "white" }}>
                {s}
              </option>
            ))}
          </select>
        </div>
      )}

      {allowed.length === 0 && (
        <div style={{
          padding: 12,
          borderRadius: 8,
          background: "rgba(16, 185, 129, 0.1)",
          border: "1px solid rgba(16, 185, 129, 0.3)",
          color: "rgb(16, 185, 129)",
          fontSize: 14,
          textAlign: "center",
          fontWeight: 500
        }}>
          ✓ Order completed
        </div>
      )}
    </div>
  );
}
