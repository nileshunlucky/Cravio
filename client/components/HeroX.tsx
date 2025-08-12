"use client"

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const HeroX = () => {
    const [userCount, setUserCount] = useState(100);
    const router = useRouter()

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

    const handleImageClick = (prompt: string, imageUrl: string) => {
        const encodedPrompt = encodeURIComponent(prompt);
        const encodedImage = encodeURIComponent(imageUrl);
        router.push(`/admin/canvas?prompt=${encodedPrompt}&referenceImage=${encodedImage}`);
    };

    return (
        <div className="min-h-screen bg-black text-white relative overflow-hidden">
            {/* Subtle animated background */}
            <div className="absolute inset-0">
                <motion.div
                    animate={{
                        scale: [1, 1.1, 1],
                        opacity: [0.1, 0.2, 0.1]
                    }}
                    transition={{
                        duration: 8,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    className="absolute top-1/3 left-1/4 w-96 h-96 bg-gradient-to-r from-[#C9A96E] to-[#B08D57] rounded-full blur-3xl"
                />
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.05, 0.15, 0.05]
                    }}
                    transition={{
                        duration: 10,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 2
                    }}
                    className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-gradient-to-l from-[#ad8544] to-[#B08D57] rounded-full blur-3xl"
                />
            </div>

            {/* Main content */}
            <div className="relative z-10 container mx-auto px-6 lg:px-16 xl:px-24 py-16 lg:py-24">

                {/* Content grid */}
                <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center min-h-[70vh]">

                    {/* Left side - Content */}
                    <div className="lg:col-span-7 order-2 lg:order-1">
                        <motion.div
                            initial={{ opacity: 0, x: -40 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="space-y-10 lg:space-y-12"
                        >
                            {/* Hook headline */}
                            <div className="space-y-4">
                                <motion.h1
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2, duration: 0.8 }}
                                    className="text-5xl md:text-6xl lg:text-7xl font-light leading-[0.9] tracking-tight"
                                >
                                    <span className="text-white">Your</span>
                                </motion.h1>
                                <motion.h1
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3, duration: 0.8 }}
                                    className="text-5xl md:text-6xl lg:text-7xl font-light leading-[0.9] tracking-tight"
                                >
                                    <span className="bg-gradient-to-r from-[#C9A96E] via-[#B08D57] to-[#ad8544] bg-clip-text text-transparent">
                                        Content Empire
                                    </span>
                                </motion.h1>
                                <motion.h1
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4, duration: 0.8 }}
                                    className="text-5xl md:text-6xl lg:text-7xl font-light leading-[0.9] tracking-tight text-white"
                                >
                                    Starts Here
                                </motion.h1>
                            </div>

                            {/* Subtitle */}
                            <motion.p
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5, duration: 0.8 }}
                                className="text-xl lg:text-2xl text-gray-400 font-light leading-relaxed max-w-2xl"
                            >
                                Generate viral-ready images and videos that get millions of views.
                            </motion.p>

                            {/* CTA Button */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.6, duration: 0.8 }}
                                className="pt-6"
                            >
                                <Link href="/admin/explore">
                                    <motion.button
                                        whileHover={{
                                            scale: 1.05,
                                            y: -3
                                        }}
                                        whileTap={{ scale: 0.95 }}
                                        className="group relative px-10 py-5 bg-gradient-to-r from-[#C9A96E] via-[#B08D57] to-[#ad8544] text-black font-medium rounded-2xl text-lg transition-all duration-300 hover:shadow-2xl hover:shadow-[#B08D57]/25 flex items-center gap-3"
                                    >
                                        <span className="font-medium">Start Creating</span>
                                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />


                                    </motion.button>
                                </Link>
                            </motion.div>

                            {/* Social proof */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.7, duration: 0.8 }}
                                className="flex items-center gap-8 pt-8"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#C9A96E] to-[#B08D57] p-[1px]">
                                        <div className="w-full h-full bg-black rounded-full flex items-center justify-center">
                                            <Users className="w-5 h-5 text-[#B08D57]" />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-2xl font-light text-white">{userCount.toLocaleString()}+</div>
                                        <div className="text-sm text-gray-500">Creators</div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#C9A96E] to-[#B08D57] p-[1px]">
                                        <div className="w-full h-full bg-black rounded-full flex items-center justify-center">
                                            <Sparkles className="w-5 h-5 text-[#B08D57]" />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-2xl font-light text-white">100k+</div>
                                        <div className="text-sm text-gray-500">Generated</div>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    </div>

                    {/* Right side - Influencer showcase */}
                    <div className="lg:col-span-5 order-1 lg:order-2">
                        <motion.div
                            initial={{ opacity: 0, x: 40 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
                            className="relative max-w-md mx-auto lg:max-w-lg"
                        >
                            {/* Main influencer image */}
                            <motion.div
                                onClick={() => handleImageClick("A full-body, low-angle editorial fashion photo of a young woman in a glossy deep-violet oversized quilted suit with matching pants and jacket, hands in pockets, wearing chunky black leather shoes and a large geometric black cone hat, standing confidently in the center of a lush tropical greenhouse under a symmetrical glass dome with dense monstera and palm leaves around, shot with a 16mm wide-angle lens in natural diffused daylight, ultra-detailed and realistic.",

                                    "https://res.cloudinary.com/deoxpvjjg/image/upload/v1754964016/5e9506e1-f0c1-49d5-b32e-be3bbd33dadd_nw9uh6.png")}
                                whileHover={{ scale: 1.02 }}
                                transition={{ duration: 0.4 }}
                                className="relative aspect-[3/4] rounded-3xl overflow-hidden shadow-2xl mb-8 cursor-pointer"
                            >
                                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent z-10" />
                                <img

                                    src="https://res.cloudinary.com/deoxpvjjg/image/upload/v1754964016/5e9506e1-f0c1-49d5-b32e-be3bbd33dadd_nw9uh6.png"
                                    alt="Content creator using AI"
                                    className="w-full h-full object-cover"
                                />

                            </motion.div>

                            {/* Floating stats card */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 1.2, duration: 0.6 }}
                                className="absolute bottom-3 left-0 right-0 mx-6"
                            >
                                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
                                    <div className="flex items-center justify-center">
                                        <div>
                                            <div className="md:text-lg text-sm font-light text-white">A full-body, low-angle editorial fashion photo of a young woman in a glossy deep-violet oversized quilted suit with matching pants and jacket, hands in pockets, wearing chunky black leather shoes and a large geometric black cone hat, standing confidently in the center of a lush tropical greenhouse under a symmetrical glass dome with dense monstera and palm leaves around, shot with a 16mm wide-angle lens in natural diffused daylight, ultra-detailed and realistic.
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Decorative floating elements */}
                            <motion.div
                                animate={{
                                    y: [0, -10, 0],
                                    rotate: [0, 5, 0]
                                }}
                                transition={{
                                    duration: 4,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                }}
                                className="absolute top-1/2 -left-12 w-6 h-6 bg-gradient-to-r from-[#C9A96E] to-[#B08D57] rounded-full opacity-60"
                            />

                            <motion.div
                                animate={{
                                    y: [0, 10, 0],
                                    rotate: [0, -5, 0]
                                }}
                                transition={{
                                    duration: 5,
                                    repeat: Infinity,
                                    ease: "easeInOut",
                                    delay: 1
                                }}
                                className="absolute top-1/4 -right-8 w-4 h-4 bg-gradient-to-r from-[#B08D57] to-[#ad8544] rounded-full opacity-40"
                            />
                        </motion.div>
                    </div>


                </div>
            </div>
        </div>
    );
};

export default HeroX;