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

    const timer = setTimeout(() => setShowLogo(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  const features = [
    { icon: <Upload className="w-6 h-6" />, title: "Upload Chart", description: "Simply upload your trading chart screenshot" },
    { icon: <Brain className="w-6 h-6" />, title: "AI Analysis", description: "Advanced AI analyzes patterns instantly" },
    { icon: <TrendingUp className="w-6 h-6" />, title: "BUY/SELL Signal", description: "Get clear actionable trading signals" },
    { icon: <Shield className="w-6 h-6" />, title: "Stop Loss", description: "Precise risk management levels" },
    { icon: <Target className="w-6 h-6" />, title: "Target Price", description: "Multiple profit target recommendations" },
    { icon: <BarChart3 className="w-6 h-6" />, title: "Win Probability", description: "Data-driven success rate prediction" },
  ];

  const steps = [
    { number: "01", title: "Upload Your Chart", description: "Upload any trading chart from your platform" },
    { number: "02", title: "AI Processing", description: "Our advanced AI analyzes technical patterns, support/resistance, and market sentiment" },
    { number: "03", title: "Get Predictions", description: "Receive BUY/SELL signals with stop loss, targets, and winning probability percentage" },
  ];

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-r from-blue-500/3 to-cyan-500/3 rounded-full blur-3xl animate-pulse delay-1000" />
      <AnimatePresence>
        {showLogo && (
          <motion.div
            className="fixed inset-0 bg-black flex items-center justify-center z-[9999]"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
          >
            <motion.div
              className="relative flex items-center justify-center"
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: [0.6, 1.05, 1], opacity: [0, 1, 1] }}
              exit={{ scale: 1.1, opacity: 0 }}
              transition={{ duration: 2, ease: "easeInOut" }}
            >
              <motion.div
                className="absolute"
                animate={{ scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              />

              <img
                src="/logo.png"
                alt="Logo"
                className="md:w-64 md:h-64 w-32 h-32"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: showLogo ? 0 : 1 }}
        transition={{ delay: 0.3, duration: 1 }}
      >

        <motion.div
          className="absolute inset-0 opacity-30"
          animate={{
            background: [
              'radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.3) 0%, transparent 50%)',
              'radial-gradient(circle at 80% 50%, rgba(37, 99, 235, 0.3) 0%, transparent 50%)',
              'radial-gradient(circle at 50% 80%, rgba(29, 78, 216, 0.3) 0%, transparent 50%)',
              'radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.3) 0%, transparent 50%)',
            ],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        />

        <motion.div
          className="absolute top-20 left-10 w-72 h-72 bg-blue-500 rounded-full filter blur-[120px] opacity-20"
          animate={{ x: [0, 100, 0], y: [0, 50, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />

        <motion.div
          className="absolute bottom-20 right-10 w-96 h-96 bg-blue-600 rounded-full filter blur-[120px] opacity-20"
          animate={{ x: [0, -80, 0], y: [0, -60, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />

        <div className="relative z-10">

          <div className="container mx-auto px-6 pt-20 pb-32 text-center max-w-5xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <motion.div
                className="inline-block mb-6 px-6 py-2 rounded-full border border-blue-500/30 bg-blue-500/10 backdrop-blur-sm"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                <span className="text-blue-400 font-medium">AI-Powered Trading Intelligence</span>
              </motion.div>

              <h1 className="text-4xl md:text-7xl lg:text-8xl font-bold mb-8 leading-tight">
                <span className="bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 bg-clip-text text-transparent">
                  Built in Silence.
                </span>
                <br />
                <span className="text-white">Shown Through Precision.</span>
              </h1>

              <p className="text-xl md:text-2xl text-gray-400 mb-8 max-w-3xl mx-auto">
                Wealth is earned, not given. One Trade. Infinite Lessons.
              </p>

              <motion.div
                className="flex items-center justify-center gap-8 mb-12"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <div className="text-center">
                  <div className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
                    {athletes || "---"}+
                  </div>
                  <div className="text-gray-400 mt-2">Traders Mentored</div>
                </div>

                <div className="h-16 w-px bg-blue-500/30" />

                <div className="text-center">
                  <div className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
                    95%
                  </div>
                  <div className="text-gray-400 mt-2">Accuracy Rate</div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <Link href="/admin/dashboard">
                  <motion.button
                    className="group relative px-14 py-5 font-bold text-lg rounded-2xl overflow-hidden text-white shadow-[0_0_25px_rgba(37,99,235,0.4)] border border-blue-400/20"
                    whileHover={{ scale: 1.06 }}
                    whileTap={{ scale: 0.96 }}
                  >
                    <motion.div
                      className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-700 via-blue-500 to-cyan-400 opacity-90 blur-[2px]"
                      animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                      style={{ backgroundSize: "200% 200%" }}
                    />

                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-2xl"
                      initial={{ x: "-100%" }}
                      whileHover={{ x: "100%" }}
                      transition={{ duration: 0.8, ease: "easeInOut" }}
                    />

                    <span className="relative z-10 flex items-center gap-3 tracking-tight">
                      LOCK IN
                      <ArrowUpRight className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-300" />
                    </span>

                    <motion.div
                      className="absolute inset-0 rounded-2xl border border-blue-400/40"
                      animate={{ opacity: [0.4, 0.7, 0.4], scale: [1, 1.02, 1] }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                    />
                  </motion.button>
                </Link>

                <p className="text-gray-500 mt-4">
                  No more doing it all yourself. Its your time to rise.
                </p>
              </motion.div>
            </motion.div>
          </div>

          <div className="container mx-auto px-6 py-24">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <h2 className="text-5xl font-bold mb-4">
                <span className="bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
                  How It Works
                </span>
              </h2>
              <p className="text-xl text-gray-400">Three simple steps to trading mastery</p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {steps.map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.2 }}
                  className="relative group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-blue-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all" />
                  <div className="relative bg-gradient-to-br from-blue-950/50 to-black border border-blue-500/20 rounded-2xl p-8 backdrop-blur-sm hover:border-blue-500/40 transition-all">
                    <div className="text-6xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent mb-4">
                      {step.number}
                    </div>
                    <h3 className="text-2xl font-bold mb-3 text-white">{step.title}</h3>
                    <p className="text-gray-400 leading-relaxed">{step.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="container mx-auto px-6 py-24">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <h2 className="text-5xl font-bold mb-4">
                <span className="bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
                  What You Get
                </span>
              </h2>
              <p className="text-xl text-gray-400">Complete trading intelligence at your fingertips</p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -5 }}
                  className="group relative"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-blue-500/10 rounded-xl blur-lg group-hover:blur-xl transition-all" />
                  <div className="relative bg-gradient-to-br from-blue-950/30 to-black border border-blue-500/20 rounded-xl p-8 backdrop-blur-sm hover:border-blue-500/40 transition-all">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                      {feature.icon}
                    </div>
                    <h3 className="text-xl font-bold mb-3 text-white">{feature.title}</h3>
                    <p className="text-gray-400">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

        </div>
      </motion.div>
    </div>
  );
};

export default Page;
