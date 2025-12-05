import React, { useContext, useState, useEffect } from "react";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../firebase";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthProvider";

export default function Signup() {
  const { login } = useContext(AuthContext);
  const [selectedRole, setSelectedRole] = useState("");
  
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [phone, setPhone] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [pincode, setPincode] = useState("");
  const [state, setState] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [showOTP, setShowOTP] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [verifiedEmail, setVerifiedEmail] = useState("");
  const [locationLoading, setLocationLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Trigger fade-in animation on mount
    setIsVisible(true);
  }, []);

  // ----------------------------------------------------------
  // GET LOCATION FROM OPENSTREETMAP
  // ----------------------------------------------------------
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }

    setLocationLoading(true);
    setError("");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          
          // Use OpenStreetMap Nominatim API (free, no API key required)
          // Note: Nominatim has a usage policy: max 1 request per second
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
            {
              headers: {
                'User-Agent': 'QuickShop E-Commerce App' // Required by Nominatim usage policy
              }
            }
          );

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const data = await response.json();

          if (data && data.address) {
            const address = data.address;

            // Extract landmarks and location identifiers
            const landmark = address.amenity ||           // e.g., "Restaurant", "School"
                           address.building ||            // Building name
                           address.place ||               // Place name
                           address.tourism ||             // Tourist attraction
                           address.leisure ||             // Leisure facility
                           address.shop ||                // Shop name
                           address.office ||              // Office name
                           address.landuse ||             // Land use type
                           "";

            const city = address.city || 
                        address.town || 
                        address.village || 
                        address.municipality || 
                        address.county ||
                        address.district ||
                        address.suburb ||
                        address.neighbourhood ||
                        address.city_district ||
                        "";
            const postalCode = address.postcode || "";
            const state = address.state || 
                         address.region || 
                         address.province ||
                         address.administrative ||
                         "";

            // Build address line 2 with landmark and additional location info
            // If no landmark found, try to extract from display_name
            let addressLine2Value = "";
            if (landmark) {
              addressLine2Value = landmark;
            } else {
              // Try to extract landmark from display_name (first part before comma)
              const displayParts = data.display_name.split(",");
              addressLine2Value = displayParts[0] || "";
            }
            
            // Add additional location context if available
            const additionalInfo = address.suburb || 
                                 address.neighbourhood || 
                                 address.city_district ||
                                 address.locality ||
                                 "";
            
            if (additionalInfo && addressLine2Value) {
              addressLine2Value = `${addressLine2Value}, ${additionalInfo}`;
            } else if (additionalInfo) {
              addressLine2Value = additionalInfo;
            }

            // Address Line 1: Leave empty for user to fill manually
            // Address Line 2: Set landmark
            // City, Pincode, State: Auto-fill
            setAddressLine1(""); // User will fill this manually
            setAddressLine2(addressLine2Value.trim());
            setCity(city);
            setPincode(postalCode);
            setState(state);

            setError("");
          } else {
            setError("Could not retrieve address for this location. Please enter manually.");
            console.error("Nominatim response:", data);
          }
        } catch (err) {
          console.error("Geocoding error:", err);
          setError("Error getting address. Please enter manually.");
        } finally {
          setLocationLoading(false);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        setLocationLoading(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setError("Location access denied. Please enable location permissions or enter address manually.");
            break;
          case error.POSITION_UNAVAILABLE:
            setError("Location information unavailable. Please enter address manually.");
            break;
          case error.TIMEOUT:
            setError("Location request timed out. Please enter address manually.");
            break;
          default:
            setError("Error getting location. Please enter address manually.");
            break;
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const redirectByRole = (role) => {
    if (role === "customer") navigate("/customer/home");
    if (role === "retailer") navigate("/retailer/home");
    if (role === "wholesaler") navigate("/wholesaler/home");
    if (role === "delivery") navigate("/delivery/home");
  };

  // ----------------------------------------------------------
  // SEND OTP
  // ----------------------------------------------------------
  const handleSendOTP = async () => {
    if (!email) {
      setError("Please enter your email first.");
      return;
    }

    try {
      setOtpLoading(true);
      setError("");

      const res = await fetch("http://localhost:5000/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (data.success) {
        setOtpSent(true);
        setShowOTP(true);
        setVerifiedEmail(email);
        // In development, show OTP in console
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

  // ----------------------------------------------------------
  // VERIFY OTP
  // ----------------------------------------------------------
  const handleVerifyOTP = async () => {
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
        body: JSON.stringify({ email: verifiedEmail, otp }),
      });

      const data = await res.json();

      if (data.success) {
        // OTP verified, proceed with signup
        handleCompleteSignup();
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
  // COMPLETE SIGNUP (After OTP verification)
  // ----------------------------------------------------------
  const handleCompleteSignup = async () => {
    // Address is not required for delivery role
    const requiresAddress = selectedRole !== "delivery";
    if (!selectedRole || !name || !email || !phone || !password) {
      setError("All required fields must be filled.");
      return;
    }
    if (requiresAddress && (!addressLine1 || !city || !pincode || !state)) {
      setError("Please fill all required address fields (Address Line 1, City, Pincode, State).");
      return;
    }

    try {
      setLoading(true);

      const userObj = {
        uid: email + "-" + selectedRole,
        name,
        email,
        role: selectedRole,
        phone: countryCode + phone, // Prepend country code
        addressLine1: requiresAddress ? addressLine1 : undefined,
        addressLine2: requiresAddress ? addressLine2 : undefined,
        city: requiresAddress ? city : undefined,
        pincode: requiresAddress ? pincode : undefined,
        state: requiresAddress ? state : undefined,
        password,
      };

      const res = await fetch("http://localhost:5000/manual-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user: userObj }),
      });

      const data = await res.json();

      if (data?.token && data?.user) {
        login(data.user, data.token);
        redirectByRole(selectedRole);
      } else {
        setError(data?.error || "Signup failed.");
      }

    } catch (err) {
      console.error("Signup error:", err);
      setError("Server error.");
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------------------------
  // MANUAL SIGNUP (Now triggers OTP flow)
  // ----------------------------------------------------------
  const handleManualSignup = async () => {
    // Address is not required for delivery role
    const requiresAddress = selectedRole !== "delivery";
    if (!selectedRole || !name || !email || !phone || !password) {
      setError("All required fields must be filled.");
      return;
    }
    if (requiresAddress && (!addressLine1 || !city || !pincode || !state)) {
      setError("Please fill all required address fields (Address Line 1, City, Pincode, State).");
      return;
    }

    // Check if email is already verified
    if (verifiedEmail === email && otpSent) {
      // Email already verified, proceed with signup
      handleCompleteSignup();
    } else {
      // Need to verify email first
      handleSendOTP();
    }
  };

  // ----------------------------------------------------------
  // GOOGLE SIGNUP
  // ----------------------------------------------------------
  const handleGoogleSignup = async () => {
    if (!selectedRole) {
      setError("Select a role first.");
      return;
    }

    // Address is not required for delivery role
    const requiresAddress = selectedRole !== "delivery";
    if (!phone) {
      setError("Phone number is required.");
      return;
    }
    if (requiresAddress && (!addressLine1 || !city || !pincode || !state)) {
      setError("Please fill all required address fields (Address Line 1, City, Pincode, State).");
      return;
    }

      try {
        setLoading(true);
        const result = await signInWithPopup(auth, googleProvider);
        const gUser = result.user;

        const userObj = {
          uid: gUser.uid + "-" + selectedRole,
          username: gUser.displayName,
          email: gUser.email,
          role: selectedRole,
          phone_no: phone,
          addressLine1: requiresAddress ? addressLine1 : undefined,
          addressLine2: requiresAddress ? addressLine2 : undefined,
          city: requiresAddress ? city : undefined,
          pincode: requiresAddress ? pincode : undefined,
          state: requiresAddress ? state : undefined,
          password: null
        };


        const res = await fetch("http://localhost:5000/google-signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user: userObj }),
        });

        const data = await res.json();

        if (data?.token && data?.user) {
          login(data.user, data.token);
          redirectByRole(selectedRole);
        } else {
          setError(data?.error || "Signup failed.");
        }
      } catch (err) {
        console.error("Google signup error:", err);
        setError("Google signup failed.");
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="flex justify-center items-center min-h-screen bg-black relative overflow-hidden py-8">
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
                Create Account
              </h2>
              <p className="mt-2 text-slate-400">Join QuickShop today</p>
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
                  placeholder="Username"
                  className="w-full bg-black/50 border border-blue-700/30 text-white placeholder-slate-500 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all duration-300 group-hover:border-blue-600/50"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="relative group">
                <input
                  type="email"
                  placeholder="Email"
                  className="w-full bg-black/50 border border-blue-700/30 text-white placeholder-slate-500 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all duration-300 group-hover:border-blue-600/50"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="relative group">
                <div className="flex gap-2">
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="bg-black/50 border border-blue-700/30 text-white rounded-lg px-3 py-3 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all duration-300"
                    style={{ minWidth: "100px" }}
                  >
                    <option value="+1">🇺🇸 +1</option>
                    <option value="+91">🇮🇳 +91</option>
                    <option value="+44">🇬🇧 +44</option>
                    <option value="+86">🇨🇳 +86</option>
                    <option value="+81">🇯🇵 +81</option>
                    <option value="+49">🇩🇪 +49</option>
                    <option value="+33">🇫🇷 +33</option>
                    <option value="+39">🇮🇹 +39</option>
                    <option value="+7">🇷🇺 +7</option>
                    <option value="+61">🇦🇺 +61</option>
                    <option value="+55">🇧🇷 +55</option>
                    <option value="+52">🇲🇽 +52</option>
                    <option value="+82">🇰🇷 +82</option>
                    <option value="+971">🇦🇪 +971</option>
                    <option value="+65">🇸🇬 +65</option>
                    <option value="+60">🇲🇾 +60</option>
                    <option value="+66">🇹🇭 +66</option>
                    <option value="+84">🇻🇳 +84</option>
                    <option value="+62">🇮🇩 +62</option>
                    <option value="+63">🇵🇭 +63</option>
                  </select>
                  <input
                    type="tel"
                    placeholder="Phone Number"
                    className="flex-1 bg-black/50 border border-blue-700/30 text-white placeholder-slate-500 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all duration-300 group-hover:border-blue-600/50"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                  />
                </div>
                <div className="text-xs text-slate-500 mt-1">Phone: {countryCode}{phone || "XXXXXXXXXX"}</div>
              </div>

              {selectedRole !== "delivery" && (
                <div className="space-y-3">
                  {/* Get Location Button - Enhanced UI */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={getCurrentLocation}
                      disabled={locationLoading}
                      className="w-full group relative overflow-hidden py-3.5 px-5 bg-gradient-to-r from-emerald-600 via-green-500 to-teal-500 text-white rounded-xl font-semibold text-sm transition-all duration-300 hover:shadow-2xl hover:shadow-green-500/50 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none flex items-center justify-center gap-3 border border-green-400/30"
                    >
                      {/* Animated background gradient */}
                      <div className="absolute inset-0 bg-gradient-to-r from-green-400 via-emerald-500 to-teal-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      
                      {/* Content */}
                      <div className="relative z-10 flex items-center justify-center gap-3">
                        {locationLoading ? (
                          <>
                            <div className="relative">
                              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                              </div>
                            </div>
                            <span className="font-medium">Locating...</span>
                          </>
                        ) : (
                          <>
                            <div className="relative">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full animate-ping"></div>
                              <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full"></div>
                            </div>
                            <span className="font-medium">Get My Location</span>
                            <svg className="w-4 h-4 opacity-70 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </>
                        )}
                      </div>
                    </button>
                    
                    {/* Helper text */}
                    {!locationLoading && (
                      <p className="text-xs text-slate-400 mt-2 text-center">
                        Auto-fills landmark, city, state & pincode
                      </p>
                    )}
                  </div>

                  <div className="relative group">
                    <input
                      type="text"
                      placeholder="Address Line 1 *"
                      className="w-full bg-black/50 border border-blue-700/30 text-white placeholder-slate-500 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all duration-300 group-hover:border-blue-600/50"
                      value={addressLine1}
                      onChange={(e) => setAddressLine1(e.target.value)}
                    />
                  </div>
                  <div className="relative group">
                    <input
                      type="text"
                      placeholder="Address Line 2 (Optional)"
                      className="w-full bg-black/50 border border-blue-700/30 text-white placeholder-slate-500 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all duration-300 group-hover:border-blue-600/50"
                      value={addressLine2}
                      onChange={(e) => setAddressLine2(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="relative group">
                      <input
                        type="text"
                        placeholder="City *"
                        className="w-full bg-black/50 border border-blue-700/30 text-white placeholder-slate-500 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all duration-300 group-hover:border-blue-600/50"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                      />
                    </div>
                    <div className="relative group">
                      <input
                        type="text"
                        placeholder="Pincode *"
                        className="w-full bg-black/50 border border-blue-700/30 text-white placeholder-slate-500 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all duration-300 group-hover:border-blue-600/50"
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value.replace(/\D/g, ""))}
                        maxLength={6}
                      />
                    </div>
                  </div>
                  <div className="relative group">
                    <input
                      type="text"
                      placeholder="State *"
                      className="w-full bg-black/50 border border-blue-700/30 text-white placeholder-slate-500 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all duration-300 group-hover:border-blue-600/50"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                    />
                  </div>
                </div>
              )}

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
            {showOTP && (
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
                    <span className="font-semibold text-blue-200">{verifiedEmail}</span>
                  </p>
                  <div className="text-xs text-slate-400 mt-2 bg-black/30 px-2 py-1 rounded">Check spam folder for OTP</div>
                </div>
                
                {/* Individual OTP Input Boxes */}
                <div className="flex justify-center gap-2 mb-6">
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
                            document.getElementById(`signup-otp-${index + 1}`)?.focus();
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
                          document.getElementById(`signup-otp-${index - 1}`)?.focus();
                        }
                      }}
                      onPaste={(e) => {
                        e.preventDefault();
                        const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
                        if (pastedData.length === 6) {
                          setOtp(pastedData);
                          document.getElementById(`signup-otp-5`)?.focus();
                        }
                      }}
                      id={`signup-otp-${index}`}
                      className="w-10 h-10 bg-black/60 border-2 border-blue-700/50 text-white text-center text-lg font-bold rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 focus:bg-blue-950/30 transition-all duration-300 hover:border-blue-600/70 hover:bg-blue-950/20 shadow-lg shadow-blue-900/20"
                      autoFocus={index === 0}
                    />
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleVerifyOTP}
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
                        Verify OTP
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleSendOTP}
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

            {/* Signup Button */}
            <button
              className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white py-3 rounded-lg font-semibold shadow-lg shadow-blue-600/50 hover:shadow-xl hover:shadow-blue-600/60 transition-all duration-300 hover:scale-[1.02] active:scale-95 mb-4 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleManualSignup}
              disabled={loading || otpLoading}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Loading...
                </span>
              ) : showOTP && verifiedEmail === email ? (
                "Complete Sign Up"
              ) : (
                "Send OTP & Sign Up"
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

            {/* Google Signup Button */}
            <button
              className="w-full bg-black/50 border border-blue-700/30 text-white py-3 rounded-lg font-semibold hover:bg-blue-950/30 hover:border-blue-600/50 transition-all duration-300 flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95"
              onClick={handleGoogleSignup}
              disabled={loading}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign up with Google
            </button>

            {/* Login Link */}
            <div className="mt-6 text-center">
              <p className="text-slate-400 text-sm">
                Already have an account?{" "}
                <a href="/login" className="text-blue-400 hover:text-cyan-400 font-semibold transition-colors hover:underline">
                  Sign in
                </a>
              </p>
            </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
