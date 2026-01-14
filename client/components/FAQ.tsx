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
        <p>Mellvitta is a YouTube packaging tool built to help creators create, test & iterate thumbnails & titles that get clicked.</p>
        <p>This is not a generic image generator. Everything is designed around YouTube performance, CTR & repeatable results.</p>
        <p className="font-bold text-teal-400">No designers. No photoshoots. No guesswork.</p>
      </div>
    ),
  },
  {
    question: "Why choose Mellvitta over ChatGPT, Midjourney or other AI tools?",
    answer: "Unlike general AI tools, Mellvitta is specifically trained on high-performance YouTube thumbnails. It understands layout, focal points, and visual psychology that drives clicks, rather than just generating a pretty image.",
  },
  {
    question: "Can I use Mellvitta with my own face?",
    answer: "Yes! Our Persona feature allows you to upload a few reference photos once. Our AI then learns your features so you can place yourself in any thumbnail scenario with perfect consistency.",
  },
  {
    question: "Do I need design skills to use Mellvitta?",
    answer: "None at all. Mellvitta handles the complex composition, lighting, and branding. You provide the idea, and we provide the professional-grade output.",
  },
];

const FAQPage = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans py-24 px-6 relative overflow-hidden">
      {/* Background Teal Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[600px] bg-teal-500/5 blur-[120px] pointer-events-none" />

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-bold mb-6 tracking-tight"
          >
            Frequently  
            <span className="text-teal-500"> Asked </span>
              Questions
          </motion.h1>
          <h2 className="text-xl md:text-2xl font-semibold mb-4 text-gray-200">
            The most common questions, answered.
          </h2>
          <p className="text-gray-400">
            Anything else?{" "}
            <a 
              href="mailto:mellvitta.ai@gmail.com" 
              className="text-white underline cursor-pointer hover:text-teal-400 transition-colors decoration-teal-500/50 underline-offset-4"
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
                  ? 'bg-[#121212] border-teal-500/30 shadow-[0_0_30px_rgba(20,184,166,0.05)]' 
                  : 'bg-[#0d0d0d] border-white/5 hover:border-white/10'
                }`}
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="w-full flex items-center gap-4 px-6 py-6 text-left"
                >
                  <div className={`flex-shrink-0 w-8 h-8 rounded-lg border flex items-center justify-center transition-colors ${
                    isOpen ? 'bg-teal-500/10 border-teal-500/40 text-teal-400' : 'bg-white/5 border-white/10 text-gray-400'
                  }`}>
                    {isOpen ? <X size={18} strokeWidth={3} /> : <Plus size={18} strokeWidth={3} />}
                  </div>
                  <span className={`text-lg font-bold transition-colors ${isOpen ? 'text-teal-400' : 'text-gray-200'}`}>
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
                      <div className="px-6 md:px-20 pb-8 text-gray-400 leading-relaxed">
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