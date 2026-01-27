"use client";
import React, { useState, useEffect } from 'react';
import Link from "next/link";
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Target, Shield, BarChart3, Brain, Upload, ArrowUpRight } from 'lucide-react';

const Page = () => {
  const [athletes, setAthletes] = useState<number | null>(null);
  const [showLogo, setShowLogo] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const res = await fetch(`https://cravio-ai.onrender.com/users-emails`);
        if (!res.ok) return;
        const data = await res.json();
        setAthletes(data.length);
      } catch (err) {
        console.error('Failed to fetch user data:', err);
      }
    };
    fetchUserData();

    const timer = setTimeout(() => setShowLogo(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  const features = [
    { icon: <Upload className="w-5 h-5" />, title: "Upload Chart", description: "Simply upload your trading chart screenshot" },
    { icon: <Brain className="w-5 h-5" />, title: "AI Analysis", description: "Advanced AI analyzes patterns instantly" },
    { icon: <TrendingUp className="w-5 h-5" />, title: "BUY/SELL Signal", description: "Get clear actionable trading signals" },
    { icon: <Shield className="w-5 h-5" />, title: "Stop Loss", description: "Precise risk management levels" },
    { icon: <Target className="w-5 h-5" />, title: "Target Price", description: "Multiple profit target recommendations" },
    { icon: <BarChart3 className="w-5 h-5" />, title: "Win Probability", description: "Data-driven success rate prediction" },
  ];

  const steps = [
    { number: "01", title: "Upload Your Chart", description: "Upload any trading chart from your platform" },
    { number: "02", title: "AI Processing", description: "Our advanced AI analyzes technical patterns, support/resistance, and market sentiment" },
    { number: "03", title: "Get Predictions", description: "Receive BUY/SELL signals with stop loss, targets, and winning probability percentage" },
  ];

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black font-sans antialiased">
      
      {/* Apple-style Loading Screen */}
      <AnimatePresence>
        {showLogo && (
          <motion.div
            className="fixed inset-0 bg-black flex items-center justify-center z-[9999]"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: [0.43, 0.13, 0.23, 0.96] }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1, ease: "easeOut" }}
            >
              <img src="/logo.png" alt="Logo" className="w-24 h-24 grayscale invert" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: showLogo ? 0 : 1 }}
        transition={{ duration: 1 }}
      >
        {/* Main Content */}
        <div className="relative z-10">
          
          {/* Hero Section */}
          <section className="container mx-auto px-6 pt-32 pb-24 text-center max-w-5xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-1.5 mb-8 backdrop-blur-md">
                <span className="text-[12px] font-medium tracking-widest uppercase opacity-70">AI-Powered Trading Intelligence</span>
              </div>

              <h1 className="text-5xl md:text-8xl font-semibold tracking-tight mb-8">
                <span className="opacity-70">Laziest way to make </span> $10k a Month.
              </h1>

              {/* Stats Block */}
              <div className="flex items-center justify-center gap-16 mb-16">
                <div className="text-center">
                  <div className="text-4xl font-medium tabular-nums">{athletes || "0"}+</div>
                  <div className="text-xs uppercase tracking-widest opacity-40 mt-2">Traders Mentored</div>
                </div>
                <div className="h-10 w-px bg-white/10" />
                <div className="text-center">
                  <div className="text-4xl font-medium tabular-nums">95%</div>
                  <div className="text-xs uppercase tracking-widest opacity-40 mt-2">Accuracy Rate</div>
                </div>
              </div>

              {/* Call to Action */}
              <div className="flex flex-col items-center">
                <Link href="/admin/dashboard">
                  <motion.button
                    className="bg-white text-black px-10 py-4 rounded-full font-medium text-sm flex items-center gap-2 hover:bg-zinc-200 transition-colors"
                    whileTap={{ scale: 0.98 }}
                  >
                    LOCK IN
                    <ArrowUpRight className="w-4 h-4" />
                  </motion.button>
                </Link>
                <p className="text-zinc-500 text-sm mt-6 font-light">
                  No more doing it all yourself. It’s your time to rise.
                </p>
              </div>
            </motion.div>
          </section>

          {/* How It Works - Minimal Grid */}
          <section className="container mx-auto px-6 py-32 border-t border-white/5">
            <div className="max-w-6xl mx-auto">
              <div className="mb-20">
                <h2 className="text-3xl font-medium mb-4">How It Works</h2>
                <p className="text-zinc-500">Three simple steps to trading mastery.</p>
              </div>
              
              <div className="grid md:grid-cols-3 gap-12">
                {steps.map((step, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="group"
                  >
                    <div className="text-sm font-medium opacity-30 mb-4 tracking-tighter">— {step.number}</div>
                    <h3 className="text-xl font-medium mb-3">{step.title}</h3>
                    <p className="text-zinc-400 font-light leading-relaxed text-sm">{step.description}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* Features - Bento Style Light */}
          <section className="container mx-auto px-6 py-32 border-t border-white/5 bg-zinc-950/30">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-20">
                <h2 className="text-3xl font-medium mb-4">The Suite</h2>
                <p className="text-zinc-500">Intelligence at your fingertips.</p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-white/5 border border-white/5 overflow-hidden rounded-3xl">
                {features.map((feature, index) => (
                  <div 
                    key={index} 
                    className="bg-black p-10 hover:bg-zinc-900/50 transition-colors group"
                  >
                    <div className="text-white mb-6 opacity-60 group-hover:opacity-100 transition-opacity">
                      {feature.icon}
                    </div>
                    <h3 className="text-lg font-medium mb-2">{feature.title}</h3>
                    <p className="text-zinc-500 text-sm font-light leading-relaxed">{feature.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

        </div>
      </motion.div>
      
      {/* Subtle Noise Texture Overlay */}
      <div className="pointer-events-none fixed inset-0 z-[100] opacity-[0.03] mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
    </div>
  );
};

export default Page;