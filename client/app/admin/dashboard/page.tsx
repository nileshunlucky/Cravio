"use client"

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import {  Star, Download, Plus, User } from 'lucide-react';
import { toast } from "sonner";
import { useUser } from "@clerk/nextjs";
import { useRouter } from 'next/navigation';

const LoadingState = () => {
    const [percentage, setPercentage] = useState(0);
 


    // Simulate a realistic, non-linear progress animation
    useEffect(() => {
        let currentProgress = 0;

        const updateProgress = () => {
            if (currentProgress < 99) {
                let increment = 1;
                let delay = 50;

                if (currentProgress >= 50 && currentProgress < 75) {
                    increment = 0.5;
                    delay = 120;
                } else if (currentProgress >= 75) {
                    increment = 0.25;
                    delay = 200;
                }

                currentProgress += increment;
                setPercentage(Math.min(Math.round(currentProgress), 99));
                setTimeout(updateProgress, delay);
            }
        };

        updateProgress();
    }, []);



    return (
        <motion.div
            className="w-full aspect-video rounded-lg bg-zinc-900 overflow-hidden relative border"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            style={{
                boxShadow: '0 0 30px rgba(71, 255, 231, 0.1)'
            }}
        >
            {/* Dark background for the progress bar */}
            <div className="absolute inset-0 bg-zinc-800/70" />

            {/* The glowing progress bar */}
            <motion.div
                className="absolute top-0 left-0 h-full"
                style={{
                    background: 'linear-gradient(to right, #18181b, #47FFE7)', // zinc-900 to neon teal
                    boxShadow: '0 0 20px #47FFE7, 0 0 30px #47FFE7'
                }}
                initial={{ width: '0%' }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 0.1, ease: 'linear' }}
            />


            {/* The blurred percentage text */}
            <div className="absolute bottom-4 right-6">
                <p className="md:text-7xl text-4xl font-bold text-white/40 select-none" style={{ textShadow: '0 0 10px rgba(255, 255, 255, 0.1)' }}>
                    {percentage}%
                </p>
            </div>
        </motion.div>
    );
};


