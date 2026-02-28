"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Info, ChevronUp, ChevronDown } from 'lucide-react';
import Link from "next/link"
import { useUser } from "@clerk/nextjs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const PricingPage = () => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annually'>('annually');
  const [packSize, setPackSize] = useState(1);
  const { user } = useUser();
  const email = user?.primaryEmailAddress?.emailAddress;

  const baseMonthly = 29;
  const baseAnnual = 19.43;

  const currentPrice = (billingCycle === 'annually' ? baseAnnual : baseMonthly) * packSize;
  const originalPrice = baseMonthly * packSize;

  const totalCredits = (billingCycle === 'annually' ? 7200 : 600) * packSize;

  const features = [
    { text: "Multiple aspect ratios (9:16, 1:1, 16:9)" },
    { text: "AI clipping with Virality Score" },
    { text: "Powerful editor" },
    { text: "AI captions" },
    { text: "Custom fonts" },
    { text: "Speech enhancement" },
    { text: "Exclusive support" },
  ];

  const CHECKOUT_LINKS = {
  monthly: {
    1: 'db842717-831f-407d-aff1-963a1a81b57a', // 1 Pack Monthly
    2: '4e92be80-efcc-4078-94db-30b46476ee42',
    3: 'aeb81d78-9cdb-45cd-9718-a13185044ba7',
    4: '4a334270-9b45-4ec5-82c3-e6bfc854f64b',
    5: 'da3c3ba1-91a2-499c-aece-d95a37ad1011',
  },
  annually: {
    1: '87d1e49b-f23b-4689-afd8-8e86bba0a912', // 1 Pack Yearly
    2: '2bcca914-0d52-4671-b4a1-28c6a83f6821',
    3: '2aa90d2f-7254-4886-a112-b33754502753',
    4: 'c6e2d1e0-f666-4f86-aa40-2a518628f53f',
    5: '435a9376-f4ff-40a1-92f4-138a5023940e',
  }
};

  // Each of the 5 stops is evenly spaced.
  // Thumb width = 18% of container. Usable travel = 100% - 18% = 82%.
  // Step size = 82% / 4 = 20.5%
  const thumbLeftPercent = (packSize - 1) * 20.5;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-teal-500/30 overflow-x-hidden">
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-teal-500/50 blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 flex flex-col items-center">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-bold mb-4 tracking-tight"
          >
            Choose a <span className="text-teal-400">plan</span>
          </motion.h1>

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
                Yearly
              </button>
            </div>
            <p className="text-teal-400 font-semibold h-6">
              Save up to 67% with annual billing
            </p>
          </div>
        </div>

        {/* Pricing Card */}
        <div className="w-full max-w-md">
          <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative rounded-[2.5rem] p-8 border bg-[#121212] border-teal-500/50 shadow-[0_0_50px_rgba(20,184,166,0.15)]"
          >
            <div className="absolute md:top-6 top-2 right-6 flex items-center gap-1.5 bg-teal-500/20 text-teal-400 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-teal-500/30">
              <span className="relative flex size-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-75"></span>
                <span className="relative inline-flex size-2 rounded-full bg-teal-400"></span>
              </span>
              MOST POPULAR
            </div>

            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-2xl font-bold">Premium</h3>
                
              </div>

              <div className="flex items-baseline gap-1 mb-1 h-12">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`${billingCycle}-${packSize}`}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="flex items-baseline gap-2"
                  >
                    {billingCycle === 'annually' && (
                      <span className="text-gray-500 line-through text-xl tracking-tight">${originalPrice.toFixed(2)}</span>
                    )}
                    <span className="text-5xl font-bold text-teal-400 tracking-tighter">${currentPrice.toFixed(2)}</span>
                    <span className="text-gray-500">/mo</span>
                  </motion.div>
                </AnimatePresence>
              </div>
              <p className="text-xs text-gray-500 font-medium mb-6">
                {billingCycle === 'annually' ? 'Billed Annually' : 'Billed Monthly'}
              </p>

              {/* SLIDER */}
              <div className="flex items-center gap-3 mb-8">
                {/* Visual Slider */}
                <div className="relative flex-1 h-12 bg-[#1a1a1a] rounded-full p-1 border border-white/5 overflow-hidden">
                  
                  {/* Thumb — absolutely positioned, left-based so it never overshoots */}
                  <motion.div
                    className="absolute flex justify-center items-center top-1 h-10 w-10 bg-white rounded-full shadow-lg z-10"
                    animate={{ left: `calc(4px + ${thumbLeftPercent}%)` }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                >
               <h1 className="text-black font-semibold"> {packSize}x</h1>
                  </motion.div>

                  

                  {/* Click Areas */}
                  <div className="absolute inset-0 flex z-30">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className="flex-1 cursor-pointer"
                        onClick={() => setPackSize(i)}
                      />
                    ))}
                  </div>
                </div>

                {/* Counter Control */}
                <div className="gap-1 h-12 bg-[#1a1a1a] rounded-2xl border border-white/5 flex items-center justify-between px-3">
                  <span className="text-sm font-bold text-gray-200">{packSize} {packSize === 1 ? 'Pack' : 'Packs'}</span>
                  <div className="flex flex-col">
                    <button
                      onClick={() => setPackSize(prev => Math.min(5, prev + 1))}
                      className="text-gray-500 hover:text-white transition-colors"
                    >
                      <ChevronUp size={16} />
                    </button>
                    <button
                      onClick={() => setPackSize(prev => Math.max(1, prev - 1))}
                      className="text-gray-500 hover:text-white transition-colors"
                    >
                      <ChevronDown size={16} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
               <Link href={`https://mellvitta-ai.lemonsqueezy.com/checkout/buy/${CHECKOUT_LINKS[billingCycle][packSize as keyof typeof CHECKOUT_LINKS['monthly']]}/?checkout[email]=${email}`}>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-4 rounded-2xl font-bold bg-teal-400 text-black hover:bg-teal-300 transition-colors shadow-[0_0_20px_rgba(45,212,191,0.3)]"
                  >
                    Subscribe Now
                  </motion.button>
                </Link>
              </div>
            </div>

            {/* Features List */}
            <div className="bg-black/40 rounded-3xl p-6 border border-white/5 space-y-4">
              <div className="flex items-center gap-2 text-teal-400 font-bold text-sm mb-2">
                <Check size={16} strokeWidth={3} />
                <span>{totalCredits.toLocaleString()} credits</span>
                <TooltipProvider>
  <Tooltip delayDuration={0}>
    <TooltipTrigger asChild>
        <Info size={14} className="text-white cursor-pointer" />
    </TooltipTrigger>
    <TooltipContent >
      <p>1 credit = 1 minute of video processing</p>
    </TooltipContent>
  </Tooltip>
</TooltipProvider>
              per {billingCycle === 'annually' ? 'year' : 'month'}.
              </div>

              {features.map((feature, fIdx) => (
                <div key={fIdx} className="flex items-center gap-3">
                  <Check size={16} className="text-teal-400 shrink-0" strokeWidth={3} />
                  <span className="text-sm text-gray-300">{feature.text}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        <p className="text-gray-300 text-xs py-5">
          No surprises or hidden fees. Cancel anytime.
        </p>
      </div>
    </div>
  );
};

export default PricingPage;