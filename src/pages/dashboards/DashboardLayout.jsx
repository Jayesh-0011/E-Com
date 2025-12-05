import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthProvider";
import { useToast } from "../../context/ToastContext";
import "./dashboard.css";
import { useContext, useState } from "react";


export default function DashboardLayout({
  user = { name: "Demo", role: "customer" },
  children
}) {
  const { logout, user: authUser, login, token } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();
  const [showProfile, setShowProfile] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    username: "",
    phone: "",
    countryCode: "+91",
    email: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    pincode: "",
    state: "",
    password: ""
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");

  const nav = {
    customer: [
      { to: "/customer/home", label: "Home", icon: "🏠" },
      { to: "/customer/orders", label: "Orders", icon: "📦" }
    ],
    retailer: [
      { to: "/retailer/home", label: "Home", icon: "🏠" },
      { to: "/retailer/inventory", label: "Inventory", icon: "📋" },
      { to: "/retailer/wholesaler-orders", label: "Wholesaler Orders", icon: "🚚" },
      { to: "/retailer/customer-orders", label: "Customer Orders", icon: "🛒" }
    ],
    wholesaler: [
      { to: "/wholesaler/home", label: "Home", icon: "🏠" },
      { to: "/wholesaler/transactions", label: "Retailer Orders", icon: "📦" }
    ],
    delivery: [
      { to: "/delivery/home", label: "Active Orders", icon: "📦" },
      { to: "/delivery/past-orders", label: "Past Orders", icon: "📋" }
    ]
  };

  // Theme colors for each role
  const themeColors = {
    customer: {
      primary: "blue",
      gradientFrom: "rgb(37, 99, 235)",
      gradientTo: "rgb(59, 130, 246)",
      bgGradient: "from-black via-blue-950 to-black",
      accent: "rgb(37, 99, 235)",
      accentLight: "rgb(59, 130, 246)",
      accentDark: "rgb(29, 78, 216)",
      accentRgba: "rgba(37, 99, 235, 0.3)",
      accentRgbaLight: "rgba(37, 99, 235, 0.1)"
    },
    retailer: {
      primary: "emerald",
      gradientFrom: "rgb(5, 150, 105)",
      gradientTo: "rgb(16, 185, 129)",
      bgGradient: "from-black via-emerald-950 to-black",
      accent: "rgb(5, 150, 105)",
      accentLight: "rgb(16, 185, 129)",
      accentDark: "rgb(4, 120, 87)",
      accentRgba: "rgba(5, 150, 105, 0.3)",
      accentRgbaLight: "rgba(5, 150, 105, 0.1)"
    },
    wholesaler: {
      primary: "purple",
      gradientFrom: "rgb(147, 51, 234)",
      gradientTo: "rgb(168, 85, 247)",
      bgGradient: "from-black via-purple-950 to-black",
      accent: "rgb(147, 51, 234)",
      accentLight: "rgb(168, 85, 247)",
      accentDark: "rgb(126, 34, 206)",
      accentRgba: "rgba(147, 51, 234, 0.3)",
      accentRgbaLight: "rgba(147, 51, 234, 0.1)"
    },
    delivery: {
      primary: "orange",
      gradientFrom: "rgb(249, 115, 22)",
      gradientTo: "rgb(251, 146, 60)",
      bgGradient: "from-black via-orange-950 to-black",
      accent: "rgb(249, 115, 22)",
      accentLight: "rgb(251, 146, 60)",
      accentDark: "rgb(234, 88, 12)",
      accentRgba: "rgba(249, 115, 22, 0.3)",
      accentRgbaLight: "rgba(249, 115, 22, 0.1)"
    }
  };

  const theme = themeColors[user.role] || themeColors.customer;

  const handleLogoClick = (e) => {
    e.preventDefault();
    navigate("/");
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 100);
  };

  // Initialize edit form with current user data
  const openEditModal = () => {
    // Extract country code from phone number
    let countryCode = "+91"; // Default
    let phoneNumber = "";
    
    if (authUser?.phone) {
      const phone = authUser.phone;
      // Try to match common country codes
      const countryCodes = ["+971", "+91", "+44", "+86", "+81", "+49", "+33", "+39", "+7", "+61", "+55", "+52", "+82", "+65", "+60", "+66", "+84", "+62", "+63", "+1"];
      
      for (const code of countryCodes) {
        if (phone.startsWith(code)) {
          countryCode = code;
          phoneNumber = phone.substring(code.length);
          break;
        }
      }
      
      // If no country code found, assume it's just the number
      if (!phoneNumber && phone) {
        phoneNumber = phone;
      }
    }
    
    // Extract address fields from address object
    const address = authUser?.address || {};
    setEditForm({
      username: authUser?.name || "",
      phone: phoneNumber,
      countryCode: countryCode,
      email: authUser?.email || "",
      addressLine1: address.addressLine1 || "",
      addressLine2: address.addressLine2 || "",
      city: address.city || "",
      pincode: address.pincode || "",
      state: address.state || "",
      password: ""
    });
    setEditError("");
    setShowEditModal(true);
    setShowProfile(false);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    setEditError("");

    try {
      const res = await fetch("http://localhost:5000/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          username: editForm.username,
          phone: (editForm.countryCode || "+91") + (editForm.phone || ""), // Prepend country code
          email: editForm.email,
          addressLine1: editForm.addressLine1 || undefined,
          addressLine2: editForm.addressLine2 || undefined,
          city: editForm.city || undefined,
          pincode: editForm.pincode || undefined,
          state: editForm.state || undefined,
          password: editForm.password || undefined // Only send if provided
        })
      });

      const data = await res.json();

      if (data.success && data.user) {
        // Update user in AuthContext and localStorage
        login(data.user, token);
        setShowEditModal(false);
        success("Profile updated successfully!");
      } else {
        const errorMsg = data.error || "Failed to update profile";
        setEditError(errorMsg);
        error(errorMsg);
      }
    } catch (err) {
      console.error("Error updating profile:", err);
      setEditError("Server error. Please try again.");
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br ${theme.bgGradient} text-white relative overflow-hidden`}>
      {/* Animated background effects */}
      <div className={`fixed inset-0 bg-[radial-gradient(circle_at_20%_30%,${theme.accentRgba},transparent)] animate-pulse`}></div>
      <div className={`fixed inset-0 bg-[radial-gradient(circle_at_80%_70%,${theme.accentRgba},transparent)] animate-pulse`} style={{ animationDelay: '1s' }}></div>
      
      {/* Animated grid pattern */}
      <div className="fixed inset-0 opacity-10" style={{
        backgroundImage: `linear-gradient(${theme.accentRgbaLight} 1px, transparent 1px), linear-gradient(90deg, ${theme.accentRgbaLight} 1px, transparent 1px)`,
        backgroundSize: '50px 50px',
        animation: 'gridMove 20s linear infinite'
      }}></div>

      <style>{`
        @keyframes gridMove {
          0% { transform: translate(0, 0); }
          100% { transform: translate(50px, 50px); }
        }
      `}</style>

      {/* 🔹 TOP BAR */}
      <div className="fixed top-0 left-0 right-0 bg-black/80 backdrop-blur-xl flex justify-between items-center px-8 py-4 z-50" style={{ borderBottom: `1px solid ${theme.accentRgba}`, boxShadow: `0 4px 6px -1px ${theme.accentRgbaLight}` }}>
        <a href="/" onClick={handleLogoClick} className="flex items-center gap-3 group cursor-pointer">
          <div className="text-white rounded-lg p-2 font-bold transition-all duration-300 group-hover:scale-110" style={{ background: `linear-gradient(to right, ${theme.gradientFrom}, ${theme.gradientTo})`, boxShadow: `0 4px 6px -1px ${theme.accentRgba}` }}>
            QS
          </div>
          <span className="text-lg font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent group-hover:from-blue-300 group-hover:to-cyan-300 transition-all duration-300">
            QuickShop
          </span>
        </a>

        <div className="relative">
          <button
            className="text-white font-semibold px-4 py-2 rounded-lg transition-all duration-300 hover:scale-105"
            style={{ background: `linear-gradient(to right, ${theme.gradientFrom}, ${theme.gradientTo})`, boxShadow: `0 4px 6px -1px ${theme.accentRgba}` }}
            onClick={() => setShowProfile(!showProfile)}
          >
            Profile
          </button>

          {/* Popup */}
          {showProfile && (
            <div className="absolute top-14 right-0 bg-black/90 backdrop-blur-xl rounded-xl p-4 w-72" style={{ border: `1px solid ${theme.accentRgba}`, boxShadow: `0 20px 25px -5px ${theme.accentRgbaLight}`, zIndex: 9999 }}>
              <div className="font-bold text-lg text-white">{user?.name || authUser?.name || "User"}</div>
              {authUser?.address && (
                <div className="text-sm mt-1 text-slate-400">
                  📍 {authUser.address.addressLine1}
                  {authUser.address.addressLine2 && `, ${authUser.address.addressLine2}`}
                  <br />
                  {authUser.address.city}, {authUser.address.pincode}
                  <br />
                  {authUser.address.state}
                </div>
              )}
              {authUser?.email && (
                <div className="text-sm mt-1 text-slate-400">📩 {authUser.email}</div>
              )}
              {authUser?.phone && (
                <div className="text-sm mt-1 mb-4 text-slate-400">📞 {authUser.phone}</div>
              )}
              {!authUser?.phone && !authUser?.email && !authUser?.address && (
                <div className="text-sm mt-1 mb-4 text-slate-400">No additional information available</div>
              )}

              <div className="flex gap-2 mt-4">
                <button
                  onClick={openEditModal}
                  className="flex-1 py-2 rounded-lg text-white font-semibold transition-all duration-300 hover:scale-105"
                  style={{ 
                    background: `linear-gradient(to right, ${theme.gradientFrom}, ${theme.gradientTo})`, 
                    boxShadow: `0 4px 6px -1px ${theme.accentRgba}` 
                  }}
                >
                  Edit Profile
                </button>
                <button
                  onClick={logout}
                  className="flex-1 py-2 rounded-lg text-white font-semibold transition-all duration-300 hover:scale-105"
                  style={{ 
                    background: "rgba(239, 68, 68, 0.8)", 
                    boxShadow: "0 4px 6px -1px rgba(239, 68, 68, 0.3)" 
                  }}
                >
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 🔹 Layout Grid */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 grid grid-cols-[280px_1fr] gap-6 pb-8" style={{ marginTop: '100px' }}>

        {/* Sidebar */}
        <aside>
          <div className="bg-black/80 backdrop-blur-xl rounded-xl p-4" style={{ border: `1px solid ${theme.accentRgba}`, boxShadow: `0 20px 25px -5px ${theme.accentRgbaLight}` }}>
            
            {/* Profile card */}
            <div className="flex items-center gap-3 p-3 rounded-lg mb-4" style={{ background: `linear-gradient(to bottom right, ${theme.accentRgbaLight}, ${theme.accentRgbaLight.replace('0.1', '0.05')})`, border: `1px solid ${theme.accentRgba}` }}>
              <div className="w-12 h-12 text-white rounded-full flex items-center justify-center font-bold text-lg" style={{ background: `linear-gradient(to right, ${theme.gradientFrom}, ${theme.gradientTo})`, boxShadow: `0 4px 6px -1px ${theme.accentRgba}` }}>
                {(user.name || authUser?.name)?.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="font-semibold text-white">{user.name || authUser?.name}</div>
                <div className="text-sm capitalize" style={{ color: theme.accentLight }}>{user.role}</div>
              </div>
            </div>

            {/* Nav Links */}
            <nav className="mt-2 space-y-2">
              {nav[user.role]?.map((item) => {
                const isActive = location.pathname === item.to;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-300"
                    style={{
                      background: isActive ? `linear-gradient(to right, ${theme.gradientFrom}, ${theme.gradientTo})` : 'transparent',
                      color: isActive ? 'white' : 'rgb(203, 213, 225)',
                      boxShadow: isActive ? `0 4px 6px -1px ${theme.accentRgba}` : 'none',
                      border: isActive ? 'none' : `1px solid transparent`
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = theme.accentRgbaLight;
                        e.currentTarget.style.color = theme.accentLight;
                        e.currentTarget.style.borderColor = theme.accentRgba;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = 'rgb(203, 213, 225)';
                        e.currentTarget.style.borderColor = 'transparent';
                      }
                    }}
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main>
          <div className="bg-black/80 backdrop-blur-xl p-6 rounded-xl min-h-[75vh]" style={{ border: `1px solid ${theme.accentRgba}`, boxShadow: `0 20px 25px -5px ${theme.accentRgbaLight}` }}>
            {children}
          </div>
        </main>
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[10000] flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setShowEditModal(false)}
        >
          <div 
            className="bg-black/90 backdrop-blur-xl rounded-2xl w-full max-w-md border my-8"
            style={{ 
              borderColor: theme.accentRgba,
              boxShadow: `0 20px 25px -5px ${theme.accentRgbaLight}`,
              maxHeight: "90vh",
              display: "flex",
              flexDirection: "column"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header - Fixed */}
            <div className="flex justify-between items-center p-6 pb-4 border-b flex-shrink-0" style={{ borderColor: theme.accentRgba }}>
              <h3 className="text-2xl font-bold text-white">Edit Profile</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-white transition-colors"
                style={{ fontSize: 24, lineHeight: 1 }}
              >
                ×
              </button>
            </div>

            {/* Scrollable Content */}
            <form onSubmit={handleEditSubmit} className="flex flex-col flex-1" style={{ overflow: "hidden", minHeight: 0 }}>
              <div className="overflow-y-auto flex-1 space-y-4 p-6" style={{ maxHeight: "calc(90vh - 200px)" }}>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Username</label>
                <input
                  type="text"
                  value={editForm.username}
                  onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                  required
                  className="w-full bg-black/50 border border-blue-700/30 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all"
                  style={{ borderColor: theme.accentRgba }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  required
                  className="w-full bg-black/50 border border-blue-700/30 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all"
                  style={{ borderColor: theme.accentRgba }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Phone Number</label>
                <div className="flex gap-2">
                  <select
                    value={editForm.countryCode}
                    onChange={(e) => setEditForm({ ...editForm, countryCode: e.target.value })}
                    className="bg-black/50 border border-blue-700/30 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all"
                    style={{ borderColor: theme.accentRgba, minWidth: "100px" }}
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
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value.replace(/\D/g, "") })}
                    required
                    className="flex-1 bg-black/50 border border-blue-700/30 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all"
                    style={{ borderColor: theme.accentRgba }}
                  />
                </div>
                <div className="text-xs text-slate-500 mt-1">Phone: {editForm.countryCode}{editForm.phone || "XXXXXXXXXX"}</div>
              </div>

              {authUser?.role !== "delivery" && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Address Line 1 *</label>
                    <input
                      type="text"
                      value={editForm.addressLine1}
                      onChange={(e) => setEditForm({ ...editForm, addressLine1: e.target.value })}
                      className="w-full bg-black/50 border border-blue-700/30 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all"
                      style={{ borderColor: theme.accentRgba }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Address Line 2 (Optional)</label>
                    <input
                      type="text"
                      value={editForm.addressLine2}
                      onChange={(e) => setEditForm({ ...editForm, addressLine2: e.target.value })}
                      className="w-full bg-black/50 border border-blue-700/30 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all"
                      style={{ borderColor: theme.accentRgba }}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">City *</label>
                      <input
                        type="text"
                        value={editForm.city}
                        onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                        className="w-full bg-black/50 border border-blue-700/30 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all"
                        style={{ borderColor: theme.accentRgba }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Pincode *</label>
                      <input
                        type="text"
                        value={editForm.pincode}
                        onChange={(e) => setEditForm({ ...editForm, pincode: e.target.value.replace(/\D/g, "") })}
                        maxLength={6}
                        className="w-full bg-black/50 border border-blue-700/30 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all"
                        style={{ borderColor: theme.accentRgba }}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">State *</label>
                    <input
                      type="text"
                      value={editForm.state}
                      onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
                      className="w-full bg-black/50 border border-blue-700/30 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all"
                      style={{ borderColor: theme.accentRgba }}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">New Password (leave blank to keep current)</label>
                <input
                  type="password"
                  value={editForm.password}
                  onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                  placeholder="Enter new password"
                  className="w-full bg-black/50 border border-blue-700/30 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all"
                  style={{ borderColor: theme.accentRgba }}
                />
              </div>

                {editError && (
                  <div className="p-3 bg-red-900/30 border border-red-700/50 rounded-lg text-red-300 text-sm">
                    {editError}
                  </div>
                )}
              </div>

              {/* Footer with buttons - Fixed */}
              <div className="p-6 pt-4 border-t flex-shrink-0" style={{ borderColor: theme.accentRgba }}>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 py-2.5 rounded-lg text-white font-semibold transition-all duration-300 hover:scale-105"
                    style={{ 
                      background: "rgba(148, 163, 184, 0.2)",
                      border: "1px solid rgba(148, 163, 184, 0.3)"
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={editLoading}
                    className="flex-1 py-2.5 rounded-lg text-white font-semibold transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ 
                      background: `linear-gradient(to right, ${theme.gradientFrom}, ${theme.gradientTo})`, 
                      boxShadow: `0 4px 6px -1px ${theme.accentRgba}` 
                    }}
                  >
                    {editLoading ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}