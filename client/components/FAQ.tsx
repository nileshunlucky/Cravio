"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

type FAQItem = {
  id: string;
  question: string;
  answer: string;
};


const FAQS: FAQItem[] = [
  {
    id: "q1",
    question: "Can people actually tell it's AI?",
    answer:
      "In most cases, NO. Even when real and AI-generated videos play side by side, the difference is almost impossible to spot. Our system perfectly mirrors your voice, tone, and micro-expressions, so it looks and feels real. What matters more is clarity and context, not the label. With light human polish, it becomes virtually indistinguishable from original content.",
  },
  {
    id: "q2",
    question: "How does AI content perform?",
    answer:
      "Exceptionally well. AI lets you scale content creation without losing quality, more hooks, more formats, more reach. Our users see strong performance across watch time, engagement, and conversions because every piece is data-driven and tailored. Combine AI speed with strategic human direction, and you unlock consistent, compounding growth.",
  },
  {
    id: "q3",
    question: "How long does content creation take?",
    answer:
      "Just a few minutes. Once your clone is set up, generating a new video is faster than making a coffee. Captions and short clips take seconds. Long-form scripts and polished videos usually render within a couple of minutes. No reshoots. Just instant, ready-to-post content.",
  },
];
// Main FAQ Component
export default function FAQComponent() {
  // State to track the currently open accordion item, defaults to the first
  const [openId, setOpenId] = useState<string | null>(FAQS[0].id);

  function toggle(id: string) {
    setOpenId((prevId) => (prevId === id ? null : id));
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="flex items-center justify-center min-h-screen w-full bg-black p-4 sm:p-6 lg:p-8 font-sans"
      aria-label="Frequently Asked Questions"
    >
      {/* The Glassmorphism Card */}
      <div className="w-full max-w-3xl rounded-2xl border border-white/20 bg-white/10 p-6 shadow-2xl backdrop-blur-xl md:p-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-zinc-100 md:text-4xl">
            FAQ
          </h1>
          <p className="mt-2 text-sm text-zinc-400 sm:text-base">
            Frequently Asked Questions
          </p>
        </div>

        {/* Accordion Items Container */}
        <div className="space-y-3">
          {FAQS.map((faq) => {
            const isOpen = openId === faq.id;
            return (
              <article
                key={faq.id}
                className="overflow-hidden rounded-lg border-b border-white/10 last:border-b-0"
              >
                <button
                  onClick={() => toggle(faq.id)}
                  aria-expanded={isOpen}
                  aria-controls={`${faq.id}-panel`}
                  className="flex w-full items-center justify-between p-4 text-left text-lg font-medium text-zinc-100 transition-colors duration-300 hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black/50"
                >
                  <span>{faq.question}</span>
                  <motion.span
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    <ChevronDown className="h-5 w-5 text-zinc-400" />
                  </motion.span>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      id={`${faq.id}-panel`}
                      key={`${faq.id}-panel`}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="px-4 pb-4"
                    >
                      <p className="text-zinc-300 leading-relaxed">
                        {faq.answer}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </article>
            );
          })}
        </div>
      </div>
    </motion.section>
  );
}