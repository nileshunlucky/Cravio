"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Target, MousePointerClick, TrendingUp, ArrowRight } from "lucide-react";

// --- Modern Premium Utility Components ---
// Custom Button Component (Modern glassmorphism with magnetic hover)
type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children: React.ReactNode;
  className?: string;
  variant?: "primary" | "secondary";
};

const Button = ({ children, className = "", variant = "primary", ...props }: ButtonProps) => {
  const variants = {
    primary: `
      bg-gradient-to-r from-white to-neutral-100 text-black 
      hover:shadow-[0_0_40px_rgba(255,255,255,0.3)]
    `,
    secondary: `
      bg-white/5 backdrop-blur-md text-white border border-white/20
      hover:bg-white/10 hover:border-white/40
    `
  };

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`
        px-10 py-5 text-lg font-bold 
        backdrop-blur-sm
        transition-all duration-500 ease-out
        focus:outline-none focus:ring-4 focus:ring-white/30
        relative overflow-hidden group
        rounded-full
        ${variants[variant]}
        ${className}
      `}
      {...props}
    >
      <span className="relative z-10 flex items-center gap-2">{children}</span>
      <div className="absolute inset-0 bg-gradient-to-r from-neutral-100 to-white opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
    </motion.button>
  );
};


// Custom Card Component (Modern glassmorphism)
type CardProps = {
  children: React.ReactNode;
  className?: string;
};

const Card = ({ children, className = "" }: CardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.6 }}
    className={`
      bg-gradient-to-br from-neutral-900/50 to-neutral-950/50 
      backdrop-blur-xl border border-neutral-800/50
      p-8 rounded-3xl shadow-2xl
      hover:border-neutral-700/50 hover:shadow-[0_0_60px_rgba(255,255,255,0.05)]
      transition-all duration-700 ease-out
      group relative overflow-hidden
      ${className}
    `}
  >
    <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
    <div className="relative z-10">{children}</div>
  </motion.div>
);



// --- Main Landing Page Component ---

