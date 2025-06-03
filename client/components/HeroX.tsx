"use client"

import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button';

const HeroX = () => {
    return (
        <div
            className="w-full bg-black text-white relative overflow-hidden"
        >
            <div className="container mx-auto px-4">
                <div className="flex flex-col lg:flex-row items-center justify-between py-16 lg:py-28 min-h-[80vh] lg:min-h-screen">
                    {/* Text content section */}
                    <div className="w-full lg:w-1/2 z-10 mb-12 lg:mb-0 text-center lg:text-left">
                        <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold mb-8 tracking-tight">
                            <span className="block hero-text bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">1 long video,</span>
                            <span className="block hero-text bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">10 viral clips.</span>
                            <span className="block hero-text bg-gradient-to-r from-white via-white to-red-300 bg-clip-text text-transparent">Create 10x faster.</span>
                        </h1>
                        <p className="text-xl md:text-2xl text-gray-300 mb-10 max-w-md mx-auto lg:mx-0 hero-subtext">
                            Cravio ai turns long videos into short viral clips in secounds ✨
                        </p>
                        <Link href="/admin/dashboard"><div className="hero-cta relative inline-block">
                            <div className="pulse-ring absolute inset-0 border-2 border-red-500 rounded-md opacity-70"></div>
                            <Button className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white text-xl px-10 py-7 rounded-md font-medium transition-all duration-300 shadow-lg hover:shadow-red-500/30">
                                Get Started
                            </Button>
                        </div></Link>
                    </div>
                    <div className="w-full lg:w-1/2 flex justify-center relative ">
                        <video
                            className="w-full h-auto max-w-lg rounded-lg shadow-lg"
                            autoPlay
                            loop
                            muted
                            src="/opus.mp4"
                        ></video>
                    </div>

                </div>

            </div>
        </div>
    );
};

export default HeroX;
