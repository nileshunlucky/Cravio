"use client";

import { motion } from "framer-motion";

const Page = () => {
  return (
    <div className="flex flex-col justify-center items-center h-screen bg-gradient-to-t from-[#b08d57]/80 to-[#6b4e2a]/80 px-4 text-center">
      
      {/* Logo / Title */}
      <motion.h1
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="text-2xl md:text-8xl font-extrabold tracking-tight text-white drop-shadow-lg"
      >
        MELLVITTA AI
      </motion.h1>
      
      {/* Tagline */}
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 1 }}
        className="mt-6 md:text-2xl text-white/90 font-light"
      >
        Your AI-powered social media companion. <br />
        Create, Explore, and Connect like never before.
      </motion.p>

      {/* Call-to-action */}
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1, duration: 0.5 }}
        className="mt-10 px-8 py-4 rounded-full bg-white text-[#6b4e2a] font-semibold text-lg shadow-lg hover:shadow-2xl hover:scale-105 transition-all"
      >
        Get Started
      </motion.button>
    </div>
  );
};

export default Page;
