"use client"

import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button';
import { LinkIcon } from 'lucide-react';

const HeroX = () => {
    return (
        <div
            className="w-full bg-black text-white relative overflow-hidden"
        >
            <div className="container mx-auto px-4">
                <div className="flex flex-col lg:flex-row items-center justify-between py-16 lg:py-28 min-h-[80vh] lg:min-h-screen">
                    {/* Text content section */}
                    <div className="w-full lg:w-1/2 z-10 mb-12 lg:mb-0 text-center lg:text-left">
                        <p className=" text-zinc-500 font-semibold mb-8 md:mb-10 max-w-md mx-auto lg:mx-0 hero-pretext">#1 AI video clipping & editing tool</p>
                        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold mb-6 md:mb-8 tracking-tight">
                            <span className="block hero-text bg-gradient-to-r from-white to-zinc-300 bg-clip-text text-transparent">1 long video,</span>
                            <span className="block hero-text bg-gradient-to-r from-white to-zinc-300 bg-clip-text text-transparent">10 viral clips.</span>
                            <span className="block hero-text bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">Create 10x faster.</span>
                        </h1>
                        <p className="text-lg sm:text-xl md:text-2xl text-zinc-300 mb-8 md:mb-10 max-w-md mx-auto lg:mx-0 hero-subtext">
                            Mellvitta ai turns long videos into short viral clips in secounds ✦
                        </p>
                         
                        {/* Responsive Input Section */}
                        <div className="flex items-center justify-center mt-5 mx-auto lg:mx-0">
                            <div className="w-full flex flex-col sm:flex-row bg-black md:bg-zinc-800 items-stretch sm:items-center rounded-full gap-2 sm:gap-0 p-2">
                                {/* Input Section */}
                                <div className="flex items-center flex-1 bg-zinc-800 md:bg-transparent sm:bg-transparent rounded-full py-[5px] md:py-3 px-4 sm:px-6 min-w-0">
                                    <LinkIcon className="text-zinc-500 w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                                    <input 
                                        type="text" 
                                        className="w-full focus:outline-none bg-transparent placeholder:text-base sm:placeholder:text-lg md:placeholder:text-xl placeholder:font-semibold font-semibold text-base sm:text-lg md:text-xl placeholder:text-zinc-500 py-2 px-3 ml-2 min-w-0" 
                                        placeholder="Drop a YouTube link" 
                                    />
                                </div>
                                
                                {/* Button Section */}
                                <div className="flex-shrink-0 w-full sm:w-auto">
                                    <Link href="/admin/dashboard">
                                        <Button className="w-full sm:w-auto text-base sm:text-lg md:text-xl px-6 sm:px-8 md:px-10 py-5 sm:py-6 md:py-7 rounded-full font-medium transition-all duration-300 shadow-lg hover:shadow-zinc-100/30 whitespace-nowrap">
                                            Get Clips
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </div>
                     </div>
                    
                    {/* Video Section */}
                    <div className="w-full lg:w-1/2 flex justify-center relative">
                        <video
                            className="w-full h-auto max-w-sm sm:max-w-md lg:max-w-lg rounded-lg shadow-lg"
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