"use client"

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Star, Heart } from 'lucide-react';
import Link from 'next/link';

const HeroX = () => {
    const [screenWidth, setScreenWidth] = React.useState(0);
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

    React.useEffect(() => {
        setScreenWidth(window.innerWidth);
        const handleResize = () => setScreenWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Instagram-style posts with 9:16 aspect ratio
    const topRowPosts = [
        { id: 1, likes: "127K", image: "/posts/post1.jpeg" },
        { id: 2, likes: "89K", image: "/posts/post2.png" },
        { id: 3, likes: "203K", image: "/posts/post11.jpeg" },
        { id: 4, likes: "95K", image: "/posts/post4.jpeg" },
        { id: 5, likes: "156K", image: "/posts/post12.jpeg" }
    ];
    
    const bottomRowPosts = [
        { id: 6, likes: "178K", image: "/posts/post6.jpeg" },
        { id: 7, likes: "143K", image: "/posts/post7.jpeg" },
        { id: 8, likes: "267K", image: "/posts/post8.jpeg" },
        { id: 9, likes: "112K", image: "/posts/post9.jpeg" },
        { id: 10, likes: "234K", image: "/posts/post10.jpeg" }
    ];

    const topRowDuplicated = [...topRowPosts, ...topRowPosts, ...topRowPosts];
    const bottomRowDuplicated = [...bottomRowPosts, ...bottomRowPosts, ...bottomRowPosts];

    interface Post {
        id: number;
        likes: string;
        image: string;
    }

    const PostCard = ({ post }: { post: Post }) => (
        <motion.div
            className="relative group cursor-pointer flex-shrink-0"
            style={{
                width: screenWidth < 640 ? '140px' : '200px',
                height: screenWidth < 640 ? '249px' : '356px' // 9:16 aspect ratio
            }}
            whileHover={{ 
                scale: 1.02,
                y: -4
            }}
            transition={{ 
                type: 'spring', 
                stiffness: 400,
                damping: 25
            }}
        >
            <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl">
                <img
                    src={post.image}
                    alt="luxury content"
                    className="w-full h-full object-cover transition-all duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500" />
                
                {/* Luxury border glow effect */}
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-500"
                    style={{
                        boxShadow: `0 0 30px rgba(176, 141, 87, 0.3), 0 0 60px rgba(176, 141, 87, 0.2), inset 0 0 1px rgba(176, 141, 87, 0.4)`
                    }} />
            </div>
            
            {/* Instagram-style like counter */}
            <motion.div 
                className="absolute bottom-4 left-4 right-4 text-white opacity-0 group-hover:opacity-100 transition-all duration-500"
                initial={{ y: 10 }}
                whileHover={{ y: 0 }}
            >
                <div className="flex items-center gap-2 backdrop-blur-sm bg-black/30 rounded-full px-3 py-1.5">
                    <Heart className="w-4 h-4 text-[#B08D57] fill-[#B08D57]" />
                    <span className="text-sm font-medium">{post.likes}</span>
                </div>
            </motion.div>
        </motion.div>
    );

    return (
        <div className="min-h-screen text-white relative overflow-hidden flex justify-center items-center">
            {/* Subtle background pattern */}
            <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0" style={{
                    backgroundImage: `radial-gradient(circle at 25% 25%, rgba(176, 141, 87, 0.1) 0%, transparent 25%)`,
                    backgroundSize: '200px 200px'
                }} />
            </div>

            <div className="container mx-auto px-6 lg:px-12 py-20">
                <div className="grid md:grid-cols-2 gap-16 md:gap-20 items-center">
                    {/* Left side - Premium content */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="flex flex-col gap-6 md:gap-8 w-full min-w-0"
                    >
                        {/* Exclusive badge */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3, duration: 0.8 }}
                            className="inline-flex items-center px-5 py-2.5 rounded-full border border-[#B08D57]/30 bg-[#B08D57]/10 backdrop-blur-md w-fit"
                        >
                            <span className="w-2 h-2 bg-[#B08D57] rounded-full mr-3 animate-pulse"></span>
                            <span className="text-sm font-light tracking-wide">CRAVIO.AI ATELIER</span>
                        </motion.div>

                        {/* Luxury headline */}
                        <div className="space-y-4">
                            <motion.h1
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5, duration: 0.8 }}
                                className="text-5xl sm:text-6xl lg:text-7xl font-extralight leading-[0.95] tracking-tight"
                            >
                                Curated <span className="text-[#B08D57] font-light">Excellence</span>
                            </motion.h1>
                            <motion.h1
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.6, duration: 0.8 }}
                                className="text-5xl sm:text-6xl lg:text-7xl font-extralight leading-[0.95] tracking-tight"
                            >
                                in <span className="text-[#B08D57] font-light">Every Detail</span>
                            </motion.h1>
                        </div>
                        
                        {/* Refined subtitle */}
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.7, duration: 0.8 }}
                            className="text-xl lg:text-2xl text-zinc-300 font-light leading-relaxed max-w-xl"
                        >
                            Where distinguished taste meets sophisticated artistry. 
                            <span className="text-[#B08D57]"> Crafted for the discerning.</span>
                        </motion.p>
                        
                        {/* Premium CTA */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.8, duration: 0.8 }}
                            className="pt-8"
                        >
                            <Link href="/admin/dashboard">
                                <motion.button
                                    whileHover={{ 
                                        scale: 1.02,
                                        boxShadow: "0 10px 40px rgba(176, 141, 87, 0.3)"
                                    }}
                                    whileTap={{ scale: 0.98 }}
                                    className="group px-10 py-4 bg-[#B08D57] text-black font-medium rounded-full text-lg tracking-wide transition-all duration-300 hover:bg-[#B08D57]/90 relative overflow-hidden"
                                >
                                    <span className="relative z-10">Elevate Your Signature</span>
                                    <div className="absolute inset-0 bg-gradient-to-r from-[#B08D57] to-[#D4AF37] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                </motion.button>
                            </Link>
                        </motion.div>

                        {/* Exclusive metrics */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.9, duration: 0.8 }}
                            className="flex flex-col sm:flex-row sm:items-center gap-6 sm:gap-12 pt-12"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-[#B08D57]/20 flex items-center justify-center">
                                    <User className="w-4 h-4 text-[#B08D57]" />
                                </div>
                                <span className="text-lg text-zinc-300 font-light">
                                    {userCount}+ <span className="text-[#B08D57]">Connoisseurs</span>
                                </span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} className="w-5 h-5 fill-[#B08D57] text-[#B08D57]" />
                                    ))}
                                </div>
                                <span className="text-lg text-zinc-400 font-light">
                                    Exclusively <span className="text-[#B08D57]">Five Stars</span>
                                </span>
                            </div>
                        </motion.div>
                    </motion.div>

                    {/* Right side - Instagram feed */}
                    <motion.div 
                        className="relative"
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 1, ease: "easeOut", delay: 0.4 }}
                    >
                        <div className="space-y-6 sm:space-y-8">
                            {/* Top Row */}
                            <div className="overflow-hidden">
                                <motion.div
                                    className="flex gap-4 sm:gap-6"
                                    animate={{ x: ["0%", "-66.67%"] }}
                                    transition={{
                                        ease: "linear",
                                        duration: screenWidth < 640 ? 120 : 40, // Slower, more elegant
                                        repeat: Infinity,
                                    }}
                                >
                                    {topRowDuplicated.map((post, i) => (
                                        <PostCard key={`top-${i}`} post={post} />
                                    ))}
                                </motion.div>
                            </div>
                            
                            {/* Bottom Row */}
                            <div className="overflow-hidden">
                                <motion.div
                                    className="flex gap-4 sm:gap-6"
                                    animate={{ x: ["-66.67%", "0%"] }}
                                    transition={{
                                        ease: "linear",
                                        duration: screenWidth < 640 ? 120 : 40, // Slower, more elegant
                                        repeat: Infinity,
                                    }}
                                >
                                    {bottomRowDuplicated.map((post, i) => (
                                        <PostCard key={`bottom-${i}`} post={post} />
                                    ))}
                                </motion.div>
                            </div>
                        </div>
                        
                        {/* Elegant fade overlays */}
                        <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-black via-black/80 to-transparent pointer-events-none z-20" />
                        <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-black via-black/80 to-transparent pointer-events-none z-20" />
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default HeroX;