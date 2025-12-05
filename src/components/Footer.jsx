// src/components/Footer.jsx
import React from "react";

export default function Footer() {
  return (
    <footer className="bg-gradient-to-br from-black to-blue-950 border-t border-blue-700/30 mt-16">
      <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col md:flex-row justify-between gap-8">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg p-2 font-bold shadow-lg shadow-blue-600/50 hover:scale-110 transition-transform duration-300">
              QS
            </div>
            <div className="font-bold text-lg bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              QuickShop
            </div>
          </div>
          <p className="text-sm text-slate-400 mt-3">
            © {new Date().getFullYear()} QuickShop — building stronger neighbourhoods.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6 text-sm">
          <div>
            <div className="font-semibold text-white mb-3">Product</div>
            <ul className="space-y-2">
              <li>
                <a href="#insights" className="text-slate-400 hover:text-blue-400 transition-all duration-300 hover:translate-x-1 inline-block">
                  How it works
                </a>
              </li>
              <li>
                <a href="#support" className="text-slate-400 hover:text-blue-400 transition-all duration-300 hover:translate-x-1 inline-block">
                  Pricing
                </a>
              </li>
              <li>
                <a href="#community" className="text-slate-400 hover:text-blue-400 transition-all duration-300 hover:translate-x-1 inline-block">
                  Docs
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}