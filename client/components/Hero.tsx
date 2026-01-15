"use client";

import React, {useState, useEffect} from 'react';
import { motion } from 'framer-motion';
import { Star, Play } from 'lucide-react';
import { Button } from "@/components/ui/button";
import Link from "next/link"


const thumbnails = [
  { id: 1, label: "The Unfathomable Wealth of Pablo Escobar", views: "900,000+", img: "https://pikzels.com/_next/image?url=%2Fthumbnails%2F014.webp&w=256&q=75" },
  { id: 2, label: "The Satisfying Downfall of Ashton Hall", views: "3,500,000+", img: "https://pikzels.com/_next/image?url=%2Fthumbnails%2F017.webp&w=256&q=75" },
  { id: 3, label: "How Samuel Onuha Sniffed His Way to Prison", views: "550,000+", img: "https://pikzels.com/_next/image?url=%2Fthumbnails%2F006.webp&w=256&q=75" },
  { id: 4, label: "SECRET Tattoos Footballers Don't Talk About", views: "1,500,000+", img: "https://pikzels.com/_next/image?url=%2Fthumbnails%2F002.webp&w=256&q=75" },
  { id: 5, label: "Trump's Tariff Plan Explained", views: "3,500,000+", img: "https://pikzels.com/_next/image?url=%2Fthumbnails%2F007.webp&w=256&q=75" },
  { id: 6, label: "Iman Gadzhi Has Completely Lost His Mind..", views: "700,000+", img: "https://pikzels.com/_next/image?url=%2Fthumbnails%2F012.webp&w=256&q=75" },
];

const LandingPage = () => {
  const [userCount, setUserCount] = useState(100);

      useEffect(() => {
        const fetchUserCount = async () => { 
          try {
            const res = await fetch(`https://cravio-ai.onrender.com/users-emails`)
            const data = await res.json()
            // Calculate total number of users from the email list
            const totalUsers = Array.isArray(data) ? data.length : 100
            setUserCount(totalUsers)
          } catch (error) {
            console.error('Error fetching user count:', error)
            setUserCount(100) // Fallback value
          } 
        }
          
        fetchUserCount()
      }, [])

  const ThumbnailCard = ({ t }: { t: typeof thumbnails[0] }) => (
    <div className="relative w-[220px] md:w-[260px] aspect-video bg-gray-900/40 rounded-xl border border-white/5 overflow-hidden group">
      <img src={t.img} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-60 transition-opacity" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
      <div className="absolute bottom-2 left-2 right-2">
        <p className="text-[9px] font-bold text-white/70 line-clamp-1 uppercase tracking-tight">{t.label}</p>
        <p className="text-[8px] text-teal-500 font-medium">{t.views} views</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#020606] text-white overflow-hidden relative font-sans flex flex-col justify-between">
      
      {/* 1. THE INTENSE GLOW - Center Weighted */}
      <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-full max-w-[800px] aspect-square pointer-events-none z-0">
        <div className="absolute inset-0 bg-teal-400/20 blur-[140px] rounded-full" />
        <div className="absolute inset-0 bg-teal-500/10 blur-[100px] rounded-full scale-110 translate-y-10" />
      </div>

      {/* 2. THE THUMBNAILS - Adjusted Positioning */}
      <div className="absolute inset-0 z-0 pointer-events-none flex flex-col justify-end pb-12 overflow-hidden">
        {/* Row 1 */}
        <div className="flex mb-4">
          <motion.div 
            animate={{ x: [0, -1500] }} 
            transition={{ repeat: Infinity, duration: 40, ease: "linear" }} 
            className="flex gap-4 shrink-0 px-2"
          >
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex gap-4">
                {thumbnails.map((t) => <ThumbnailCard key={`row1-${i}-${t.id}`} t={t} />)}
              </div>
            ))}
          </motion.div>
        </div>
        {/* Row 2 */}
        <div className="flex">
          <motion.div 
            animate={{ x: [-1500, 0] }} 
            transition={{ repeat: Infinity, duration: 40, ease: "linear" }} 
            className="flex gap-4 shrink-0 px-2"
          >
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex gap-4">
                {thumbnails.map((t) => <ThumbnailCard key={`row2-${i}-${t.id}`} t={t} />)}
              </div>
            ))}
          </motion.div>
        </div>
        
        {/* Subtler Bottom Fade - So thumbnails are visible */}
        <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-[#020606] via-[#020606]/40 to-transparent z-10" />
      </div>

      {/* 3. MAIN CONTENT LAYER */}
      <main className="relative z-20 flex flex-col items-center pt-10 p-3 md:max-w-7xl md:mx-auto flex-1">
        
        {/* Top Badges */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-4 mb-10">
          <div className="flex items-center gap-1 text-[10px] font-bold tracking-widest uppercase opacity-70">
            <span>Excellent</span>
            <div className="flex gap-0.5 mx-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="bg-[#00b67a] p-0.5 rounded-[1px]">
                  <Star size={10} fill="white" stroke="none" />
                </div>
              ))}
            </div>
            <div className="flex items-center gap-1">
                <img className="w-4 h-4" src="https://cdn.iconscout.com/icon/free/png-256/free-trustpilot-icon-svg-download-png-8715838.png" alt="" />
                <span className="font-bold lowercase">Trustpilot</span>
            </div>
          </div>
          <div className="bg-[#121818] border border-white/10 px-5 py-1.5 rounded-full backdrop-blur-md">
            <p className="text-[11px] font-medium text-gray-400">
              Trusted by <span className="text-teal-400 font-bold">{userCount}+</span> Users
            </p>
          </div>
        </motion.div>

        {/* Hero */}
        <div className="text-center mb-10">
          <h1 className="text-5xl md:text-8xl font-semibold  mb-4 leading-none">
            <span className="text-teal-300 drop-shadow-[0_0_25px_rgba(45,212,191,0.4)]">Laziest</span> way  <br />
            to make Millions of Views
          </h1>
          <p className="text-gray-400 text-lg md:text-xl font-light">
            Stop getting ignored, The lazy way to go viral using AI thumbnails.
          </p>
        </div>

        {/* The Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="w-full max-w-3xl relative"
        >
          <div className="bg-[#0a0f0f]/80 backdrop-blur-3xl border border-white/10 rounded-[40px] p-8 md:p-12 shadow-2xl">
            <textarea 
              className="w-full bg-transparent border-none focus:ring-0 text-xl md:text-2xl text-gray-200 resize-none h-24 placeholder:text-gray-700 outline-none"
              placeholder="Dubai's $100 billion branded megaprojects"
            />
            
            <div className="flex flex-col items-center mt-6 gap-6">
              <Link href="/admin/dashboard"><Button className="bg-teal-400 hover:bg-teal-300 text-black py-7 px-12 rounded-full transition-transform active:scale-95 flex gap-2 text-lg">
                <Star size={20} fill="currentColor" />
                Generate My First Thumbnail
              </Button></Link>
              
              <button className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-sm font-bold">
                <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center">
                  <Play size={14} fill="currentColor" className="ml-1" />
                </div>
                Watch Demo <span className="opacity-50 ml-1">65 sec</span>
              </button>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Spacer to prevent overlap if screen is small */}
      <div className="h-48 md:h-64 pointer-events-none" />
    </div>
  );
};

export default LandingPage;