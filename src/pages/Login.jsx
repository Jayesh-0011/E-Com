import React, { useContext, useState, useEffect } from "react";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../firebase";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthProvider";

export default function Login() {
  const { login } = useContext(AuthContext);
  const [selectedRole, setSelectedRole] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [showOTP, setShowOTP] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Trigger fade-in animation on mount
    setIsVisible(true);
  }, []);

  const redirectByRole = (role) => {
    if (role === "customer") navigate("/customer/home");
    if (role === "retailer") navigate("/retailer/home");
    if (role === "wholesaler") navigate("/wholesaler/home");
    if (role === "delivery") navigate("/delivery/home");
  };

  // Send OTP for email verification
  const handleSendOTP = async (emailToVerify) => {
    if (!emailToVerify) {
      setError("Email is required for verification");
      return;
    }

    try {
      setOtpLoading(true);
      setError("");

      const res = await fetch("http://localhost:5000/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailToVerify }),
      });

      const data = await res.json();

      if (data.success) {
        setOtpSent(true);
        setShowOTP(true);
        setPendingEmail(emailToVerify);
        if (data.otp) {
          console.log("🔐 OTP for testing:", data.otp);
        }
      } else {
        setError(data.error || "Failed to send OTP");
      }
    } catch (err) {
      console.error("OTP send error:", err);
      setError("Server error. Please try again.");
    } finally {
      setOtpLoading(false);
    }
  };

  // Verify OTP and complete login
  const handleVerifyOTPAndLogin = async () => {
    if (!otp || otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP");
      return;
    }

    try {
      setOtpLoading(true);
      setError("");

      const res = await fetch("http://localhost:5000/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: pendingEmail, otp }),
      });

      const data = await res.json();

      if (data.success) {
        // OTP verified, update user email_verified status and retry login
        // For now, just retry the login - backend should allow it after verification
        // In a real app, you'd update the database here
        setShowOTP(false);
        setNeedsVerification(false);
        // Retry login
        handleManualLogin();
      } else {
        setError(data.error || "Invalid OTP");
      }
    } catch (err) {
      console.error("OTP verify error:", err);
      setError("Server error. Please try again.");
    } finally {
      setOtpLoading(false);
    }
  };

  // ----------------------------------------------------------
  // MANUAL LOGIN
  // ----------------------------------------------------------
  const handleManualLogin = async () => {
    if (!selectedRole || !identifier || !password) {
      setError("Enter username/email, password, and select a role.");
      return;
    }

    try {
      setLoading(true);

      const userObj = {
        identifier,      // username OR email
        password,
        role: selectedRole,
      };

      const res = await fetch("http://localhost:5000/manual-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user: userObj }),
      });

      const data = await res.json();

      if (data?.token && data?.user) {
        login(data.user, data.token);
        redirectByRole(selectedRole);
      } else {
        setError(data?.error || "Login failed.");
      }
    } catch (err) {
      console.error("Manual login error:", err);
      setError("Server error.");
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------------------------
  // GOOGLE LOGIN
  // ----------------------------------------------------------
  const handleGoogleLogin = async () => {
    if (!selectedRole) {
      setError("Select a role first.");
      return;
    }

    try {
      setLoading(true);
      const result = await signInWithPopup(auth, googleProvider);
      const gUser = result.user;

      const userObj = {
        uid: gUser.uid + "-" + selectedRole, // must match your server.js logic
        name: gUser.displayName,
        email: gUser.email,
        role: selectedRole,
      };

      const res = await fetch("http://localhost:5000/google-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user: userObj }),
      });

      const data = await res.json();

      if (data?.token && data?.user) {
        login(data.user, data.token);
        redirectByRole(selectedRole);
      } else {
        setError(data?.error || "Login failed.");
      }
    } catch (err) {
      console.error("Google login error:", err);
      setError("Google Sign-In failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-black relative overflow-hidden">
      {/* Animated dark blue background */}
      <div className="fixed inset-0 bg-gradient-to-br from-black via-blue-950 to-black"></div>
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(30,58,138,0.4),transparent)] animate-pulse"></div>
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(30,58,138,0.3),transparent)] animate-pulse" style={{ animationDelay: '1s' }}></div>
      
      {/* Animated grid pattern */}
      <div className="fixed inset-0 opacity-10" style={{
        backgroundImage: 'linear-gradient(rgba(59,130,246,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.1) 1px, transparent 1px)',
        backgroundSize: '50px 50px',
        animation: 'gridMove 20s linear infinite'
      }}></div>

      <style>{`
        @keyframes gridMove {
          0% { transform: translate(0, 0); }
          100% { transform: translate(50px, 50px); }
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .fade-in {
          animation: fadeIn 0.5s ease-out forwards;
        }
        .animate-fadeInUp {
          animation: fadeInUp 0.5s ease-out forwards;
        }
      `}</style>
      
      <div className={`relative z-10 w-full max-w-md px-6 transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
        <div className="bg-gradient-to-br from-black/90 to-blue-950/90 backdrop-blur-xl border border-blue-700/30 shadow-2xl shadow-blue-900/30 rounded-2xl p-8 lg:p-10">
          <div className="px-2">
          {/* Logo/Title */}
          <div className="text-center mb-8">
            <div className="inline-block mb-4 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 rounded-lg text-white font-bold text-xl shadow-lg shadow-blue-600/50 hover:shadow-xl hover:shadow-blue-600/60 transition-all duration-300 hover:scale-110">
              QS
            </div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Welcome Back
            </h2>
            <p className="mt-2 text-slate-400">Sign in to your account</p>
          </div>

          {/* Role Selection */}
          <div className="flex justify-center gap-2 mb-6 px-2">
            {["customer", "retailer", "wholesaler", "delivery"].map((r) => (
              <button
                key={r}
                onClick={() => setSelectedRole(r)}
                className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-300 capitalize flex-1 max-w-[120px] ${
                  selectedRole === r
                    ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-600/50 scale-105 border-2 border-blue-500"
                    : "bg-black/50 text-slate-300 border border-blue-700/30 hover:border-blue-600/50 hover:text-blue-300 hover:bg-blue-950/30"
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          {/* Input Fields */}
          <div className="space-y-4 mb-6">
            <div className="relative group">
              <input
                type="text"
                placeholder="Email or Username"
                className="w-full bg-black/50 border border-blue-700/30 text-white placeholder-slate-500 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all duration-300 group-hover:border-blue-600/50"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
              />
            </div>

            <div className="relative group">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                className="w-full bg-black/50 border border-blue-700/30 text-white placeholder-slate-500 rounded-lg px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all duration-300 group-hover:border-blue-600/50"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-400 transition-colors duration-200 focus:outline-none"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* OTP Verification Section */}
          {showOTP && needsVerification && (
            <div className="mb-6 p-6 bg-gradient-to-br from-blue-950/40 to-black/40 backdrop-blur-xl border border-blue-700/40 rounded-2xl shadow-2xl shadow-blue-900/20 animate-fadeInUp">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-500 rounded-full mb-3 shadow-lg shadow-blue-600/50 animate-pulse">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Verify Your Email</h3>
                <p className="text-sm text-blue-300">
                  We sent a 6-digit code to <br />
                  <span className="font-semibold text-blue-200">{pendingEmail}</span>
                </p>
                {process.env.NODE_ENV === "development" && (
                  <div className="text-xs text-slate-400 mt-2 bg-black/30 px-2 py-1 rounded">Check console for OTP</div>
                )}
              </div>
              
              {/* Individual OTP Input Boxes */}
              <div className="flex justify-center gap-3 mb-6">
                {[0, 1, 2, 3, 4, 5].map((index) => (
                  <input
                    key={index}
                    type="text"
                    inputMode="numeric"
                    maxLength="1"
                    value={otp[index] || ""}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "");
                      if (value) {
                        const newOtp = otp.split("");
                        newOtp[index] = value;
                        const updatedOtp = newOtp.join("").slice(0, 6);
                        setOtp(updatedOtp);
                        
                        // Auto-focus next input
                        if (index < 5 && value) {
                          document.getElementById(`otp-${index + 1}`)?.focus();
                        }
                      } else {
                        // Handle backspace
                        const newOtp = otp.split("");
                        newOtp[index] = "";
                        setOtp(newOtp.join(""));
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Backspace" && !otp[index] && index > 0) {
                        document.getElementById(`otp-${index - 1}`)?.focus();
                      }
                    }}
                    onPaste={(e) => {
                      e.preventDefault();
                      const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
                      if (pastedData.length === 6) {
                        setOtp(pastedData);
                        document.getElementById(`otp-5`)?.focus();
                      }
                    }}
                    id={`otp-${index}`}
                    className="w-14 h-14 bg-black/60 border-2 border-blue-700/50 text-white text-center text-2xl font-bold rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 focus:bg-blue-950/30 transition-all duration-300 hover:border-blue-600/70 hover:bg-blue-950/20 shadow-lg shadow-blue-900/20"
                    autoFocus={index === 0}
                  />
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleVerifyOTPAndLogin}
                  disabled={otp.length !== 6 || otpLoading}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-blue-500 text-white py-3 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:shadow-lg hover:shadow-blue-600/50 hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
                >
                  {otpLoading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Verifying...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Verify & Login
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => handleSendOTP(pendingEmail)}
                  disabled={otpLoading}
                  className="px-6 py-3 bg-black/50 border border-blue-700/50 text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:bg-blue-950/30 hover:border-blue-600/70 hover:scale-[1.02] active:scale-95"
                >
                  Resend
                </button>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-900/30 border border-red-700/50 rounded-lg text-red-300 text-sm text-center">
              {error}
            </div>
          )}

          {/* Login Button */}
          <button
            className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white py-3 rounded-lg font-semibold shadow-lg shadow-blue-600/50 hover:shadow-xl hover:shadow-blue-600/60 transition-all duration-300 hover:scale-[1.02] active:scale-95 mb-4 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleManualLogin}
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading...
              </span>
            ) : (
              "Login"
            )}
          </button>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-blue-700/30"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-black/90 text-slate-400">Or continue with</span>
            </div>
          </div>

          {/* Google Login Button */}
          <button
            className="w-full bg-black/50 border border-blue-700/30 text-white py-3 rounded-lg font-semibold hover:bg-blue-950/30 hover:border-blue-600/50 transition-all duration-300 flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95"
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Login with Google
          </button>

          {/* Sign Up Link */}
          <div className="mt-6 text-center">
            <p className="text-slate-400 text-sm">
              Don't have an account?{" "}
              <a href="/signup" className="text-blue-400 hover:text-cyan-400 font-semibold transition-colors hover:underline">
                Sign up
              </a>
            </p>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}
