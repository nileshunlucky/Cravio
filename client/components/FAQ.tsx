"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: React.ReactNode;
}

const faqs: FAQItem[] = [
  {
    question: "What is Mellvitta?",
    answer: (
      <div className="space-y-4">
        <p>Mellvitta is an AI-powered video repurposing tool built to help creators turn long-form content into viral short-form clips in minutes.</p>
        <p>This is not a generic video editor. Our engine identifies high-retention moments, handles auto-reframing, and adds captions designed for social media performance.</p>
        <p className="font-bold text-white">No manual cutting. No expensive editors. No wasted content.</p>
      </div>
    ),
  },
  {
    question: "Why choose Mellvitta over ChatGPT, OpusClip or other AI tools?",
    answer: "Unlike general AI tools, Mellvitta is specifically trained on viral hooks and retention patterns. It understands the 'meat' of a video finding the exact moments that drive engagement rather than just cutting random segments and 2x cheaper than Opusclip.",
  },
  {
    question: "Can I use Mellvitta to maintain my personal brand?",
    answer: "Absolutely. Our AI maintains your visual style across every clip. From consistent caption styles to face-tracking that keeps you centered, Mellvitta ensures your brand look stays premium and recognizable.",
  },
  {
    question: "Do I need editing skills to use Mellvitta?",
    answer: "None at all. Mellvitta handles the complex clipping, audio leveling, and captioning. You provide the long-form link or file, and we provide the ready-to-post viral clips.",
  },
];

const FAQPage = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="min-h-screen bg-black text-white font-sans py-24 px-6 relative overflow-hidden">
      {/* Background Glow Removed for clean B&W look */}

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-bold mb-6 tracking-tight"
          >
            Frequently Asked Questions
          </motion.h1>
          <h2 className="text-xl md:text-2xl font-semibold mb-4 text-zinc-300">
            The most common questions, answered.
          </h2>
          <p className="text-zinc-500">
            Anything else?{" "}
            <a 
              href="mailto:mellvitta.ai@gmail.com" 
              className="text-white underline cursor-pointer hover:opacity-70 transition-opacity decoration-white/30 underline-offset-4"
            >
              Click here
            </a>{" "}
            to talk directly to the team.
          </p>
        </div>

        {/* FAQ List */}
        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <motion.div
                key={index}
                initial={false}
                className={`rounded-[1.5rem] border transition-all duration-300 ${
                  isOpen 
                  ? 'bg-[#0a0a0a] border-white/20' 
                  : 'bg-transparent border-white/10 hover:border-white/20'
                }`}
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="w-full flex items-center gap-4 px-6 py-6 text-left"
                >
                  <div className={`flex-shrink-0 w-8 h-8 rounded-lg border flex items-center justify-center transition-all ${
                    isOpen ? 'bg-white border-white text-black' : 'bg-white/5 border-white/10 text-zinc-400'
                  }`}>
                    {isOpen ? <X size={18} strokeWidth={3} /> : <Plus size={18} strokeWidth={3} />}
                  </div>
                  <span className={`text-lg font-bold transition-colors ${isOpen ? 'text-white' : 'text-zinc-400'}`}>
                    {faq.question}
                  </span>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                    >
                      <div className="px-6 md:px-20 pb-8 text-zinc-300 leading-relaxed">
                        <motion.div
                          initial={{ y: -10 }}
                          animate={{ y: 0 }}
                          className="pt-4 border-t border-white/5"
                        >
                          {faq.answer}
                        </motion.div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default FAQPage;