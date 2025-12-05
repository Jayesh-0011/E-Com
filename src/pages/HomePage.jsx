// src/pages/HomePage.jsx
import React, { useEffect, useRef, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function HomePage() {
  const handleAnchorClick = (e, anchorId) => {
    e.preventDefault();
    const navbarHeight = 80; // Approximate navbar height
    const element = document.getElementById(anchorId);
    if (element) {
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
      const offsetPosition = elementPosition - navbarHeight;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
  };

  return (
    <div className="min-h-screen bg-black text-white antialiased relative overflow-hidden">
      {/* Animated dark blue background */}
      <div className="fixed inset-0 bg-gradient-to-br from-black via-blue-950 to-black"></div>
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(30,58,138,0.3),transparent)] animate-pulse"></div>
      <div
        className="fixed inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(30,58,138,0.2),transparent)] animate-pulse"
        style={{ animationDelay: "1s" }}
      ></div>

      {/* Animated grid pattern */}
      <div
        className="fixed inset-0 opacity-10"
        style={{
          backgroundImage:
            "linear-gradient(rgba(59,130,246,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.1) 1px, transparent 1px)",
          backgroundSize: "50px 50px",
          animation: "gridMove 20s linear infinite",
        }}
      ></div>

      <style>{`
        html {
          scroll-behavior: smooth;
        }
        @keyframes gridMove {
          0% { transform: translate(0, 0); }
          100% { transform: translate(50px, 50px); }
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
        @keyframes fadeInLeft {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes fadeInRight {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        .animate-fadeInUp {
          animation: fadeInUp 0.8s ease-out forwards;
        }
        .animate-fadeInLeft {
          animation: fadeInLeft 0.8s ease-out forwards;
        }
        .animate-fadeInRight {
          animation: fadeInRight 0.8s ease-out forwards;
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>

      <div className="relative z-10">
        <Navbar />

        {/* HERO */}
        <header className="relative overflow-hidden pt-24">
          <div className="relative max-w-7xl mx-auto px-6 py-20 lg:py-28">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
              <div className="relative z-10">
                <div className="inline-block mb-4 px-4 py-1 bg-blue-900/30 border border-blue-700/50 rounded-full text-blue-300 text-sm font-medium backdrop-blur-sm">
                  🚀 Your Neighborhood, Delivered
                </div>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight bg-gradient-to-r from-white via-blue-200 to-cyan-300 bg-clip-text text-transparent">
                  QuickShop
                </h1>
                <p className="mt-6 text-lg sm:text-xl text-slate-300 max-w-xl leading-relaxed">
                  We bring trusted local stores online — fast checkout, simple
                  dashboards for merchants, and same-day pickup or delivery.
                </p>

                <div className="mt-8 flex flex-col sm:flex-row gap-4">
                  <a
                    href="#insights"
                    onClick={(e) => handleAnchorClick(e, "insights")}
                    className="group inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 text-white px-6 py-3 text-sm font-semibold shadow-lg shadow-blue-600/50 hover:shadow-xl hover:shadow-blue-600/60 transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    Explore Insights
                    <svg
                      className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform duration-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                      />
                    </svg>
                  </a>
                  <a
                    href="#community"
                    onClick={(e) => handleAnchorClick(e, "community")}
                    className="inline-flex items-center justify-center rounded-lg border-2 border-blue-700/50 bg-blue-900/20 backdrop-blur-sm px-6 py-3 text-sm font-semibold text-blue-300 hover:bg-blue-900/30 hover:border-blue-600 transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    Community Stories
                  </a>
                </div>

                <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <StatCard title="120+" subtitle="Local stores" />
                  <StatCard title="4.8/5" subtitle="Average rating" />
                  <StatCard title="5k+" subtitle="Orders / month" />
                  <StatCard title="12" subtitle="Cities served" />
                </div>
              </div>

              <div className="relative z-10">
                <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-blue-700/30 bg-gradient-to-br from-black/80 to-blue-950/80 backdrop-blur-sm animate-float">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-blue-800/20"></div>
                  <img
                    src="https://plus.unsplash.com/premium_photo-1661368873079-5ccd41284d1d?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                    alt="Local store front"
                    className="w-full h-80 object-cover opacity-90 transition-transform duration-700 hover:scale-110"
                  />
                  <div className="relative p-6 bg-gradient-to-t from-black/95 to-transparent">
                    <h3 className="text-xl font-semibold text-white">
                      Small business friendly
                    </h3>
                    <p className="mt-2 text-slate-300">
                      Setup in minutes, phone-friendly dashboard, and optional
                      onboarding support — keep serving the community, we handle the
                      tech.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* INSIGHTS / FEATURES */}
        <main className="relative z-10 max-w-7xl mx-auto px-6 py-16">
          <section id="insights">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                INSIGHTS
              </h2>
              <p className="mt-4 text-slate-400 max-w-2xl mx-auto text-lg">
                Data and product choices that make QuickShop great for merchants and
                shoppers alike.
              </p>
            </div>

            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
              <FeatureCard
                title="Local-first discovery"
                desc="Shoppers prefer local stores for speed and trust. We help stores show up in local searches and maps."
                icon="🗺"
              />
              <FeatureCard
                title="Simple dashboard"
                desc="Add inventory, mark items as available for pickup, and track monthly orders without technical overhead."
                icon="📋"
              />
              <FeatureCard
                title="Payments & trust"
                desc="Secure payouts, multiple payment methods, and built-in refund flows to make operations frictionless."
                icon="💳"
              />
            </div>
          </section>

          {/* HOW IT WORKS */}
          <section className="mt-20 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-900/20 to-blue-800/20 rounded-3xl blur-3xl animate-pulse"></div>
            <div className="relative bg-gradient-to-br from-black/90 to-blue-950/90 backdrop-blur-xl rounded-2xl p-8 lg:p-12 border border-blue-700/30 shadow-2xl shadow-blue-900/20">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div>
                  <h3 className="text-3xl font-bold text-white mb-6">
                    How QuickShop works
                  </h3>
                  <ol className="space-y-4">
                    <li className="flex items-start gap-4 group">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-blue-500 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-600/50 group-hover:scale-110 transition-transform duration-300">
                        1
                      </div>
                      <p className="text-slate-300 text-lg pt-1 group-hover:text-white transition-colors">
                        Sign up & claim your store URL.
                      </p>
                    </li>
                    <li className="flex items-start gap-4 group">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-blue-500 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-600/50 group-hover:scale-110 transition-transform duration-300">
                        2
                      </div>
                      <p className="text-slate-300 text-lg pt-1 group-hover:text-white transition-colors">
                        Add a short description, timings, and images.
                      </p>
                    </li>
                    <li className="flex items-start gap-4 group">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-blue-500 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-600/50 group-hover:scale-110 transition-transform duration-300">
                        3
                      </div>
                      <p className="text-slate-300 text-lg pt-1 group-hover:text-white transition-colors">
                        Start receiving orders & choose pickup or local delivery.
                      </p>
                    </li>
                  </ol>
                </div>

                <div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <MiniCard title="Setup in minutes" text="Quick user registration" />
                    <MiniCard
                      title="Low fees"
                      text="Transparent pricing, daily payouts."
                    />
                    <MiniCard
                      title="Delivery partners"
                      text="Connect to local couriers."
                    />
                    <MiniCard
                      title="Variety of products"
                      text="Order varieties of local products"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* COMMUNITY / TESTIMONIALS */}
          <section id="community" className="mt-20">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                COMMUNITY STORIES 
              </h2>
              <p className="mt-4 text-slate-400 text-lg">What our merchants say</p>
            </div>

            <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
              <Testimonial
                name="Priya — Café Owner"
                text="QuickShop helped us receive online orders without changing our workflow. Delivery covered 30% of weekday revenue within 2 months."
              />
              <Testimonial
                name="Rakesh — Grocer"
                text="Onboarding was simple and staff learned the dashboard quickly. Our weekly pickup orders doubled."
              />
            </div>
          </section>

          {/* FAQ / CTA */}
          <section className="mt-20 grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <div className="space-y-4">
              <h3 className="text-3xl font-bold text-white mb-6">
                Frequently asked questions
              </h3>
              <Accordion
                question="How long does onboarding take?"
                answer="Most stores are live in under 5 minutes with our guided forms."
              />
              <Accordion
                question="Which payments do you support?"
                answer="We support major UPI, card payments, and cash on delivery where available."
              />
              <Accordion
                question="Can I use my own delivery partners?"
                answer="Yes — you can connect integration or use our local courier partners."
              />
            </div>
          </section>
        </main>

          {/* SUPPORT */}
          <section
            id="support"
            className="mt-24 flex flex-col items-center text-center px-6"
          >
            <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              SUPPORT CONTACTS
            </h2>
            <p className="mt-4 text-slate-400 max-w-xl text-lg">
              Reach us anytime — we're here to help
            </p>

            <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl w-full">
              <SupportCard
                label="Customer Support"
                phone="+91 9421886780"
              />
              <SupportCard
                label="Retailer Support"
                phone="+91 9317523443"
              />
              <SupportCard
                label="Wholesaler Assistance"
                phone="+91 9315923170"
              />
              <SupportCard
                label="Delivery Partner Line"
                phone="+91 9422478877"
              />
            </div>
        </section>

        <Footer />
      </div>
    </div>
  );
}

/* Small reusable components */

function StatCard({ title, subtitle, delay }) {
  const style = delay ? { animationDelay: delay } : undefined;

  return (
    <div
      className="bg-gradient-to-br from-black/80 to-blue-950/80 backdrop-blur-sm border border-blue-700/30 rounded-lg p-4 shadow-lg shadow-blue-900/20 hover:shadow-xl hover:shadow-blue-900/30 transition-all duration-500 hover:scale-110 hover:border-blue-600/50 group animate-fadeInUp"
      style={style}
    >
      <div className="text-xl font-bold text-white group-hover:text-blue-300 transition-colors">
        {title}
      </div>
      <div className="text-sm text-blue-400 mt-1 group-hover:text-blue-300 transition-colors">
        {subtitle}
      </div>
    </div>
  );
}

function FeatureCard({ title, desc, icon }) {
  return (
    <div className="group relative bg-gradient-to-br from-black/90 to-blue-950/90 backdrop-blur-xl border border-blue-700/30 rounded-xl p-6 shadow-xl shadow-blue-900/20 hover:shadow-2xl hover:shadow-blue-900/40 transition-all duration-500 hover:scale-105 hover:border-blue-600/50">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/10 to-blue-800/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      <div className="relative text-4xl mb-4 transform group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>
      <h4 className="relative text-xl font-semibold text-white mb-2 group-hover:text-blue-300 transition-colors">
        {title}
      </h4>
      <p className="relative text-slate-400 leading-relaxed group-hover:text-slate-300 transition-colors">
        {desc}
      </p>
    </div>
  );
}

function MiniCard({ title, text }) {
  return (
    <div className="bg-gradient-to-br from-black/70 to-blue-950/70 backdrop-blur-sm border border-blue-700/30 rounded-lg p-4 hover:border-blue-600/50 hover:bg-blue-950/50 transition-all duration-300 group">
      <h5 className="font-semibold text-white group-hover:text-blue-300 transition-colors">
        {title}
      </h5>
      <p className="text-sm text-slate-400 mt-1 group-hover:text-slate-300 transition-colors">
        {text}
      </p>
    </div>
  );
}

function Testimonial({ name, text }) {
  return (
    <div className="bg-gradient-to-br from-black/90 to-blue-950/90 backdrop-blur-xl border border-blue-700/30 rounded-xl p-6 shadow-xl shadow-blue-900/20 hover:shadow-2xl hover:shadow-blue-900/40 transition-all duration-500 hover:scale-105 hover:border-blue-600/50">
      <div className="flex items-center gap-4">
        <div className="rounded-full bg-gradient-to-br from-blue-600 to-blue-500 w-12 h-12 flex items-center justify-center text-xl shadow-lg shadow-blue-600/50 hover:scale-110 transition-transform duration-300">
          🙂
        </div>
        <div>
          <div className="font-semibold text-white">{name}</div>
          <div className="text-sm text-blue-400">Verified merchant</div>
        </div>
      </div>
      <p className="mt-4 text-slate-300 leading-relaxed">"{text}"</p>
    </div>
  );
}

function Accordion({ question, answer }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="bg-gradient-to-br from-black/80 to-blue-950/80 backdrop-blur-xl border border-blue-700/30 rounded-lg p-4 shadow-lg hover:border-blue-600/50 transition-all duration-300 group">
      <button
        className="w-full flex justify-between items-center text-left"
        onClick={() => setOpen((s) => !s)}
      >
        <div>
          <div className="font-semibold text-white group-hover:text-blue-300 transition-colors">
            {question}
          </div>
          <div className="text-sm text-slate-500 mt-1">
            {open ? "Click to collapse" : "Click to expand"}
          </div>
        </div>
        <div
          className={`text-2xl text-blue-400 font-bold transform transition-transform duration-300 ${
            open ? "rotate-180" : ""
          }`}
        >
          {open ? "−" : "+"}
        </div>
      </button>

      {open && (
        <div className="mt-3 text-slate-300 leading-relaxed animate-fadeInUp">
          {answer}
        </div>
      )}
    </div>
  );
}

function SupportCard({ label, phone }) {
  return (
    <div className="bg-gradient-to-br from-black/90 to-blue-950/90 backdrop-blur-xl border border-blue-700/30 rounded-xl p-6 shadow-xl shadow-blue-900/20 hover:shadow-2xl hover:shadow-blue-900/40 transition-all duration-500 hover:scale-110 hover:border-blue-600/50 flex flex-col items-center group">
      <h4 className="font-semibold text-lg text-white group-hover:text-blue-300 transition-colors">
        {label}
      </h4>
      <p className="mt-3 text-blue-400 font-medium text-lg group-hover:text-cyan-400 transition-colors">
        <a href={`tel:${phone}`} className="hover:underline">
          {phone}
        </a>
      </p>
    </div>
  );
}
