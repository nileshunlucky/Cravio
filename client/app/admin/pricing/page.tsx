"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Info } from 'lucide-react';
import Link from "next/link"
import { useUser } from "@clerk/nextjs";



const PricingPage = () => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annually'>('annually');
  const { user } = useUser();
  const email = user?.primaryEmailAddress?.emailAddress

  // Pricing Logic
  const monthlyPrice = 19;
  const annualMonthlyPrice = 9.5; // 50% discount
  
  const currentPrice = billingCycle === 'annually' ? annualMonthlyPrice : monthlyPrice;
  const originalPrice = monthlyPrice;

  const features = [
    { text: "Works in Any Language", included: true },
    { text: "Prompt-to-Thumbnail", included: true },
    { text: "Recreate", included: true },
    { text: "Edit", included: true },
    { text: "Personas", included: true },
    { text: "FaceSwap", included: true },
    { text: "Early Access to New Features", included: true },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-teal-500/30 overflow-x-hidden">
      {/* Background Glows - Changed to Teal */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-teal-500/50 blur-[120px] pointer-events-none" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 flex flex-col items-center">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.h1 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-bold mb-4 tracking-tight"
          >
            Start Creating <br /> with <span className="text-teal-400">Mellvitta</span> Today
          </motion.h1>
          <p className="text-gray-400 text-lg mb-8">
            No surprises or hidden fees. Cancel anytime.
          </p>

          {/* Toggle */}
          <div className="flex flex-col items-center gap-4">
            <div className="bg-[#1a1a1a] p-1 rounded-full flex items-center border border-white/5">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-8 py-2 rounded-full text-sm font-medium transition-all ${billingCycle === 'monthly' ? 'bg-[#2a2a2a] text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('annually')}
                className={`px-8 py-2 rounded-full text-sm font-medium transition-all ${billingCycle === 'annually' ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30' : 'text-gray-500 hover:text-gray-300'}`}
              >
                Annually
              </button>
            </div>
            <p className="text-teal-400 text-sm font-semibold uppercase tracking-wider h-6">
              {billingCycle === 'annually' ? 'Save 50% with our annual plan' : ''}
            </p>
          </div>
        </div>

        {/* Pricing Card - Single Premium Plan */}
        <div className="w-full max-w-md">
          <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative rounded-[2.5rem] p-8 border bg-[#121212] border-teal-500/50 shadow-[0_0_50px_rgba(20,184,166,0.15)]"
          >
            <div className="absolute top-6 right-6 flex items-center gap-1.5 bg-teal-500/20 text-teal-400 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-teal-500/30">
              <span className="relative flex size-2">
  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-75"></span>
  <span className="relative inline-flex size-2 rounded-full bg-teal-400"></span>
</span>

              MOST POPULAR
            </div>

            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-2xl font-bold">Premium</h3>
                {billingCycle === 'annually' && (
                  <span className="bg-rose-500/10 text-rose-500 text-xs font-bold px-2 py-0.5 rounded-xl">-50%</span>
                )}
              </div>
              
              <div className="flex items-baseline gap-1 mb-1 h-12">
                <AnimatePresence mode="wait">
                  <motion.div 
                    key={billingCycle}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="flex items-baseline gap-2"
                  >
                    {billingCycle === 'annually' && (
                      <span className="text-gray-500 line-through text-xl tracking-tight">${originalPrice}</span>
                    )}
                    <span className="text-5xl font-bold text-teal-400 tracking-tighter">${currentPrice}</span>
                    <span className="text-gray-500">/mo</span>
                  </motion.div>
                </AnimatePresence>
              </div>
              <p className="text-xs text-gray-500 font-medium mb-4">
                {billingCycle === 'annually' ? 'Billed Annually' : 'Billed Monthly'}
              </p>
              <p className="text-sm text-gray-300">
                Generate up to <span className="text-teal-400 font-bold">{billingCycle === 'annually' ? '600' : '50'} thumbnails</span> per {billingCycle === 'annually' ? 'year' : 'month'}.
              </p>
            </div>

            {/* Features List */}
            <div className="bg-black/40 rounded-3xl p-6 mb-8 border border-white/5 space-y-4">
              <div className="flex items-center gap-2 text-teal-400 font-bold text-sm mb-2">
                <Check size={16} strokeWidth={3} />
                <span>{billingCycle === 'annually' ? '6000' : '500'} credits</span>
                <Info size={14} className="text-gray-600 ml-auto" />
              </div>
              
              {features.map((feature, fIdx) => (
                <div key={fIdx} className="flex items-center gap-3">
                  {feature.included ? (
                    <Check size={16} className="text-teal-400 shrink-0" strokeWidth={3} />
                  ) : (
                    <X size={16} className="text-rose-500 shrink-0" strokeWidth={3} />
                  )}
                  <span className={`text-sm ${feature.included ? 'text-gray-300' : 'text-gray-600'}`}>
                    {feature.text}
                  </span>
                  <Info size={14} className="text-gray-600/50 ml-auto shrink-0" />
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="space-y-4">
            
           {billingCycle === 'annually' ? (
             <Link href={`https://mellvitta-ai.lemonsqueezy.com/checkout/buy/a3969d52-f3bb-45c4-8142-9a705f1ebb38/?checkout[email]=${email}`}> <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-4 rounded-2xl font-bold bg-teal-400 text-black hover:bg-teal-300 transition-colors shadow-[0_0_20px_rgba(45,212,191,0.3)]"
              >
                Subscribe Now
              </motion.button></Link>
           ) : (
             <Link href={`https://mellvitta-ai.lemonsqueezy.com/checkout/buy/9426dea7-2b31-43b7-b496-c6d9c4716014/?checkout[email]=${email}`}> <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-4 rounded-2xl font-bold bg-teal-400 text-black hover:bg-teal-300 transition-colors shadow-[0_0_20px_rgba(45,212,191,0.3)]"
              >
                Subscribe Now
              </motion.button></Link>
           )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;