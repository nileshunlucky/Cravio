"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Check, Info } from 'lucide-react';
import Link from "next/link"
import { useUser } from "@clerk/nextjs";

const PricingPage = () => {
  const { user } = useUser();
  const email = user?.primaryEmailAddress?.emailAddress

  const features = [
    { text: "Upload Chart", included: true },
    { text: "Winning Probability", included: true },
    { text: "Predicts P&L (BUY/SELL, Stop Loss, Take Profit)", included: true },
    { text: "Risk Management", included: true },
    { text: "Data Analysis", included: true },
    { text: "Real-time market insights", included: true },
    { text: "Early Access to New Features", included: true },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans  overflow-x-hidden">
      
      {/* Background Glow - Using #B08D57 */}
 
      
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 flex flex-col items-center">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.h1 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-bold mb-4 tracking-tight"
          >
            Start Trading <br /> with <span className="italic">Mellvitta</span> Today
          </motion.h1>
          <p className="text-zinc-400 text-lg">
            No surprises or hidden fees. Cancel anytime.
          </p>
        </div>

        {/* Pricing Card - Single Premium Plan */}
        <div className="w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative rounded-[2.5rem] p-8 border bg-[#121212] border-white shadow-[0_0_50px_rgba(176,141,87,0.1)]"
          >
            {/* Status Badge */}
            <div className="absolute top-2 right-6 flex items-center gap-1.5  px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-white">
              <span className="relative flex size-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex size-2 rounded-full bg-white"></span>
              </span>
              MOST POPULAR
            </div>

            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-2xl font-bold">Premium</h3>
                <span className="bg-red-600/50 text-red-500 text-xs font-bold px-2 py-0.5 rounded-xl border border-red-500">-50% OFF</span>
              </div>
              
              <div className="flex items-baseline gap-2 mb-1 h-12">
                  <span className="text-zinc-500 line-through text-xl tracking-tight">$10</span>
                  <span className="text-5xl font-bold text-white tracking-tighter">$4.99</span>
                  <span className="text-zinc-500">/week</span>
              </div>
              <p className="text-xs text-zinc-500 font-medium mb-4">
                Billed Weekly (Limited Time Offer)
              </p>
              <p className="text-sm text-zinc-300">
                Predict up to <span className="text-white font-bold">Unlimited</span> Trades with our AI.
              </p>
            </div>

            {/* Features List */}
            <div className="bg-black/40 rounded-3xl p-6 mb-8 border border-white/5 space-y-4">
              <div className="flex items-center gap-2  font-bold text-sm mb-2">
                <Check size={16} strokeWidth={3} />
                <span>BloombergGPT</span>
                <Info size={14} className="text-zinc-600 ml-auto" />
              </div>
              
              {features.map((feature, fIdx) => (
                <div key={fIdx} className="flex items-center gap-3">
                  <Check size={16} className=" shrink-0" strokeWidth={3} />
                  <span className="text-sm text-zinc-300">
                    {feature.text}
                  </span>
                  <Info size={14} className="text-zinc-600/50 ml-auto shrink-0" />
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="space-y-4">
              <Link href={`https://richacle.lemonsqueezy.com/checkout/buy/7bdcd765-fca5-4da2-8b13-513828f790e6/?checkout[email]=${email}`}> 
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-4 rounded-2xl font-bold text-white bg-zinc-800"
                >
                  Subscribe Now
                </motion.button>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;