"use client"

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

const HeroX = () => {
    const [userCount, setUserCount] = useState(100);

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
            {/* Subtle background gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-black via-gray-900/20 to-black" />
            
            {/* Main content */}
            <div className="relative z-10 container mx-auto px-6 py-20 lg:py-32">
                <div className="max-w-4xl mx-auto text-center space-y-16">
                    
                    {/* Headline Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="space-y-6 mx-auto"
                    >
                        <h1 className="text-6xl md:text-8xl font-light tracking-tight leading-[0.9] text-center">
<span className="block bg-gradient-to-r from-[#ffffff] via-[#cfcfcf] to-[#7a7a7a] bg-clip-text text-transparent text-5xl md:text-7xl">
  Create Your Own
</span>

  <span className="block bg-gradient-to-r from-[#C9A96E] via-[#B08D57] to-[#ad8544] bg-clip-text text-transparent">
    AI Influencer
  </span>
</h1>

                        
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3, duration: 0.8 }}
                            className="text-lg lg:text-xl text-gray-400 font-light max-w-2xl mx-auto leading-relaxed"
                        >
                            Build your AI influencer instantly. scale your reach, and unlock new income streams with Exclusive cOOntent.
                        </motion.p>
                    </motion.div>

                    {/* Hero Image */}
                    <motion.div
                        initial={{ opacity: 0, y: 60 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, duration: 1, ease: "easeOut" }}
                        className="relative max-w-3xl mx-auto"
                    >
                        {/* Enhanced white glow effect behind image */}
                        <div className="absolute inset-0 -m-5">
                            <div className="absolute inset-0 bg-gradient-to-t from-white/10 via-white/90 to-white/10 rounded-full blur-[100px] scale-125" />
                            <div className="absolute inset-0 bg-white/20 rounded-full blur-[60px] scale-110" />
                            <div className="absolute inset-0 bg-white/15 blur-[120px] scale-100" />
                        </div>
                        
                        <div className="relative rounded-3xl overflow-hidden shadow-2xl z-10">
                            <img 
                                src="https://res.cloudinary.com/deoxpvjjg/image/upload/v1756033329/herox_xq8x8r.png"
                                alt="AI Influencers"
                                className="w-full h-auto object-cover"
                            />
                            {/* Subtle overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent" />
                        </div>
                        
                        {/* Floating stats */}
<motion.div
  initial={{ opacity: 0, scale: 0.8 }}
  animate={{ opacity: 1, scale: 1 }}
  transition={{ delay: 1.2, duration: 0.6 }}
  className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 z-50 w-max max-w-full px-2"
>
  <div className="bg-gradient-to-r from-[#f9f9f9]/90 via-[#dcdcdc]/90 to-[#a1a1a1]/90 backdrop-blur-xl rounded-xl px-4 py-2 md:px-8 md:py-4 border border-white/20 shadow-lg text-center break-words">
    <div className="text-xs md:text-lg text-gray-800 leading-snug font-medium">
      Trusted by{' '}
      <span className="text-black font-semibold">{userCount.toLocaleString()}+</span>
      {' '} Creators
    </div>
  </div>
</motion.div>

                    </motion.div>

                    {/* CTA Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8, duration: 0.8 }}
                        className="pt-8"
                    >
                        <Link href="/admin/explore">
                            <motion.button
                            whileHover={{
                                scale: 1.02,
                                y: -2,
                                boxShadow: "0 10px 30px rgba(176, 141, 87, 0.3)"
                            }}
                            whileTap={{ scale: 0.98 }}
                            className={'group relative inline-flex items-center gap-2 justify-center z-20 w-full py-3 sm:py-4 px-4 sm:px-6 rounded-xl font-bold text-center transition-all duration-300 cursor-pointer bg-gradient-to-r from-[#E5C88C] via-[#B08D57] to-[#A47A3E] text-black hover:bg-[#B08D57]/80 shadow-lg'}
                            type="button"
                            role="button"
                            style={{ pointerEvents: 'auto' }}
                        >
                            {/* Button Background */}
                            <div className="absolute inset-0 bg-gradient-to-r from-[#E5C88C] via-[#B08D57] to-[#A47A3E] rounded-2xl blur-xl opacity-60 group-hover:opacity-80 transition-opacity duration-500 " />
                            <span>Get Started</span>

                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                        </motion.button>
                        </Link>
                    </motion.div>


                    

                </div>
            </div>

            {/* Bottom fade */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent" />
        </div>
    );
};

export default HeroX;