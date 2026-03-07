"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

const LightningIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" clipRule="evenodd" d="M13.2319 2.28681C13.5409 2.38727 13.75 2.6752 13.75 3.00005V9.25005H19C19.2821 9.25005 19.5403 9.40834 19.6683 9.65972C19.7963 9.9111 19.7725 10.213 19.6066 10.4412L11.6066 21.4412C11.4155 21.7039 11.077 21.8137 10.7681 21.7133C10.4591 21.6128 10.25 21.3249 10.25 21.0001V14.7501H5C4.71791 14.7501 4.45967 14.5918 4.33167 14.3404C4.20366 14.089 4.22753 13.7871 4.39345 13.5589L12.3935 2.55892C12.5845 2.2962 12.923 2.18635 13.2319 2.28681Z" fill="url(#yellowOrangeGradient)"/>
    <defs>
      <linearGradient id="yellowOrangeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#FDE047" />
        <stop offset="100%" stopColor="#F97316" />
      </linearGradient>
    </defs>
  </svg>
);

const MOCK_EMAILS = [
  "j.anderson@icloud.com",
  "sarah.chen@global.io",
  "marcus.vane@vault.net",
  "elena.rodriguez@proton.me",
  "david.sterling@company.sh",
  "maya.kapoor@venture.cap",
  "liam.fletcher@mainframe.net",
  "sophia.wright@startup.co",
  "oliver.grant@hq.inc",
  "isabella.m@offshore.biz",
  "noah.thorne@stack.dev",
  "chloe.simmons@enterprise.com",
  "ethan.blake@system.local",
  "ava.reynolds@cloud.sh",
  "lucas.h@priority.one"
];

export default function AppleStyleSlot() {
  const [totalPool, setTotalPool] = useState<number>(100000);
  const [wager, setWager] = useState<number>(1000);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);

  const handleSpin = () => {
    if (isSpinning || wager <= 0 || wager > totalPool) return;
    
    setIsSpinning(true);
    setWinner(null);
    
    // Simulate spin duration
    setTimeout(() => {
      const selectedEmail = MOCK_EMAILS[Math.floor(Math.random() * MOCK_EMAILS.length)];
      setWinner(selectedEmail);
      
      // Decrease the total company balance by the wager amount
      setTotalPool((prev) => Math.max(0, prev - wager));
      
      setIsSpinning(false);
    }, 1000);
  };

  const lossPercentage = ((wager / (totalPool + (winner ? wager : 0))) * 100).toFixed(4);

  const formatEmail = (email: string) => {
    const visiblePart = email.slice(0, 3);
    const blurredPart = email.slice(3);
    return (
      <div className="flex items-center text-lg font-medium tracking-tight text-white">
        <span>{visiblePart}</span>
        <span className="blur-md select-none opacity-40">{blurredPart}</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 font-sans antialiased selection:bg-white/20">
      <div className="w-full max-w-[320px] space-y-5">
        
        {/* Top Balance Display */}
        <header className="space-y-2 flex flex-col items-center justify-center w-full">
  <div className="relative flex items-center justify-center group w-full max-w-[240px]">
    {/* SVG Prefix positioned absolutely inside the container */}
    <div className="absolute left-16 pointer-events-none">
      <LightningIcon />
    </div>
    
    <motion.input
      type="number"
      value={totalPool}
      onChange={(e) => setTotalPool(Number(e.target.value))}
      disabled={isSpinning}
      initial={{ opacity: 0.8 }}
      animate={{ opacity: 1 }}
      className="w-full  focus:border-neutral-500 text-white text-2xl font-semibold tracking-tight text-center py-2 pl-10 pr-4 rounded-xl transition-all outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:opacity-50"
    />
  </div>
</header>

        {/* The Reel */}
        <div className="h-32 flex flex-col items-center justify-center border-y border-neutral-900 bg-neutral-950/50 backdrop-blur-md relative overflow-hidden">
          <AnimatePresence mode="wait">
            {isSpinning ? (
              <motion.div
                key="spinning"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-[10px] uppercase tracking-[0.3em] text-neutral-600 font-bold"
              >
                FINDING
              </motion.div>
            ) : winner ? (
              <motion.div
                key="winner"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="flex flex-col items-center gap-2"
              >
                {formatEmail(winner)}
                <span className="text-[10px] text-neutral-500 font-medium uppercase tracking-widest">User Won</span>
              </motion.div>
            ) : (
              <div className="text-[10px] text-neutral-800 uppercase tracking-widest font-bold">Users</div>
            )}
          </AnimatePresence>
        </div>

        {/* Input & Action */}
        <div className="space-y-3">
          <div className="space-y-1.5 px-1">
            <label className="text-[10px] uppercase text-neutral-500 font-bold tracking-widest">Credits</label>
            <input 
              type="number"
              value={wager}
              onChange={(e) => setWager(Number(e.target.value))}
              className="w-full bg-transparent border-none text-white text-3xl font-medium focus:ring-0 p-0 placeholder:text-neutral-800 outline-none"
              placeholder="0"
            />
          </div>

          <Button 
            onClick={handleSpin}
            disabled={isSpinning || wager <= 0 || wager > totalPool}
            className="w-full h-14 bg-white hover:bg-neutral-200 text-black rounded-full font-semibold text-sm transition-all duration-300 active:scale-95 disabled:opacity-10"
          >
            {isSpinning ? "Spinning" : "Spin"}
          </Button>
        </div>

        {/* Impact Calculation */}
        <div className="h-12 flex items-center justify-center">
          <AnimatePresence>
            {!isSpinning && winner && (
              <motion.div 
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
              >
                <span className="text-red-500 font-bold text-xs tracking-tight">
                  -{lossPercentage}% loss of company
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}