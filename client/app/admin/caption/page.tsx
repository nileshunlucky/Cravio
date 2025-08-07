"use client"

import React, { useState, useCallback } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { motion, AnimatePresence } from "framer-motion"
import { Sparkles, Upload, Check, Copy, Quote, Zap } from "lucide-react"
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { toast } from "sonner"


// PremiumCopyButton component
const CopyButton = ({ textToCopy }: { textToCopy: string }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = useCallback(() => {
        navigator.clipboard.writeText(textToCopy).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        });
    }, [textToCopy]);

    return (
        <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
        >
            <Button
                onClick={handleCopy}
                variant="ghost"
                size="icon"
                className="relative h-10 w-10 rounded-full bg-gradient-to-br from-[#B08D57]/10 to-[#4e3c20]/10 border border-[#B08D57]/20 hover:border-[#B08D57]/40 backdrop-blur-xl transition-all duration-500 hover:shadow-lg hover:shadow-[#B08D57]/20"
            >
                <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                        key={copied ? "check" : "copy"}
                        initial={{ opacity: 0, scale: 0.3, rotate: -180 }}
                        animate={{ opacity: 1, scale: 1, rotate: 0 }}
                        exit={{ opacity: 0, scale: 0.3, rotate: 180 }}
                        transition={{ duration: 0.4, ease: "easeInOut" }}
                    >
                        {copied ? (
                            <Check className="w-4 h-4 text-[#B08D57]" />
                        ) : (
                            <Copy className="w-4 h-4 text-slate-300 hover:text-[#B08D57] transition-colors duration-300" />
                        )}
                    </motion.div>
                </AnimatePresence>
                {copied && (
                    <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1.5, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        className="absolute inset-0 rounded-full border-2 border-[#B08D57]/30"
                    />
                )}
            </Button>
        </motion.div>
    );
};

