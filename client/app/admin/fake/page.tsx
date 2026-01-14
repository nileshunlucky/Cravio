"use client"

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Star, Download, Plus, User } from 'lucide-react';
import { toast } from "sonner";
import { useUser } from "@clerk/nextjs";

const LoadingState = ({ onComplete }: { onComplete: () => void }) => {
    const [percentage, setPercentage] = useState(0);

    useEffect(() => {
        let currentProgress = 0;
        const duration = 5000; // 5 seconds total
        const interval = 50; 
        const steps = duration / interval;
        const incrementPerStep = 100 / steps;

        const timer = setInterval(() => {
            currentProgress += incrementPerStep;
            if (currentProgress >= 100) {
                setPercentage(100);
                clearInterval(timer);
                setTimeout(onComplete, 500); // Small delay at 100% for effect
            } else {
                setPercentage(Math.round(currentProgress));
            }
        }, interval);

        return () => clearInterval(timer);
    }, [onComplete]);

    return (
        <motion.div
            className="w-full aspect-video rounded-lg bg-zinc-900 overflow-hidden relative border"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            style={{ boxShadow: '0 0 30px rgba(71, 255, 231, 0.1)' }}
        >
            <div className="absolute inset-0 bg-zinc-800/70" />
            <motion.div
                className="absolute top-0 left-0 h-full"
                style={{
                    background: 'linear-gradient(to right, #18181b, #47FFE7)',
                    boxShadow: '0 0 20px #47FFE7, 0 0 30px #47FFE7'
                }}
                initial={{ width: '0%' }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 0.1, ease: 'linear' }}
            />
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
    const [selectedPersona, setSelectedPersona] = useState<{ id: string, name: string, image: string } | null>(null);
    const [personas, setPersonas] = useState([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newName, setNewName] = useState("");
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const thumbInputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const { user } = useUser();
    const email = user?.primaryEmailAddress?.emailAddress;

    useEffect(() => {
        const fetchPersonas = async () => {
            try {
                const res = await fetch(`https://cravio-ai.onrender.com/user/${email}`)
                const data = await res.json()
                setPersonas(data?.personas || [])
            } catch (error) {
                console.error('Error fetching personas:', error)
            }
        }
        if (user) fetchPersonas();
    }, [user, email]);

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) setImagePreview(URL.createObjectURL(file));
    };

    const handleThumbnailUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setThumbnailUrl(url);
        }
    };

    const handleSubmit = () => {
        if (!youtubeUrl) return toast.error("Enter YouTube Link");
        if (!selectedPersona) return toast.error("Select Persona!");
        if (!thumbnailUrl) return toast.error("Please click 'Get Started' to upload a target image first!");

        setAnimation(true);
        setLoading(true);
    };

    const handleLoadingComplete = () => {
        setLoading(false);
    };

    const handlePersona = () => {
        if (!newName || !imagePreview) return toast.error("Name and Image required");
        
        const newP = {
            id: Math.random().toString(),
            name: newName,
            image: imagePreview
        };
        setPersonas([...personas, newP]);
        toast.success("Fake Persona Created.");
        setShowCreateModal(false);
        setNewName("");
        setImagePreview(null);
    };

    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = thumbnailUrl;
        link.download = 'generated_thumbnail.jpg';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="min-h-screen my-5 flex items-center text-center justify-center p-4">
            <AnimatePresence mode="wait">
                {animation ? (
                    <motion.div key="result" className="w-full max-w-2xl" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                        {loading ? (
                            <LoadingState onComplete={handleLoadingComplete} />
                        ) : (
                            <motion.div whileHover={{ scale: 1.02 }} className="border-2 border-[#47FFE7] rounded-lg text-center relative" style={{ boxShadow: '0 0 20px rgba(71, 255, 231, 0.3)' }}>
                                <img src={thumbnailUrl} alt="Result" className="w-full object-contain rounded-md" />
                                <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 flex gap-3 z-10">
                                    <Button onClick={handleDownload} size="icon" className="bg-zinc-900 border border-[#47FFE7] text-[#47FFE7] hover:bg-zinc-800 w-10 h-10"><Download size={20}/></Button>
                                    <Button onClick={() => setAnimation(false)} size="icon" className="bg-zinc-900 border border-[#47FFE7] text-[#47FFE7] hover:bg-zinc-800 w-10 h-10"><Plus size={20}/></Button>
                                </div>
                            </motion.div>
                        )}
                    </motion.div>
                ) : (
                    <motion.div key="form" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative w-full max-w-3xl bg-[#111111] rounded-[24px] md:rounded-[32px] p-6 md:p-10 pb-14 space-y-6 md:space-y-8 border border-white/10 shadow-2xl">
                        <div className="relative space-y-6 md:space-y-8">
                            <div className="flex justify-between items-center px-2">
                                <h1 
                                    className="text-[#47FFE7] text-lg md:text-xl cursor-pointer hover:opacity-80 flex items-center gap-2"
                                    onClick={() => thumbInputRef.current?.click()}
                                >
                                    Get Started
                                   
                                </h1>
                                <input type="file" ref={thumbInputRef} hidden accept="image/*" onChange={handleThumbnailUpload} />
                            </div>
                            <input
                                type="text"
                                placeholder="Enter YouTube Link"
                                value={youtubeUrl}
                                onChange={(e) => setYoutubeUrl(e.target.value)}
                                className="w-full bg-black/20 border rounded-2xl py-4 md:py-5 px-6 text-sm text-zinc-300 border-[#47FFE7]/30 text-center focus:outline-none"
                            />
                        </div>

                        <div className="flex justify-center -mt-4 mb-2 relative" ref={dropdownRef}>
                            <button 
        type="button"
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex cursor-pointer items-center gap-2 px-4 md:px-5 py-2 bg-[#1A1A1A] text-white rounded-full text-xs md:text-sm font-medium border border-white/10 shadow-lg transition-all hover:bg-[#222] relative"
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
            <span onClick={()=> setSelectedPersona("")} className="text-teal-500 bg-zinc-800 rounded-full p-1 px-2 absolute -top-3 -right-1">X</span>
          </>
        )}
      </button>

                            <AnimatePresence>
                                {isDropdownOpen && (
                                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute top-full mt-3 w-52 bg-[#1A1A1A] border border-white/10 rounded-2xl z-50 p-2 shadow-2xl">
                                        <p className="text-[10px] uppercase text-zinc-500 font-bold px-3 py-2">Select Persona</p>
                                        {personas.map((p) => (
                                            <button key={p.id} onClick={() => { setSelectedPersona(p); setIsDropdownOpen(false); }} className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 text-zinc-400 hover:text-white transition-all">
                                                <img src={p.image} className="w-8 h-8 rounded-full object-cover" />
                                                <span className="text-sm">{p.name}</span>
                                            </button>
                                        ))}
                                        <button onClick={() => { setShowCreateModal(true); setIsDropdownOpen(false); }} className="w-full flex items-center gap-3 p-2 rounded-xl mt-1 border-t border-white/5 text-[#47FFE7] hover:bg-[#47FFE7]/5">
                                            <Plus size={16} /> <span className="text-sm font-semibold">Create New</span>
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <div className="space-y-3">
                            <textarea
                                placeholder="Describe what you like to add, remove or replace."
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                className="w-full h-24 bg-black/40 border border-[#47FFE7]/40 rounded-[24px] p-4 text-zinc-200 focus:outline-none text-center resize-none"
                            />
                        </div>

                        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleSubmit}
                                disabled={loading}
                                className="bg-[#47FFE7] text-black px-10 py-3.5 rounded-full font-semibold text-lg flex items-center gap-2 shadow-[0_10px_40px_rgba(71,255,231,0.3)] disabled:opacity-50"
                            >
                                <Star size={18} fill="black" />
                                {loading ? 'Generating...' : 'Generate'}
                            </motion.button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showCreateModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCreateModal(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
                        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="relative w-full max-w-md bg-[#111111] border border-[#47FFE7]/20 rounded-[32px] p-8">
                            <h3 className="text-xl font-bold text-white mb-6">Create Persona</h3>
                            <div className="space-y-6">
                                <div onClick={() => fileInputRef.current?.click()} className="w-28 h-28 mx-auto rounded-full border-2 border-dashed border-[#47FFE7]/30 flex items-center justify-center cursor-pointer overflow-hidden">
                                    {imagePreview ? <img src={imagePreview} className="w-full h-full object-cover" /> : <span className="text-zinc-500 text-xs">FACE</span>}
                                    <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleImageChange} />
                                </div>
                                <input type="text" placeholder="Persona Name" value={newName} onChange={(e) => setNewName(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-white text-center focus:outline-none" />
                                <Button onClick={handlePersona} className="w-full py-7 bg-[#47FFE7] text-black font-bold text-lg rounded-2xl">Create</Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Page;