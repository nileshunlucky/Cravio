"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from 'next/link'

const HeroSection = () => {
  const [creators, setCreators] = useState<number | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const res = await fetch(`https://cravio-ai.onrender.com/users-emails`);
        if (!res.ok) return;
        const data = await res.json();
        setCreators(data.length);
      } catch (err) {
        console.error("Failed to fetch user data:", err);
      }
    };
    fetchUserData();
  }, []);

  return (
    <div className="relative overflow-hidden bg-black text-white py-20 px-6 md:px-12 lg:px-24">
      {/* Glow gradient background */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#B08D57]/20 via-[#B08D57]/5 to-transparent blur-3xl opacity-40 pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
        {/* Left Text Section */}
        <div className="space-y-6">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight"
          >
            Build Viral <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#B08D57] to-[#d4b98b]">AI Influencers</span> in Seconds
          </motion.h1>

          <p className="text-lg text-gray-300">
            Launch AI Influencers that look real, post daily, and grow your audience on autopilot.
            Trusted by {creators ? creators.toLocaleString() : "..."}+ creators building the next wave.
          </p>

          <div className="flex gap-4 mt-6">
            <Link
              href="/admin/playbook"
              className="px-6 py-3 rounded-full font-semibold bg-gradient-to-r from-[#B08D57] to-[#d4b98b] text-black shadow-[0_0_20px_#B08D57]"
            >
              Free Playbook + 50% Discount
            </Link>
          </div>
        </div>

        {/* Right “AI Influencer Posts” Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-4">
          {[
            { img: "https://i.pinimg.com/736x/c7/56/f7/c756f779e5427dac5b85099859d267f9.jpg", caption: "AI Model goes viral " },
            { img: "https://i.pinimg.com/736x/d5/8c/ee/d58ceebd470fa43498e99c5f7226f703.jpg", caption: "Exclusive collab launch " },
            { img: "https://i.pinimg.com/736x/3f/a3/55/3fa3559aa16d9ff68fc2f12b36876339.jpg", caption: "Luxury lifestyle content " },
            { img: "https://i.pinimg.com/736x/6f/68/9f/6f689f5c7ae2f145b47238ab412a8544.jpg", caption: "Aesthetic Glow" },
          ].map((post, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.15 }}
              className="relative rounded-xl overflow-hidden bg-[#111] shadow-lg group"
            >
              <img
                src={post.img}
                alt={post.caption}
                className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute bottom-0 left-0 right-0 text-xs sm:text-sm p-2 text-white">
                {post.caption}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
