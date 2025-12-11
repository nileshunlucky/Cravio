"use client"

import React from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { useUser } from "@clerk/nextjs";


export default function Home() {
  const { user } = useUser();
  const email = user?.emailAddresses?.[0]?.emailAddress || "";

  const plans = [
    {
      name: "Free Plan",
      price: 0,
      period: "forever",
      features: [
        "One-week Pro trial",
        "10 Credits (limited)",
        "Binance Intergration",
        "Community support",
      ],
      cta: "Get Started",
      link: "/admin/dashboard",
      featured: false
    },
    {
      name: "Pro Plan",
      price: 25,
      period: "/month",
      features: [
        "Everything in Free, Plus",
        "250 Credits",
        "Real-time market data",
        "PHD AI model OpenAI (GPT5)",
        "Risk management tools",
        "Exclusive support"
      ],
      cta: "Get Pro",
      link: `https://mellvitta.lemonsqueezy.com/buy/076a89d9-d4fa-44de-874d-a090b2e65342/?checkout[email]=${email}`,
      featured: true
    },
    {
      name: "Premium Plan",
      price: 200,
      period: "/month",
      features: [
        "Everything in Pro, Plus",
        "3000 Credits (12x usage)",
        "Priority access to new features",
      ],
      cta: "Get Premium",
      link: `https://mellvitta.lemonsqueezy.com/buy/4acbe01f-fdde-4727-8ffa-e976a18db11b/?checkout[email]=${email}`,
      featured: false
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  return (
    <div className="min-h-screen bg-black text-white md:pt-10 ">
      {/* Hero Section */}
      <div className="pt-20 pb-16 px-6 relative">
        {/* Large Background Text */}
        <div className="absolute top-35 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none overflow-hidden w-full">
          <h1 className="text-[5rem] md:text-[20rem] font-bold text-zinc-200 whitespace-nowrap text-center">
            Pricing
          </h1>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-18 relative z-10"
        >

        </motion.div>

        {/* Pricing Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10"
        >
          {plans.map((plan) => (
            <motion.div
              key={plan.name}
              variants={cardVariants}
              whileHover={{ y: -10 }}
              className={`relative rounded-3xl p-8 backdrop-blur-xl ${
                plan.featured
                  ? 'bg-white/95 text-black'
                  : 'bg-white/5 border border-white/10'
              }`}
            >
              {plan.featured && (
                <div className="absolute top-5 left-1/2 -translate-x-1/2 px-4 py-1 bg-black text-white text-xs font-semibold rounded-full">
                  RECOMMEDED
                </div>
              )}

              <div className="mb-8">
                <p className={`text-sm font-medium mb-4 ${plan.featured ? 'text-gray-600' : 'text-gray-400'}`}>
                  {plan.name}
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold">
                    ${plan.price}
                  </span>
                  <span className={`text-lg ${plan.featured ? 'text-gray-600' : 'text-gray-400'}`}>
                    {plan.period}
                  </span>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                {plan.features.map((feature, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className={`mt-0.5 rounded-full p-0.5 ${
                      plan.featured ? 'bg-black' : 'bg-white'
                    }`}>
                      <Check className={`w-4 h-4 ${
                        plan.featured ? 'text-white' : 'text-black'
                      }`} />
                    </div>
                    <span className={`text-sm ${
                      plan.featured ? 'text-gray-700' : 'text-gray-300'
                    }`}>
                      {feature}
                    </span>
                  </div>
                ))}
              </div>

             <a href={plan.link}> <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full py-4 rounded-full font-semibold transition ${
                  plan.featured
                    ? 'bg-black text-white hover:bg-gray-900'
                    : 'bg-white text-black hover:bg-gray-200'
                }`}
              >
                {plan.cta}
              </motion.button>
              </a>
            </motion.div> 
          ))}
        </motion.div>
      </div>
    </div>
  );
}