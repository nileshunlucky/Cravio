"use client";

import { motion } from "framer-motion";

const Page = () => {
  const creators = [
    { name: "Alice Johnson", role: "AI Engineer" },
    { name: "Bob Smith", role: "UI/UX Designer" },
    { name: "Clara Lee", role: "Front-end Developer" },
    { name: "David Kim", role: "Product Manager" },
  ];

  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-gradient-to-t from-[#b08d57]/80 to-[#6b4e2a]/50 px-4 py-12 text-center">
      
      {/* Page Title */}
      <motion.h1
        initial={{ opacity: 0, y: -40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white drop-shadow-lg"
      >
        Meet the Creators
      </motion.h1>

      {/* Subtitle */}
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 1 }}
        className="mt-4 text-base sm:text-lg md:text-xl text-white/90 font-light max-w-md sm:max-w-lg md:max-w-2xl"
      >
        The brilliant minds behind MELLVITTA AI, crafting a seamless AI-powered social experience.
      </motion.p>

      {/* Creators List */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
        className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 w-full max-w-5xl"
      >
        {creators.map((creator, index) => (
          <div
            key={index}
            className="bg-white/10 backdrop-blur-md rounded-xl px-6 py-6 shadow-lg hover:scale-105 transition-transform"
          >
            <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-white">{creator.name}</h2>
            <p className="mt-1 text-white/80 text-sm sm:text-base md:text-lg">{creator.role}</p>
          </div>
        ))}
      </motion.div>
    </div>
  );
};

export default Page;
 