export default function AIVibeTradingLanding() {
  const fadeInUp = {
    initial: { opacity: 0, y: 40 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: "easeOut" }
  };

  const staggerContainer = {
    animate: {
      transition: { staggerChildren: 0.15 }
    }
  };

  const features = [
    {
      icon: TrendingUp,
      title: "AI Prediction: BUY/SELL",
      description: "Our high-accuracy AI delivers a clear directional call, setting the optimal target price and stop-loss. Confidence built on pure data.",
      step: "STEP ONE"
    },
    {
      icon: MousePointerClick,
      title: "1-Click Execution",
      description: "Execute the trade instantly. Target and Stop-Loss parameters are auto-applied by the system. Zero friction, maximal efficiency.",
      step: "STEP TWO"
    },
    {
      icon: Target,
      title: "Take Profit",
      description: "Your targets execute with precision. The system tracks market movement in real time and closes your trade at the optimal point.",
      step: "STEP THREE"
    }
  ];

  const statItems = [
    { value: "90%", label: "Predictive Accuracy", suffix: "" },
    { value: "3", label: "Signal Generation", suffix: "seconds" },
    { value: "1", label: "Trade Execution", suffix: "Click" },
  ];

  const trustIndicators = [
    "Real-time execution",
    "24/7 AI monitoring",
    "Institutional algorithms"
  ];

  return (
    <div className="min-h-screen bg-black text-white font-['Inter'] overflow-hidden relative">
      
      {/* Animated mesh gradient background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-neutral-900 via-black to-black"></div>
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
          }}
          transition={{ 
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-br from-neutral-800/20 to-transparent rounded-full blur-3xl"
        ></motion.div>
        <motion.div 
          animate={{ 
            scale: [1, 1.3, 1],
            rotate: [0, -90, 0],
          }}
          transition={{ 
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-neutral-700/20 to-transparent rounded-full blur-3xl"
        ></motion.div>
        
        {/* Grid overlay for depth */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:100px_100px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_80%)]"></div>
      </div>

      {/* HERO SECTION */}
      <section className="min-h-screen flex items-center justify-center px-4 py-32 relative z-10">
        <div className="max-w-7xl mx-auto text-center relative z-10">

          {/* Main Headline with gradient text */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="text-6xl md:text-8xl lg:text-9xl font-black mb-8 leading-[0.9] tracking-tighter"
          >
            <motion.span 
              className="inline-block bg-white bg-clip-text text-transparent"
              animate={{ backgroundPosition: ['0%', '100%', '0%'] }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              style={{ backgroundSize: '200%' }}
            >
            Predictive AI.
            </motion.span>
            <br />
            <span className="text-white">In 1 CLick.</span>
            <br />
            <span className="bg-gradient-to-r from-neutral-200 to-neutral-400 bg-clip-text text-transparent">
              Trading Simplified.
            </span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="text-xl md:text-2xl text-neutral-400 mb-12 max-w-3xl mx-auto font-light leading-relaxed"
          >
            Receive clear <span className="text-white font-semibold">BUY/SELL signals</span> with auto Target/Stop Loss setup. 
            <br className="hidden md:block" />
            The fastest path to confident execution.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16"
          >
            <Link href="/admin/dashboard">
              <Button className="tracking-wider shadow-2xl shadow-white/10 ">
                Get Started
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </motion.div>

          {/* Trust indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="flex flex-wrap justify-center gap-6 text-sm text-neutral-500"
          >
            {trustIndicators.map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-neutral-600 rounded-full"></div>
                {item}
              </div>
            ))}
          </motion.div>
          
        </div>
      </section>

      {/* CORE PROCESS SECTION */}
      <section className="py-32 px-4 relative z-10">
        <div className="max-w-7xl mx-auto">

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-20"
          >
            <h2 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter mb-6">
              <span className="bg-gradient-to-r from-white via-neutral-300 to-neutral-500 bg-clip-text text-transparent">
                The Confident
              </span>
              <br />
              <span className="text-white">Trading Process</span>
            </h2>
            <p className="text-neutral-500 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
              Three simple steps to transform market data into profitable trades
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-6 lg:gap-8"
          >
            {features.map((feature, i) => (
              <motion.div key={i} variants={fadeInUp}>
                <Card className="h-full">
                  {/* Step indicator and icon */}
                  <div className="flex items-start justify-between mb-8">
                    <motion.div 
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      className="p-4 bg-gradient-to-br from-white/10 to-white/5 rounded-2xl backdrop-blur-sm border border-white/10"
                    >
                      <feature.icon className="w-8 h-8 stroke-[1.5]" />
                    </motion.div>
                    <motion.div 
                      initial={{ opacity: 0.1 }}
                      whileInView={{ opacity: 0.2 }}
                      className="text-7xl font-black text-white"
                    >
                      {i + 1}
                    </motion.div>
                  </div>
                  
                  {/* Step label */}
                  <div className="text-xs font-bold mb-4 uppercase tracking-[0.2em] text-neutral-500">
                    {feature.step}
                  </div>
                  
                  {/* Title */}
                  <h3 className="text-2xl md:text-3xl font-bold mb-4 tracking-tight text-white leading-tight">
                    {feature.title}
                  </h3>
                  
                  {/* Description */}
                  <p className="text-neutral-400 text-base md:text-lg leading-relaxed">
                    {feature.description}
                  </p>

                  {/* Hover line accent */}
                  <motion.div 
                    className="h-1 bg-gradient-to-r from-white/50 to-transparent mt-6 rounded-full"
                    initial={{ width: 0 }}
                    whileInView={{ width: "100%" }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: i * 0.2 }}
                  ></motion.div>
                </Card>
              </motion.div>
            ))}
          </motion.div>

        </div>
      </section>

      {/* VITAL STATS SECTION */}
      <section className="py-32 px-4 relative z-10">
        <div className="max-w-6xl mx-auto">
          <Card className="bg-gradient-to-br from-neutral-900/80 via-black/80 to-neutral-950/80 backdrop-blur-2xl border-white/10 p-12 md:p-20 relative overflow-hidden">
            
            {/* Animated accent lines */}
            <motion.div 
              animate={{ x: ["-100%", "200%"] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="absolute top-0 left-0 w-1/3 h-[2px] bg-gradient-to-r from-transparent via-white/50 to-transparent"
            ></motion.div>
            <motion.div 
              animate={{ x: ["200%", "-100%"] }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              className="absolute bottom-0 right-0 w-1/3 h-[2px] bg-gradient-to-r from-transparent via-white/30 to-transparent"
            ></motion.div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-12 md:gap-16 text-center relative z-10">
              {statItems.map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: i * 0.15 }}
                  className="relative group"
                >
                  {/* Hover glow */}
                  <motion.div 
                    className="absolute inset-0 bg-white/5 rounded-3xl blur-2xl"
                    initial={{ opacity: 0 }}
                    whileHover={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                  ></motion.div>
                  
                  <div className="relative">
                    <motion.div 
                      initial={{ scale: 0.5, opacity: 0 }}
                      whileInView={{ scale: 1, opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ 
                        duration: 0.7, 
                        delay: i * 0.15, 
                        type: "spring",
                        stiffness: 100
                      }}
                      className="mb-4"
                    >
                      <div className="text-7xl md:text-8xl lg:text-9xl font-black bg-gradient-to-br from-white via-neutral-300 to-neutral-500 bg-clip-text text-transparent leading-none">
                        {stat.value}
                      </div>
                      {stat.suffix && (
                        <div className="text-2xl md:text-3xl font-bold text-neutral-600 mt-2">
                          {stat.suffix}
                        </div>
                      )}
                    </motion.div>
                    <div className="text-neutral-400 text-sm md:text-base font-semibold tracking-[0.15em] uppercase">
                      {stat.label}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>
        </div>
      </section>

      {/* SOCIAL PROOF SECTION */}
      <section className="py-24 px-4 relative z-10">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <p className="text-neutral-500 text-sm uppercase tracking-[0.2em] mb-6">
              Trusted by Professional Platforms
            </p>
            <div className="flex flex-wrap justify-center gap-8 items-center opacity-50">
              {["BINANCE", "OPENAI", "CRYPTO", "LEMON SQUEEZY"].map((market, i) => (
                <div key={i} className="text-2xl font-black tracking-tighter text-white/30">
                  {market}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* FOOTER CTA */}
      <section id="start-now" className="py-32 px-4 relative z-10">
        <div className="max-w-5xl mx-auto text-center relative">
          
          {/* Massive glow effect behind CTA */}
          <div className="absolute inset-0 bg-gradient-to-r from-white/5 via-white/10 to-white/5 blur-3xl rounded-full scale-150 -z-10"></div>
          
          <div className="relative z-10">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <h2 className="text-5xl md:text-7xl lg:text-8xl font-black mb-8 tracking-tighter leading-[0.95]">
                <span className="bg-gradient-to-r from-white via-neutral-200 to-neutral-400 bg-clip-text text-transparent">
                  Trade with Confidence,
                </span>
                <br />
                <span className="text-white">Not Guesswork.</span>
              </h2>

              <p className="text-xl md:text-2xl text-neutral-400 mb-12 max-w-2xl mx-auto font-light leading-relaxed">
                Experience the next generation of AI-driven execution. 
                <br className="hidden md:block" />
                Your competitive edge starts now.
              </p>

              <Link href="/admin/dashboard">
                <Button className="px-14 py-7 text-xl font-bold shadow-[0_0_80px_rgba(255,255,255,0.15)]">
                  Claim Your Access
                  <ArrowRight className="w-6 h-6" />
                </Button>
              </Link>

              <motion.p 
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="mt-8 text-sm text-neutral-600"
              >
                Join 10,000+ traders already using our AI signals
              </motion.p>
            </motion.div>
          </div>
        </div>
      </section>


    </div>
  );
}