const Page = () => {
    const [file, setFile] = useState<File | null>(null);
    const [Captions, setCaptions] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const { user } = useUser();
    const email = user?.emailAddresses?.[0]?.emailAddress;

    const router = useRouter()

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            setCaptions([]);

            const reader = new FileReader();
            reader.onload = (event) => {
                setImagePreview(event.target?.result as string);
            };
            reader.readAsDataURL(selectedFile);
        }
    };

    const handleNewCaption = () => {
        setFile(null)
        setImagePreview(null)
        setCaptions([])
        setLoading(false)
    }

    const handleGenerate = async () => {
    if (!file) return;
    setLoading(true);
    setCaptions([]);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("email", email || '');

    try {
        const response = await fetch("https://cravio-ai.onrender.com/api/post2caption", {
            method: "POST",
            body: formData,
        });
        
        // Read the response once
        const data = await response.json();
        
        if (!response.ok) {
            if (response.status === 403 && data.error === "Not enough aura") {
                toast.error("Not enough aura", {
                    style: {
                        background: "linear-gradient(to bottom right, #5C0A14, #BC2120, #9B111E)",
                        color: "white",
                        border: "0px"
                    }
                });
                router.push("/admin/pricing");
                return;
            }
            // Handle other errors (like 500)
            console.error("Server error:", response.status, data);
            toast.error("Something went wrong. Please try again.",{
                 style: {
                        background: "linear-gradient(to bottom right, #5C0A14, #BC2120, #9B111E)",
                        color: "white",
                        border: "0px"
                    }
            });
            return;
        }

        // Success case
        const generatedCaptions = data.Captions;
        setCaptions(generatedCaptions);
        
    } catch (err) {
        console.error("Generation failed", err);
        toast.error("Network error. Please check your connection.",{
                 style: {
                        background: "linear-gradient(to bottom right, #5C0A14, #BC2120, #9B111E)",
                        color: "white",
                        border: "0px"
                    }
            });
    } finally {
        setLoading(false);
    }
};

    return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 my-5">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="w-full max-w-3xl"
            >
                <AnimatePresence mode="wait">
                    {loading ? (
                        <motion.div
                            key="loading"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                            className="flex flex-col items-center justify-center py-24 px-12 min-h-[500px]"
                        >
                            {/* Main Container */}
                            <div className="relative ">
                                {/* Outer Glow Ring */}
                                <motion.div
                                    className="absolute -inset-16 rounded-full border-2 border-[#B08D57]/20"
                                    animate={{
                                        rotate: 360,
                                        scale: [1, 1.08, 1]
                                    }}
                                    transition={{
                                        rotate: { duration: 6, repeat: Infinity, ease: "linear" },
                                        scale: { duration: 3, repeat: Infinity }
                                    }}
                                    style={{
                                        boxShadow: '0 0 80px rgba(176, 141, 87, 0.4), inset 0 0 40px rgba(176, 141, 87, 0.1)'
                                    }}
                                />

                                {/* Middle Glow Ring */}
                                <motion.div
                                    className="absolute -inset-12 rounded-full border border-[#B08D57]/40"
                                    animate={{
                                        rotate: -360,
                                        opacity: [0.3, 0.8, 0.3]
                                    }}
                                    transition={{
                                        rotate: { duration: 4, repeat: Infinity, ease: "linear" },
                                        opacity: { duration: 2, repeat: Infinity }
                                    }}
                                    style={{
                                        boxShadow: '0 0 60px rgba(176, 141, 87, 0.6)'
                                    }}
                                />

                                {/* Inner Glow Ring */}
                                <motion.div
                                    className="absolute -inset-8 rounded-full border border-[#B08D57]/60"
                                    animate={{
                                        rotate: 360,
                                        scale: [0.95, 1.05, 0.95]
                                    }}
                                    transition={{
                                        rotate: { duration: 3, repeat: Infinity, ease: "linear" },
                                        scale: { duration: 2, repeat: Infinity }
                                    }}
                                    style={{
                                        boxShadow: '0 0 40px rgba(176, 141, 87, 0.8)'
                                    }}
                                />

                                {/* Central Icon Container */}
                                <motion.div
                                    className="relative w-32 h-32 bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 rounded-full flex items-center justify-center border-2 border-[#B08D57]/50"
                                    animate={{
                                        boxShadow: [
                                            '0 0 40px rgba(176, 141, 87, 0.5)',
                                            '0 0 80px rgba(176, 141, 87, 0.8)',
                                            '0 0 40px rgba(176, 141, 87, 0.5)'
                                        ]
                                    }}
                                    transition={{ duration: 2.5, repeat: Infinity }}
                                >
                                    {/* Background Glow */}
                                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#B08D57]/10 to-transparent" />

                                    {/* Letter C */}
                                    <motion.div
                                        className="text-6xl font-bold text-[#B08D57] relative z-10"
                                        animate={{
                                            textShadow: [
                                                '0 0 20px rgba(176, 141, 87, 0.6)',
                                                '0 0 40px rgba(176, 141, 87, 0.9)',
                                                '0 0 20px rgba(176, 141, 87, 0.6)'
                                            ]
                                        }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                        style={{
                                            fontFamily: 'serif',
                                            textShadow: '0 0 30px rgba(176, 141, 87, 0.8)'
                                        }}
                                    >
                                        C
                                    </motion.div>

                                    {/* Floating Sparkles */}
                                    {[...Array(6)].map((_, i) => (
                                        <motion.div
                                            key={i}
                                            className="absolute"
                                            style={{
                                                top: `${15 + (i * 15)}%`,
                                                left: `${75 + (i * 8)}%`,
                                                transformOrigin: 'center'
                                            }}
                                            animate={{
                                                y: [-15, -30, -15],
                                                x: [0, 5, 0],
                                                opacity: [0, 1, 0],
                                                scale: [0.3, 1, 0.3],
                                                rotate: [0, 180, 360]
                                            }}
                                            transition={{
                                                duration: 3,
                                                delay: i * 0.4,
                                                repeat: Infinity
                                            }}
                                        >
                                            <Sparkles className="w-4 h-4 text-[#B08D57]" />
                                        </motion.div>
                                    ))}

                                    {/* Electric Bolts */}
                                    {[...Array(3)].map((_, i) => (
                                        <motion.div
                                            key={`bolt-${i}`}
                                            className="absolute"
                                            style={{
                                                top: `${10 + (i * 30)}%`,
                                                left: `${10 + (i * 20)}%`
                                            }}
                                            animate={{
                                                opacity: [0, 1, 0],
                                                scale: [0.5, 1.2, 0.5],
                                                rotate: [0, 90, 180]
                                            }}
                                            transition={{
                                                duration: 2,
                                                delay: i * 0.6,
                                                repeat: Infinity
                                            }}
                                        >
                                            <Zap className="w-3 h-3 text-[#B08D57]" />
                                        </motion.div>
                                    ))}
                                </motion.div>
                            </div>

                            {/* Text Content */}
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                className="mt-12 text-center"
                            >
                                <div className="flex items-center justify-center ">
                                    <Quote className="w-6 h-6 text-[#B08D57]/60 mr-3" />
                                    <h3
                                        className="md:text-3xl whitespace-nowrap font-bold bg-gradient-to-br from-[#4e3c20] via-[#B08D57] to-[#4e3c20] bg-clip-text text-transparent tracking-wide">
                                        Curating Caption
                                    </h3>
                                    <Quote className="w-6 h-6 text-[#B08D57]/60 ml-3 rotate-180" />
                                </div>
                            </motion.div>


                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.8 }}
                                className="mt-10 relative"
                            >

                                {/* Progress Dots */}
                                <div className="flex justify-center items-center space-x-3 mt-3">
                                    {[...Array(7)].map((_, i) => (
                                        <motion.div
                                            key={i}
                                            className="w-3 h-3 bg-[#B08D57] rounded-full"
                                            animate={{
                                                scale: [0.6, 1.4, 0.6],
                                                opacity: [0.3, 1, 0.3]
                                            }}
                                            transition={{
                                                duration: 1.8,
                                                delay: i * 0.15,
                                                repeat: Infinity
                                            }}
                                        />
                                    ))}
                                </div>
                            </motion.div>
                        </motion.div>
                    ) : Captions.length > 0 ? (
                        <motion.div
                            key="results"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.5 }}
                            className="w-full flex flex-col items-center justify-center gap-7"
                        >
                            {/* -- post Preview (on results screen) -- */}
                            <div className="aspect-w-16 aspect-h-9 w-full rounded-2xl overflow-hidden border-3 border-[#B08D57] shadow-2xl shadow-[#B08D57]/10">
                                <img src={imagePreview!} alt="post Preview" className="w-full h-full object-cover" />
                            </div>
                            {/* -- Generate Again Button -- */}
                            <div className="mt-8 text-center">
                                <div className="flex items-center justify-center gap-3">
                                    <Button
                                        onClick={handleGenerate}
                                        className=" bg-gradient-to-br from-[#4e3c20] via-[#B08D57] to-[#4e3c20]  text-black font-bold md:text-lg rounded-xl relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300  hover:bg-[#B08D57]/80"
                                    >
                                        <div className="flex items-center justify-center space-x-3">
                                            <span>Craft Again</span>
                                        </div>
                                    </Button>
                                    {/* New Caption */}
                                    <Button onClick={handleNewCaption}
                                        className="bg-gradient-to-br from-[#4e3c20] via-[#B08D57] to-[#4e3c20]  text-black font-bold md:text-lg rounded-xl relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300  hover:bg-[#B08D57]/80">
                                        <span>New Caption</span>
                                    </Button>
                                </div>
                            </div>

                            {/* -- Generated Captions List -- */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.6 }}
                                className="space-y-4 max-w-4xl mx-auto"
                            >
                                {Captions.map((caption, idx) => (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, x: -50, scale: 0.95 }}
                                        animate={{ opacity: 1, x: 0, scale: 1 }}
                                        transition={{
                                            delay: 0.8 + (idx * 0.15),
                                            duration: 0.6,
                                            type: "spring",
                                            stiffness: 120,
                                            damping: 20
                                        }}
                                        whileHover={{
                                            scale: 1.01,
                                            transition: { duration: 0.2 }
                                        }}
                                        className="group relative"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-[#B08D57]/5 to-[#4e3c20]/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                        <div className="relative bg-zinc-900/40 backdrop-blur-xl rounded-2xl p-6 border border-zinc-800/50 group-hover:border-[#B08D57]/30 transition-all duration-500 flex items-start justify-between gap-4">
                                            <div className="flex-1">
                                                <motion.div
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 0.6 }}
                                                    transition={{ delay: 1 + (idx * 0.15) }}
                                                    className="text-xs text-[#B08D57] font-medium tracking-widest uppercase mb-2"
                                                >
                                                    Caption {idx + 1}
                                                </motion.div>
                                                <motion.p
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    transition={{ delay: 1.1 + (idx * 0.15) }}
                                                    className="text-slate-200 text-base leading-relaxed font-light"
                                                >
                                                    {caption}
                                                </motion.p>
                                            </div>
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: 1.2 + (idx * 0.15) }}
                                            >
                                                <CopyButton textToCopy={caption} />
                                            </motion.div>
                                        </div>
                                    </motion.div>
                                ))}
                            </motion.div>

                        </motion.div>
                    ) : imagePreview ? (
                        <motion.div
                            key="preview"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.5 }}
                            className="max-w-sm mx-auto"

                        >
                            <Card className="bg-transparent border-0 shadow-none">
                                <CardContent className="p-0">
                                    <div className="aspect-w-16 aspect-h-9 w-full rounded-2xl overflow-hidden border-3 border-[#B08D57] shadow-2xl shadow-[#B08D57]/10">
                                        <img src={imagePreview} alt="post Preview" className="w-full h-full object-cover" />
                                    </div>
                                    <div className="mt-8 text-center">
                                        <Button
                                            onClick={handleGenerate}
                                            className="w-full max-w-sm h-14 bg-gradient-to-br from-[#4e3c20] via-[#B08D57] to-[#4e3c20]  font-bold text-lg rounded-xl relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                                        >
                                            <div className="flex items-center justify-center space-x-3">
                                                <span>Craft Exclusive Captions</span>
                                            </div>
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="upload"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.5 }}
                            className="max-w-sm mx-auto"
                        >
                            <label
                                htmlFor="file-upload"
                                className="relative block cursor-pointer group"
                            >
                                <div className="aspect-[9/16] flex items-center justify-center border-3 border-[#B08D57] rounded-2xl p-8 text-center transition-all duration-300 group-hover:border-[#B08D57]/50 group-hover:bg-[#B08D57]/20relative overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-br from-[#B08D57]/0 via-[#B08D57]/5 to-[#B08D57]/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                    <motion.div
                                                key="upload"
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -20 }}
                                                className="py-12 flex flex-col justify-center items-center h-64"
                                            >
                                                <div className="w-16 h-16 mx-auto mb-6 border border-[#B08D57]/30 rounded-full flex items-center justify-center">
                                                    <Upload className="w-6 h-6 text-[#B08D57]" />
                                                </div>
                                                <p className="text-white/70 font-light mb-2">Drop your POST here</p>
                                            </motion.div>
                                </div>
                                <input
                                    id="file-upload"
                                    type="file"
                                    accept="image/png, image/jpeg, image/webp"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                            </label>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    )
}

export default Page;