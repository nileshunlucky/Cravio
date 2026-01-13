"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Play } from 'lucide-react';

const PersonaSection = () => {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans py-20 px-6 relative overflow-hidden">
      {/* Background Teal Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-teal-500/7 blur-[120px] pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header Section */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
            Scale <span className="text-teal-400">With Consistency.</span>
          </h2>
          <p className="text-gray-400 text-lg">
            Make every thumbnail on-brand & optimized for performance.
          </p>
        </div>

        {/* Main Feature Card */}
        <div className="bg-[#121212] rounded-[2.5rem] border border-white/5 p-8 md:p-12 overflow-hidden shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            {/* Left Content: Text and Persona Flow */}
            <div className="space-y-12">
              <div className="max-w-md">
                <div className="flex items-center gap-3 mb-4 group cursor-pointer">
                  <h3 className="text-3xl font-bold">Create Your Persona.</h3>
                  <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-teal-400 group-hover:text-black transition-colors">
                    <Play size={10} fill="currentColor" />
                  </div>
                </div>
                <p className="text-gray-500 leading-relaxed">
                  No more cringe poses or long photo shoots. Upload a few photos of 
                  yourself once & use your Persona in all your thumbnails.
                </p>
              </div>

              {/* Persona Flow Illustration */}
              <div className="flex items-center justify-between max-w-sm mx-auto lg:mx-0">

                {/* Final Persona Circle */}
                <div className="relative">
                  <div className=" rounded-full bg-teal-500/20 border-2 border-teal-400/50 flex items-center justify-center overflow-hidden shadow-[0_0_20px_rgba(45,212,191,0.3)]">
                    <div className="w-full h-full rounded-full  bg-gray-800 flex items-center justify-center text-[10px] text-gray-500">
                      <img className="object-cover w-24 h-24" src="https://i.pinimg.com/1200x/1b/6e/28/1b6e28270b55fcccd05294c0ce09e006.jpg" alt="cr7"/>
                    </div>
                  </div>
                </div>

                <div className="flex gap-1">
                  {[1, 2, 3].map((i) => (
                    <motion.span
                      key={i}
                      animate={{ opacity: [0.2, 1, 0.2] }}
                      transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.2 }}
                      className="text-teal-400 font-bold text-xl"
                    >
                      »
                    </motion.span>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Side: Grid of Thumbnails */}
            <div className="grid grid-cols-2 gap-3">
              {/* Large Feature Image */}
              <div className="col-span-2  bg-[#1a1a1a] rounded-2xl border border-white/5 relative overflow-hidden group">
                 <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                
                 <div className="w-full h-full flex items-center justify-center text-gray-600 font-bold text-lg">
                 <img src="https://i.ytimg.com/vi/7faY2yfgbIg/maxresdefault.jpg" alt="cr7"/>
                 </div>
              </div>
              
              {/* Smaller Tiles */}
              <div className=" bg-[#1a1a1a] rounded-2xl border border-white/5 flex items-center justify-center text-gray-700 text-xs">
                 <img className="object-cover w-full h-full rounded-2xl" src="https://mir-s3-cdn-cf.behance.net/project_modules/1400_webp/d52566217697971.6794d948b0379.png" alt="cr7"/>
              
              </div>
              <div className=" bg-[#1a1a1a] rounded-2xl border border-white/5 flex items-center justify-center text-gray-700 text-xs">
              
                 <img className="object-cover w-full h-full rounded-2xl" src="https://mir-s3-cdn-cf.behance.net/projects/808/fe6de8238272287.Y3JvcCwxMzgwLDEwODAsMjcwLDA.png" alt="cr7"/>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonaSection;