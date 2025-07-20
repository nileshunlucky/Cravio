"use client"

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Star, Heart } from 'lucide-react';
import Link from 'next/link';

const HeroX = () => {
    const [userCount, setUserCount] = React.useState(100);

    useEffect(() => {
        const fetchUserCount = async () => { 
          try {
            const res = await fetch(`https://cravio-ai.onrender.com/users-emails`)
            const data = await res.json()
            const totalUsers = Array.isArray(data) ? data.length : 100
            setUserCount(totalUsers)
          } catch (error) {
            console.error('Error fetching user count:', error)
            setUserCount(100)
          } 
        }
        fetchUserCount()
    }, [])

    return (
        <div className="min-h-screen bg-black text-white relative overflow-hidden">
            {/* Subtle luxury background pattern */}
            <div className="absolute inset-0 opacity-3">
                <div className="absolute inset-0" style={{
                    backgroundImage: `linear-gradient(45deg, rgba(176, 141, 87, 0.02) 0%, transparent 50%)`,
                    backgroundSize: '400px 400px'
                }} />
            </div>

            {/* Main content container */}
            <div className="relative z-10">
                <div className="container mx-auto px-6 lg:px-16 xl:px-24 py-12 lg:py-20">
                    
        
                    {/* Main content grid */}
                    <div className="flex md:flex-row flex-col-reverse gap-12 lg:gap-16 xl:gap-24 items-center min-h-[70vh]">
                        
                        {/* Left side - Content */}
                        <div className="lg:col-span-7 xl:col-span-6 order-2 lg:order-1">
                            <motion.div
                                initial={{ opacity: 0, x: -40 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                                className="space-y-8 lg:space-y-12"
                            >
                                {/* Main headline */}
                                <div className="space-y-6">
                                    <motion.h1
                                        initial={{ opacity: 0, y: 30 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.4, duration: 0.8 }}
                                        className="text-5xl md:text-7xl font-thin leading-[0.9] tracking-tight text-white"
                                    >
                                        Curated
                                    </motion.h1>
                                    <motion.h1
                                        initial={{ opacity: 0, y: 30 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.5, duration: 0.8 }}
                                        className="text-5xl md:text-7xl font-thin leading-[0.9] tracking-tight"
                                    >
                                        <span className="text-[#B08D57]">Excellence</span>
                                    </motion.h1>
                                    <motion.h1
                                        initial={{ opacity: 0, y: 30 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.6, duration: 0.8 }}
                                        className="text-5xl md:text-7xl font-thin leading-[0.9] tracking-tight text-white"
                                    >
                                        in Every Detail
                                    </motion.h1>
                                </div>
                                
                                {/* Subtitle */}
                                <motion.p
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.7, duration: 0.8 }}
                                    className="text-lg lg:text-xl text-zinc-400 font-light leading-relaxed max-w-lg"
                                >
                                    Where distinguished taste meets sophisticated artistry.{" "}
                                    <span className="text-[#B08D57]">Crafted for the discerning.</span>
                                </motion.p>
                                
                                {/* CTA Button */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.8, duration: 0.8 }}
                                    className="pt-4"
                                >
                                    <Link href="/admin/dashboard">
                                        <motion.button
                                            whileHover={{ 
                                                scale: 1.02,
                                                y: -2
                                            }}
                                            whileTap={{ scale: 0.98 }}
                                            className="group relative px-12 py-4 bg-[#B08D57] text-black font-normal rounded-none text-base tracking-wide transition-all duration-500 hover:bg-white hover:text-black border-none overflow-hidden"
                                        >
                                            <span className="relative z-10 tracking-[0.1em] uppercase font-light">
                                                Elevate Your Signature
                                            </span>
                                            <motion.div 
                                                className="absolute inset-0 bg-white"
                                                initial={{ x: "-100%" }}
                                                whileHover={{ x: "0%" }}
                                                transition={{ duration: 0.5, ease: "easeInOut" }}
                                            />
                                        </motion.button>
                                    </Link>
                                </motion.div>
                            </motion.div>
                        </div>

                        {/* Right side - Single luxury image */}
                        <div className="lg:col-span-5 xl:col-span-6 order-1 lg:order-2">
                            <motion.div
                                initial={{ opacity: 0, x: 40 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 1, ease: "easeOut", delay: 0.4 }}
                                className="relative group"
                            >
                                {/* Main image container */}
                                <div className="relative aspect-[3/4] max-w-md mx-auto lg:max-w-lg xl:max-w-xl">
                                    <motion.div
                                        whileHover={{ scale: 1.02 }}
                                        transition={{ duration: 0.6, ease: "easeOut" }}
                                        className="relative w-full h-full overflow-hidden"
                                    >
                                        <img
                                            src="/posts/post2.png"
                                            alt="Curated Excellence"
                                            className="w-full h-full object-cover transition-all duration-700 group-hover:scale-105"
                                        />
                                        
                                        {/* Subtle overlay on hover */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-700" />
                                        
                                        {/* Luxury border accent */}
                                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-700 pointer-events-none"
                                            style={{
                                                boxShadow: `inset 0 0 0 1px rgba(176, 141, 87, 0.3)`
                                            }} 
                                        />
                                    </motion.div>
                                    
                                    {/* Floating engagement indicator */}
                                    <motion.div 
                                        className="absolute bottom-6 left-6 opacity-0 group-hover:opacity-100 transition-all duration-500"
                                        initial={{ y: 10 }}
                                        whileHover={{ y: 0 }}
                                    >
                                        <div className="flex items-center gap-2 backdrop-blur-md bg-black/40 rounded-full px-4 py-2 border border-white/10">
                                            <Heart className="w-4 h-4 text-[#B08D57] fill-[#B08D57]" />
                                            <span className="text-sm font-light text-white">127K</span>
                                        </div>
                                    </motion.div>
                                </div>
                                
                                {/* Decorative accent */}
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 1, duration: 0.8 }}
                                    className="absolute -top-4 -right-4 w-24 h-24 border border-[#B08D57]/20 rounded-full opacity-30"
                                />
                            </motion.div>
                        </div>
                    </div>

                    {/* Bottom metrics - Luxury style */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1, duration: 0.8 }}
                        className="pt-16 lg:pt-24 border-t border-zinc-800/50"
                    >
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-8 max-w-4xl mx-auto">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-[#B08D57]/10 flex items-center justify-center">
                                    <User className="w-5 h-5 text-[#B08D57]" />
                                </div>
                                <div className="space-y-1">
                                    <div className="text-2xl font-thin text-white">{userCount}+</div>
                                    <div className="text-sm font-light text-zinc-500 tracking-wide uppercase">Connoisseurs</div>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} className="w-4 h-4 fill-[#B08D57] text-[#B08D57]" />
                                    ))}
                                </div>
                                <div className="space-y-1">
                                    <div className="text-sm font-light text-white">Exclusively</div>
                                    <div className="text-sm font-light text-[#B08D57] tracking-wide uppercase">Five Stars</div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default HeroX;