"use client"

import React,{useEffect} from 'react';
import { motion } from 'framer-motion';
import { Users, Star } from 'lucide-react';
import Link from 'next/link';
import DemoModal from './DemoModal';

const Hero = () => {
    // State to hold the screen width. Initialized to 0 to ensure window is only accessed client-side.
    const [screenWidth, setScreenWidth] = React.useState(0);
    const [userCount, setUserCount] = React.useState(100);

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
    

    // Effect to get and update screen width.
    React.useEffect(() => {
        // This code runs only on the client.
        setScreenWidth(window.innerWidth);
        const handleResize = () => setScreenWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);

        // Cleanup listener on component unmount.
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Thumbnail data (shortened for brevity)
    const topRowThumbnails = [
        { id: 1, views: "2.5M+ views", image: "https://res.cloudinary.com/db17zxsjc/image/upload/v1751443920/abe5dffd-c63d-4e8d-b6bb-8c3a830b0023_mp71c1.png" },
        { id: 2, views: "1.8M+ views", image: "https://res.cloudinary.com/db17zxsjc/image/upload/v1751445228/bd65e67c-6aca-44e9-a284-cb2c15cf461b_ka8vdh.png" },
        { id: 3, views: "3.2M+ views", image: "https://res.cloudinary.com/db17zxsjc/image/upload/v1751443923/Picsart_25-07-02_11-33-12-047_btpmde.jpg" },
        { id: 4, views: "950K+ views", image: "https://res.cloudinary.com/db17zxsjc/image/upload/v1751443917/51ec7380-0ccc-41a9-8e97-450d6e0459fc_sxmufe.png" },
        { id: 5, views: "1.4M+ views", image: "https://res.cloudinary.com/db17zxsjc/image/upload/v1751444745/8170635f-a94e-4bf1-8a79-1623d5aaff38_rekna5.png" }
    ];
    const bottomRowThumbnails = [
        { id: 6, views: "2.1M+ views", image: "https://res.cloudinary.com/db17zxsjc/image/upload/v1751443918/26392cd7-19e2-4fc5-ae58-30f35378de2b_qivzu1.png" },
        { id: 7, views: "1.7M+ views", image: "https://res.cloudinary.com/db17zxsjc/image/upload/v1751443919/718b53fb4b884bafa139275c46a88841_faceswap_output_hiyqeu.webp" },
        { id: 8, views: "2.8M+ views", image: "https://res.cloudinary.com/db17zxsjc/image/upload/v1751443920/Picsart_25-07-02_11-25-25-498_ajaxff.png" },
        { id: 9, views: "1.3M+ views", image: "https://res.cloudinary.com/db17zxsjc/image/upload/v1751443917/0916b72b-956a-40a5-b517-973ffc5010cc_irosmp.png" },
        { id: 10, views: "3.5M+ views", image: "https://res.cloudinary.com/db17zxsjc/image/upload/v1751443917/e50e32dc-2fea-4396-84d8-b27344064905_qh1yee.png" }
    ];

    // Create multiple copies for a seamless infinite scroll effect.
    const topRowDuplicated = [...topRowThumbnails, ...topRowThumbnails, ...topRowThumbnails];
    const bottomRowDuplicated = [...bottomRowThumbnails, ...bottomRowThumbnails, ...bottomRowThumbnails];

    interface Thumbnail {
        id: number;
        views: string;
        image: string;
    }

    const ThumbnailCard = ({ thumbnail }: { thumbnail: Thumbnail, index: number }) => (
        <motion.div
            className="relative group cursor-pointer flex-shrink-0"
            style={{
                width: screenWidth < 640 ? '200px' : '280px',
                height: screenWidth < 640 ? '112px' : '157px'
            }}
            whileHover={{ scale: 1.05, zIndex: 10 }}
            transition={{ type: 'spring', stiffness: 300 }}
        >
            <div className="relative w-full h-full rounded-lg overflow-hidden shadow-lg">
                <img
                    src={thumbnail.image}
                    alt="ai thumbnail"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{
                        boxShadow: `0 0 25px rgba(71, 255, 231, 0.4), 0 0 50px rgba(71, 255, 231, 0.3)`
                    }} />
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                <p className="text-xs font-semibold text-gray-200">{thumbnail.views}</p>
            </div>
        </motion.div>
    );

    return (
        <div className="min-h-screen text-white relative overflow-hidden flex justify-center items-center">
            {/* Main content */}
            <div className="container mx-auto px-4 lg:px-8 py-16">
                <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
                    {/* Left side - Text content */}
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8 }}
                        className="flex flex-col gap-4 md:gap-6 w-full min-w-0"
                    >
                         {/* Badge */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="inline-flex items-center px-4 py-2 rounded-full border border-gray-700 bg-gray-800/50 backdrop-blur-sm w-fit"
                        >
                            <span className="w-2 h-2 bg-[#47FFE7] rounded-full mr-2.5"></span>
                            <span className="text-sm font-medium">Cravio.ai v3</span>
                        </motion.div>

                        {/* Heading */}
                        <div className="space-y-3">
                            <motion.h1
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight"
                            >
                                Viral <span className="text-[#47FFE7]" style={{ filter: 'drop-shadow(0 0 10px rgba(71, 255, 231, 0.3))' }}>Thumbnails</span>
                            </motion.h1>
                            <motion.h1
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight"
                            >
                                & <span className="text-[#47FFE7]" style={{ filter: 'drop-shadow(0 0 10px rgba(71, 255, 231, 0.3))' }}>Titles</span> in Seconds
                            </motion.h1>
                        </div>
                        
                        {/* Subtitle & CTA */}
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="md:text-xl text-zinc-300"
                        >
                            Ideate & package your videos faster & cheaper.
                        </motion.p>
                        
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 }}
                            className="pt-4 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
                        >
                           <Link href="/admin/dashboard"> <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="px-8 py-4 bg-[#47FFE7] text-black font-semibold rounded-full text-base"
                                style={{ boxShadow: '0 4px 30px rgba(71, 255, 231, 0.3)' }}
                            >
                                Try for Free
                            </motion.button></Link>
                            <DemoModal />
                        </motion.div>

                        {/* Stats & Rating */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.7 }}
                            className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8 pt-8"
                        >
                            <div className="flex items-center gap-2">
                                <Users className="w-5 h-5 text-gray-400" />
                                <span className="text-base text-gray-300">Trusted by {userCount}+ Users</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} className="w-4 h-4 fill-[#47FFE7] text-[#47FFE7]" />
                                    ))}
                                </div>
                                <span className="text-base text-gray-400">from 75+ Reviews</span>
                            </div>
                        </motion.div>
                    </motion.div>

                    {/* Right side - Thumbnail carousel */}
                    <div className="relative">
                        <div className="space-y-4 sm:space-y-6">
                            {/* Top Row */}
                            <div className="overflow-hidden">
                                <motion.div
                                    className="flex gap-4 sm:gap-6"
                                    animate={{ x: ["0%", "-66.67%"] }}
                                    transition={{
                                        ease: "linear",
                                        duration: screenWidth < 640 ? 80 : 25, // ✅ VERY SLOW on mobile
                                        repeat: Infinity,
                                    }}
                                >
                                    {topRowDuplicated.map((thumb, i) => <ThumbnailCard key={`top-${i}`} thumbnail={thumb} index={i} />)}
                                </motion.div>
                            </div>
                            {/* Bottom Row */}
                            <div className="overflow-hidden">
                                <motion.div
                                    className="flex gap-4 sm:gap-6"
                                    animate={{ x: ["-66.67%", "0%"] }}
                                    transition={{
                                        ease: "linear",
                                        duration: screenWidth < 640 ? 80 : 25, // ✅ VERY SLOW on mobile
                                        repeat: Infinity,
                                    }}
                                >
                                    {bottomRowDuplicated.map((thumb, i) => <ThumbnailCard key={`bottom-${i}`} thumbnail={thumb} index={i} />)}
                                </motion.div>
                            </div>
                        </div>
                        {/* Fading overlays */}
                        <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-black to-transparent pointer-events-none z-20" />
                        <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-black to-transparent pointer-events-none z-20" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Hero;