const Page = () => {
    const [youtubeUrl, setYoutubeUrl] = useState('');
    const [animation, setAnimation] = useState(false);
    const [loading, setLoading] = useState(false);
    const [thumbnailUrl, setThumbnailUrl] = useState('');
    const [prompt, setPrompt] = useState("");
    // 1. Add this list above your Page component
const PERSONAS = [
  { id: '1', name: 'Alex', image: 'https://github.com/shadcn.png' },
  { id: '2', name: 'Jordan', image: 'https://github.com/nutlope.png' },
];
const [selectedPersona, setSelectedPersona] = useState<{id: string, name: string, image: string} | null>(null);

// 2. Inside your Page component, add these states
const [isDropdownOpen, setIsDropdownOpen] = useState(false);
const dropdownRef = useRef<HTMLDivElement>(null);

// 3. Add this useEffect to close dropdown when clicking outside
useEffect(() => {
  const handleClick = (e: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
      setIsDropdownOpen(false);
    }
  };
  document.addEventListener("mousedown", handleClick);
  return () => document.removeEventListener("mousedown", handleClick);
}, []);

    const router = useRouter()

    const { user } = useUser();

    const handleDownload = () => {
        if (!thumbnailUrl) return;

        const link = document.createElement('a');
        link.href = thumbnailUrl;
        link.download = 'cravio_thumbnail.jpg'; // or .png
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleSubmit = async () => {
        try {
            setAnimation(true);
            setLoading(true);
           
            const email = user?.primaryEmailAddress?.emailAddress
             if(!email){
                toast.error("User Not found");
                return;
            }

            const formData = new FormData();
            formData.append('email', email);
             if(!youtubeUrl){
                toast.error("Select youtubeUrl");
                return;
            }
            formData.append('youtubeUrl', youtubeUrl);
            if(!selectedPersona){
                toast.error("Select Persona!");
                return;
            }
            formData.append('persona', selectedPersona.image);
            if(prompt){
             formData.append('prompt', prompt);
            }
            

            const res = await fetch('https://cravio-ai.onrender.com/api/faceswap', {
                method: 'POST',
                body: formData
            });

            const data = await res.json(); // Parse response once

            if (res.ok) {
                // Success case
                setThumbnailUrl(data.thumbnailUrl);
            } else {
                // Error case
                if (res.status === 403) {
                    toast.error("Not enough credits");
                    router.push("/admin/plan");
                    return;
                } else {
                    // Handle other errors
                    toast.error(data.message || "An error occurred");
                    setAnimation(false);
                    setLoading(false);
                }
            }

        } catch (error) {
            console.error('Error submitting form:', error);
            toast.error("Error sumbmitting form", {
                position: "top-center",
                duration: 4000,
            })
        } finally {
            setAnimation(false);
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen my-5 flex items-center text-center justify-center p-4">
            <AnimatePresence mode="wait">
                {
                    animation ?
                        (
                            <motion.div
                                key="result"
                                className="w-full max-w-2xl"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.5 }}
                            >
                                {loading ? (
                                    <LoadingState />
                                ) : thumbnailUrl ? (
                                    <motion.div
                                        whileHover={{ scale: 1.02 }}
                                        className="border-2 border-[#47FFE7] rounded-lg p-2 text-center cursor-pointer transition-colors relative"
                                        style={{ boxShadow: '0 0 20px rgba(71, 255, 231, 0.3)' }}
                                    >
                                        <img
                                            src={thumbnailUrl}
                                            alt="Generated Thumbnail"
                                            className="w-full object-contain rounded-md"
                                        />

                                        {/* Bottom center buttons */}
                                        <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 flex gap-3 z-10">
                                            <motion.div whileHover={{ scale: 1.1 }}>
                                                <Button onClick={handleDownload}
                                                    size="icon"
                                                    variant="secondary"
                                                    className="bg-zinc-900 border border-[#47FFE7] text-[#47FFE7] hover:bg-zinc-800 w-8 h-8 sm:w-10 sm:h-10"
                                                >
                                                    <Download className="w-4 h-4 sm:w-5 sm:h-5" />
                                                </Button>
                                            </motion.div>

                                            <motion.div whileHover={{ scale: 1.1 }}>
                                                <Button onClick={() => setAnimation(false)}
                                                    size="icon"
                                                    variant="secondary"
                                                    className="bg-zinc-900 border border-[#47FFE7] text-[#47FFE7] hover:bg-zinc-800 w-8 h-8 sm:w-10 sm:h-10"
                                                >
                                                     <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                                                </Button>
                                            </motion.div>
                                        </div>
                                    </motion.div>

                                ) : null}
                            </motion.div>
                        )
                        :
                        (
                            <motion.div
  key="form"
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  // Adjusted: p-6 for mobile, p-10 for desktop. rounded-2xl for mobile.
  className="relative w-full max-w-3xl bg-[#111111] rounded-[24px] md:rounded-[32px] p-6 md:p-10 pb-14 space-y-6 md:space-y-8 border border-white/10 shadow-2xl"
>
  {/* URL Input */}
  <div className="relative">
    <h1 className="text-[#47FFE7] text-lg md:text-xl text-left p-2">Get Started</h1>
    <input
      type="text"
      placeholder="Enter YouTube Link"
      value={youtubeUrl}
      onChange={(e) => setYoutubeUrl(e.target.value)}
      // Adjusted: py-4 for mobile, py-5 for desktop. text-sm for mobile.
      className="w-full bg-black/20 border rounded-2xl py-4 md:py-5 px-6 text-sm md:text-base text-zinc-300 placeholder:text-zinc-600 focus:outline-none border-[#47FFE7]/30 transition-all text-center"
    />
  </div>

  <div className="flex justify-center -mt-4 mb-2 relative" ref={dropdownRef}>
    <div className="flex items-center gap-1 bg-black/40 p-1.5 rounded-full border border-white/5">
      <button 
        type="button"
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex cursor-pointer items-center gap-2 px-4 md:px-5 py-2 bg-[#1A1A1A] text-white rounded-full text-xs md:text-sm font-medium border border-white/10 shadow-lg transition-all hover:bg-[#222]"
      >
        {!selectedPersona ? (
          <>
            <User size={14} className="text-[#47FFE7] md:w-4 md:h-4" />
            Personas
          </>
        ) : (
          <>
            <img 
              src={selectedPersona.image} 
              className="w-4 h-4 md:w-5 md:h-5 rounded-full object-cover border border-[#47FFE7]/30" 
              alt="" 
            />
            <span className="text-zinc-200">{selectedPersona.name}</span>
          </>
        )}
      </button>
    </div>

    {/* The Dropdown Menu */}
    <AnimatePresence>
      {isDropdownOpen && (
        <motion.div 
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          className="absolute top-full mt-3 w-48 md:w-52 bg-[#1A1A1A] border border-white/10 rounded-2xl overflow-hidden z-50 shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-2"
        >
          <p className="text-[9px] md:text-[10px] uppercase tracking-widest text-zinc-500 font-bold px-3 py-2">Select Persona</p>
          {PERSONAS.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                setSelectedPersona(p);
                setIsDropdownOpen(false);
              }}
              className={`w-full flex items-center gap-3 p-2 rounded-xl transition-all mb-1 ${
                selectedPersona?.id === p.id 
                ? "bg-[#47FFE7]/10 text-white" 
                : "hover:bg-white/5 text-zinc-400 hover:text-white"
              }`}
            >
              <div className="relative">
                 <img src={p.image} className="w-8 h-8 md:w-9 md:h-9 rounded-full object-cover border border-white/10" alt="" />
                 {selectedPersona?.id === p.id && (
                   <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 md:w-3 md:h-3 bg-[#47FFE7] rounded-full border-2 border-[#1A1A1A]" />
                 )}
              </div>
              <span className="text-xs md:text-sm font-medium">{p.name}</span>
            </button>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  </div>

  {/* Changes Textarea */}
  <div className="space-y-3">
    <div className="text-zinc-200 text-xs md:text-sm pl-1">
      Changes <span className="opacity-50">(optional)</span>
    </div>
    <textarea
      placeholder="Describe what you like to add, remove or replace."
      value={prompt}
      onChange={(e) => setPrompt(e.target.value)}
      // Adjusted: h-24 for mobile, text-sm for mobile
      className="w-full h-24 md:h-auto bg-black/40 border border-[#47FFE7]/40 rounded-[20px] md:rounded-[24px] p-4 text-sm md:text-base text-zinc-200 focus:outline-none focus:border-[#47FFE7] transition-all placeholder:text-zinc-600 text-center resize-none leading-relaxed"
    />
  </div>

  {/* Generate Button */}
  <div className="absolute -bottom-6 md:-bottom-7 left-1/2 -translate-x-1/2">
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={handleSubmit}
      disabled={loading}
      // Adjusted: px-6 for mobile, text-base for mobile
      className="bg-[#47FFE7] cursor-pointer text-black md:px-10 md:py-3.5 px-6 py-2.5 rounded-full font-semibold text-base md:text-lg flex items-center gap-2 shadow-[0_10px_40px_rgba(71,255,231,0.3)] disabled:opacity-50 whitespace-nowrap"
    >
      <Star size={18} className="md:w-5 md:h-5" fill="black" />
      {loading ? 'Generating...' : 'Generate'}
    </motion.button>
  </div>
</motion.div>)
                }
            </AnimatePresence>
        </div>
    );
};

export default Page;