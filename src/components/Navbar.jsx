// src/components/Navbar.jsx
import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogoClick = (e) => {
    e.preventDefault();
    
    // If we're not on the home page, navigate there first
    if (location.pathname !== "/") {
      navigate("/");
      // Wait for navigation, then scroll to top
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }, 100);
    } else {
      // We're already on home page, just scroll to top
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleAnchorClick = (e, anchorId) => {
    e.preventDefault();
    
    // If we're not on the home page, navigate there first
    if (location.pathname !== "/") {
      navigate("/");
      // Wait for navigation, then scroll
      setTimeout(() => {
        scrollToSection(anchorId);
      }, 200);
    } else {
      // We're already on home page, just scroll
      scrollToSection(anchorId);
    }
  };

  const scrollToSection = (anchorId) => {
    const element = document.getElementById(anchorId);
    if (element) {
      const navbarHeight = 80; // Approximate navbar height
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
      const offsetPosition = elementPosition - navbarHeight;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 w-full bg-black/90 backdrop-blur-xl border-b border-blue-700/30 z-50 shadow-lg shadow-blue-900/20">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <a href="/" onClick={handleLogoClick} className="flex items-center gap-3 group cursor-pointer">
          <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg p-2 font-bold shadow-lg shadow-blue-600/50 group-hover:shadow-xl group-hover:shadow-blue-600/60 transition-all duration-300 group-hover:scale-110">
            QS
          </div>
          <span className="text-lg font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent group-hover:from-blue-300 group-hover:to-cyan-300 transition-all duration-300">
            QuickShop
          </span>
        </a>

        <div className="hidden md:flex items-center gap-6">
          <a 
            href="#insights" 
            onClick={(e) => handleAnchorClick(e, "insights")}
            className="text-slate-300 hover:text-blue-400 transition-all duration-300 font-medium hover:scale-110 cursor-pointer"
          >
            Insights
          </a>
          <a 
            href="#community" 
            onClick={(e) => handleAnchorClick(e, "community")}
            className="text-slate-300 hover:text-blue-400 transition-all duration-300 font-medium hover:scale-110 cursor-pointer"
          >
            Community
          </a>
          <a 
            href="#support" 
            onClick={(e) => handleAnchorClick(e, "support")}
            className="text-slate-300 hover:text-blue-400 transition-all duration-300 font-medium hover:scale-110 cursor-pointer"
          >
            Support
          </a>

          <Link 
            to="/login" 
            className="px-4 py-2 rounded-lg border border-blue-700/50 text-blue-400 hover:bg-blue-950/30 hover:border-blue-600/50 transition-all duration-300 font-medium hover:scale-105 active:scale-95"
          >
            Login
          </Link>
          <Link 
            to="/signup" 
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-600/50 hover:shadow-xl hover:shadow-blue-600/60 transition-all duration-300 hover:scale-105 active:scale-95 font-medium"
          >
            Sign up
          </Link>
        </div>

        <div className="md:hidden">
          <Link 
            to="/signup" 
            className="px-3 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 text-white text-sm shadow-lg shadow-blue-600/50 font-medium hover:scale-105 transition-all duration-300"
          >
            Sign up
          </Link>
        </div>
      </div>
    </nav>
  );
}