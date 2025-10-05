"use client";

import React from "react";
import { motion } from "framer-motion";

const PersonaPage = () => {
  return (
    <div className="relative overflow-hidden bg-black text-white px-6 py-20 md:px-12 lg:px-24 min-h-screen flex items-center">
      {/* Background glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#B08D57]/20 via-[#B08D57]/10 to-transparent blur-3xl opacity-50 pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Left Text Content */}
        <div className="space-y-6">
          <p className="text-[#B08D57] uppercase tracking-widest font-semibold">
            PERSONA
          </p>
          <h2 className="text-4xl md:text-5xl font-bold leading-tight">
            Create AI Influencers <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#B08D57] to-[#d4b98b]">
              With Personas
            </span>
          </h2>
          <p className="text-gray-300 text-lg">
            Train your own influencer personas once and consistently use them
            to generate viral content at scale.
          </p>

          <a
            href="/admin/personas"
            className="inline-block mt-4 px-8 py-3 rounded-full font-semibold bg-gradient-to-r from-[#B08D57] to-[#d4b98b] text-black shadow-[0_0_20px_#B08D57] hover:opacity-90 transition"
          >
            Get Started Now
          </a>
        </div>

        {/* Right Persona to AI Flow - With Line from Persona to AI */}
        <div className="relative w-full h-[600px] flex justify-center items-center">
          {/* SVG Connecting Lines */}
          <motion.svg
            className="absolute w-full h-full"
            viewBox="0 0 400 600"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <defs>
              <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Top images to Persona */}
            <motion.path
              d="M 200 64 V 80"
              fill="none"
              stroke="#B08D57"
              strokeWidth="2"
              strokeDasharray="4 4"
              variants={{
                hidden: { pathLength: 0, opacity: 0 },
                visible: {
                  pathLength: 1,
                  opacity: 1,
                  transition: { delay: 0.3, duration: 0.4 },
                },
              }}
              style={{ filter: "url(#glow)" }}
              animate={{ strokeDashoffset: [8, 0] }}
              transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }}
            />

            {/* Persona to AI line - Simple visible line first */}
            <motion.path
              d="M 200 100 V 300"
              fill="none"
              stroke="#B08D57"
              strokeWidth="4"
              variants={{
                hidden: { pathLength: 0, opacity: 0 },
                visible: {
                  pathLength: 1,
                  opacity: 1,
                  transition: { delay: 1, duration: 1 },
                },
              }}
              style={{ filter: "url(#glow)" }}
            />

            {/* AI to Bottom Left */}
            <motion.path
              d="M 200 310 Q 200 400 100 420"
              fill="none"
              stroke="#B08D57"
              strokeWidth="2"
              strokeDasharray="4 4"
              variants={{
                hidden: { pathLength: 0, opacity: 0 },
                visible: {
                  pathLength: 1,
                  opacity: 1,
                  transition: { delay: 1.5, duration: 0.8 },
                },
              }}
              style={{ filter: "url(#glow)" }}
              animate={{ strokeDashoffset: [8, 0] }}
              transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }}
            />

            {/* AI to Bottom Right */}
            <motion.path
              d="M 200 310 Q 200 400 300 420"
              fill="none"
              stroke="#B08D57"
              strokeWidth="2"
              strokeDasharray="4 4"
              variants={{
                hidden: { pathLength: 0, opacity: 0 },
                visible: {
                  pathLength: 1,
                  opacity: 1,
                  transition: { delay: 1.5, duration: 0.8 },
                },
              }}
              style={{ filter: "url(#glow)" }}
              animate={{ strokeDashoffset: [8, 0] }}
              transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }}
            />
          </motion.svg>

          {/* Top Images */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 flex gap-4">
            {["https://i.pinimg.com/1200x/62/bb/12/62bb12da90565babc60c97cf15316d26.jpg","https://i.pinimg.com/736x/62/2a/8e/622a8eacc4f24254f0ae5dfd26603750.jpg","https://i.pinimg.com/736x/b3/2e/40/b32e40bee46c0d5deff787768dddae16.jpg"].map((src, i) => (
              <img key={i} src={src} alt="persona" className="w-16 h-16 rounded-full object-cover border-2 border-[#B08D57]/50" />
            ))}
          </div>

          {/* Main Persona */}
          <motion.img
            src="https://i.pinimg.com/736x/24/32/27/243227c3985ec01c1d17c464f98cd0b0.jpg"
            alt="main persona"
            className="absolute top-[80px] left-1/2 -translate-x-1/2 w-20 h-20 object-cover rounded-full border-4 border-[#B08D57] shadow-[0_0_15px_#B08D57]"
            initial={{ opacity: 0, scale: 0.5 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5, duration: 0.5 }}
          />

          {/* AI Circle */}
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 flex items-center justify-center rounded-full  bg-gradient-to-r from-[#B08D57] to-[#d4b98b] text-white font-bold text-2xl shadow-[0_0_20px_#B08D57]"
            initial={{ opacity: 0, scale: 0.5 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            animate={{ boxShadow: ["0 0 25px #B08D57", "0 0 45px #d4b98b", "0 0 25px #B08D57"] }}
            transition={{
              duration: 0.5,
              delay: 1.2,
              boxShadow: { duration: 2, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" },
            }}
          >
            AI
          </motion.div>

          {/* Bottom Output Images */}
          <div className="absolute bottom-0 w-full flex justify-center gap-6">
            {["https://i.pinimg.com/1200x/17/51/81/1751817ddcbbd588f1d8b38253c64062.jpg","https://i.pinimg.com/736x/bd/2c/cd/bd2ccdbb710b5479d922ad0efddcf07f.jpg"].map((src, i) => (
              <div key={i} className="w-32">
                <img src={src} alt={`output-${i}`} className="w-full object-cover rounded-xl shadow-lg aspect-[9/16]" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonaPage;
