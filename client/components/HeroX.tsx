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
                        <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold mb-8 tracking-tight">
                            <span className="block hero-text bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">1 long video,</span>
                            <span className="block hero-text bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">10 viral clips.</span>
                            <span className="block hero-text bg-gradient-to-r from-white via-white to-red-300 bg-clip-text text-transparent">Create 10x faster.</span>
                        </h1>
                        <p className="text-xl md:text-2xl text-gray-300 mb-10 max-w-md mx-auto lg:mx-0 hero-subtext">
                            Cravio ai turns long videos into short viral clips in secounds ✨
                        </p>

                        <div className="flex items-center mt-5">
                            <div className="flex md:flex-row flex-col md:bg-zinc-800 bg-black items-center rounded-full gap-3 md:gap-0 md:p-2 p-0 pl-0 md:pl-6 ">
                                <div className="flex items-center md:bg-transparent bg-zinc-800 rounded-full py-2 px-5">
                                    <LinkIcon className="text-zinc-500 w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
                                    <input type="text" className="focus:outline-none  placeholder:text-xl placeholder:font-semibold font-semibold text-xl  placeholder:text-zinc-500 rounded-md py-2 px-3 ml-2" placeholder="Drop a YouTube link" />
                                </div>
                                <div className="w-full">
                                    <Link href="/admin/dashboard"><Button className="text-xl w-full px-10 py-7 rounded-full font-medium transition-all duration-300 shadow-lg hover:shadow-zinc-100/30">
                                        Get Clips
                                    </Button></Link>
                                </div>
                            </div>
                        </div>

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
