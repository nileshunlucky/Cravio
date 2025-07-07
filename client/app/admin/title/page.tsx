"use client"

import React, { useState, useCallback } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { motion, AnimatePresence } from "framer-motion"
import { Sparkles, UploadCloud, Check, Copy, Wand2, Undo2 } from "lucide-react"
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { toast } from "sonner"

// PremiumProgress component with bigger and slower bars
const PremiumProgress = () => (
    <div className="w-full max-w-lg mx-auto space-y-3">
        {[...Array(3)].map((_, i) => (
            <div key={i} className="h-3 bg-slate-700/50 rounded-full overflow-hidden">
                <motion.div
                    className="h-full bg-[#47FEE7] rounded-full"
                    style={{
                        boxShadow: '0 0 20px #47FEE7, 0 0 8px #47FEE7'
                    }}
                    initial={{ x: "-100%" }}
                    animate={{ x: "0%" }}
                    transition={{
                        duration: 2.5, // Slower duration
                        repeat: Infinity,
                        repeatType: "loop",
                        delay: i * 0.3,
                        ease: "linear"
                    }}
                />
            </div>
        ))}
    </div>
);


// PremiumCopyButton component
const CopyButton = ({ textToCopy }: { textToCopy: string }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = useCallback(() => {
        navigator.clipboard.writeText(textToCopy).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    }, [textToCopy]);

    return (
        <Button
            onClick={handleCopy}
            variant="ghost"
            size="icon"
            className="text-slate-400 hover:text-[#47FEE7] hover:bg-slate-700/50 transition-all duration-300 rounded-full"
        >
            <AnimatePresence mode="wait" initial={false}>
                <motion.div
                    key={copied ? "check" : "copy"}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    transition={{ duration: 0.2 }}
                >
                    {copied ? <Check className="w-5 h-5 text-[#47FEE7]" /> : <Copy className="w-5 h-5" />}
                </motion.div>
            </AnimatePresence>
        </Button>
    );
};

const Page = () => {
    const [file, setFile] = useState<File | null>(null);
    const [titles, setTitles] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const { user } = useUser();
    const email = user?.emailAddresses?.[0]?.emailAddress;

    const router = useRouter()

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            setTitles([]);

            const reader = new FileReader();
            reader.onload = (event) => {
                setImagePreview(event.target?.result as string);
            };
            reader.readAsDataURL(selectedFile);
        }
    };

    const handleNewTitle = () => {
        setFile(null) 
        setImagePreview(null) 
        setTitles([]) 
        setLoading(false) }

    const handleGenerate = async () => {
        if (!file) return;
        setLoading(true);
        setTitles([]);

        const formData = new FormData();
        formData.append("file", file);
        formData.append("email", email || '');

        try {
            const response = await fetch("https://cravio-ai.onrender.com/api/thumb2title", {
                method: "POST",
                body: formData,
            });
            if (!response.ok) {
                const data = await response.json();
                if (response.status === 402 && data.error === "Not enough credits") {
                    toast.error("Not enough credits");
                    router.push("/admin/plan");
                    return;
                }
            }

            const data = await response.json();
            const generatedTitles = data.titles;

            setTitles(generatedTitles);
        } catch (err) {
            console.error("Generation failed", err);
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
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -30 }}
                            transition={{ duration: 0.6, ease: "easeInOut" }}
                            className="mt-12 text-center h-80 flex flex-col justify-center items-center"
                        >
                            <PremiumProgress />
                            <div className="mt-8 flex items-center justify-center text-slate-300 text-lg">
                                <Wand2 className="w-6 h-6 mr-3 animate-pulse text-[#47FEE7]" />
                                <p>Crafting viral titles for you...</p>
                            </div>
                        </motion.div>
                    ) : titles.length > 0 ? (
                        <motion.div
                            key="results"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.5 }}
                            className="w-full"
                        >
                            {/* -- Thumbnail Preview (on results screen) -- */}
                            <div className="aspect-w-16 aspect-h-9 w-full rounded-2xl overflow-hidden border-2 border-slate-700/50 shadow-2xl shadow-[#47FEE7]/10">
                                <img src={imagePreview!} alt="Thumbnail Preview" className="w-full h-full object-cover" />
                            </div>
                            {/* -- Generate Again Button -- */}
                            <div className="mt-8 text-center">
                                <div className="flex md:flex-row flex-col items-center justify-center gap-3">
                                    <Button
                                        onClick={handleGenerate}
                                        className="w-full max-w-sm h-14 bg-[#47FEE7] text-black font-bold text-lg rounded-xl relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 border-2 border-slate-700  hover:bg-[#47FEE7]/80"
                                    >
                                        <div className="flex items-center justify-center space-x-3">
                                            <Undo2 />
                                            <span>Generate Again</span>
                                        </div>
                                    </Button>
                                    {/* New Title */}
                                    <Button onClick={handleNewTitle}
                                    className="w-full max-w-sm h-14 bg-[#47FEE7] text-black font-bold text-lg rounded-xl relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 border-2 border-slate-700  hover:bg-[#47FEE7]/80">
                                        <Sparkles />
                                        <span>New Title</span>
                                    </Button>
                                </div>
                                <p className="text-slate-400 text-sm mt-4 flex items-center justify-center gap-2">
                                    <svg width="16" height="16" viewBox="0 0 24 24" strokeWidth="1.5" fill="none" xmlns="http://www.w3.org/2000/svg" color="currentColor"><path fillRule="evenodd" clipRule="evenodd" d="M13.2319 2.28681C13.5409 2.38727 13.75 2.6752 13.75 3.00005V9.25005H19C19.2821 9.25005 19.5403 9.40834 19.6683 9.65972C19.7963 9.9111 19.7725 10.213 19.6066 10.4412L11.6066 21.4412C11.4155 21.7039 11.077 21.8137 10.7681 21.7133C10.4591 21.6128 10.25 21.3249 10.25 21.0001V14.7501H5C4.71791 14.7501 4.45967 14.5918 4.33167 14.3404C4.20366 14.089 4.22753 13.7871 4.39345 13.5589L12.3935 2.55892C12.5845 2.2962 12.923 2.18635 13.2319 2.28681Z" fill="url(&quot;#linearGradient&quot;)"></path><defs><linearGradient gradientTransform="rotate(90)" id="linearGradient"><stop offset="0%" stopColor="#FFE629"></stop><stop offset="100%" stopColor="#FFA057"></stop></linearGradient></defs></svg>
                                    This will use 5 credits
                                </p>
                            </div>

                            {/* -- Generated Titles List -- */}
                            <div
                                className="mt-8"
                            >
                                <div className="space-y-4">
                                    {titles.map((title, idx) => (
                                        <motion.div
                                            key={idx}
                                            initial={{ opacity: 0, x: -30 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{
                                                delay: idx * 0.1,
                                                duration: 0.5,
                                                type: "spring",
                                                stiffness: 100
                                            }}
                                            className="bg-zinc-900/50 backdrop-blur-md rounded-xl p-5 border-2 flex items-center justify-between space-x-4 transition-all duration-300 hover:border-[#47FEE7] hover:shadow-lg hover:shadow-[#47FEE7]/5"
                                        >
                                            <p className="text-lg text-[#47FEE7] font-medium">{title}</p>
                                            <CopyButton textToCopy={title} />
                                        </motion.div>
                                    ))}
                                </div>
                            </div>

                        </motion.div>
                    ) : imagePreview ? (
                        <motion.div
                            key="preview"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.5 }}
                            className="w-full"
                        >
                            <Card className="bg-transparent border-0 shadow-none">
                                <CardContent className="p-0">
                                    <div className="aspect-w-16 aspect-h-9 w-full rounded-2xl overflow-hidden border-2 border-slate-700/50 shadow-2xl shadow-[#47FEE7]/10">
                                        <img src={imagePreview} alt="Thumbnail Preview" className="w-full h-full object-cover" />
                                    </div>
                                    <div className="mt-8 text-center">
                                        <Button
                                            onClick={handleGenerate}
                                            className="w-full max-w-sm h-14 bg-gradient-to-r from-[#47FEE7] to-[#33ccb3] text-slate-900 font-bold text-lg rounded-xl relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                                            style={{
                                                boxShadow: "0 0 30px rgba(71, 255, 231, 0.3)"
                                            }}
                                        >
                                            <div className="flex items-center justify-center space-x-3">
                                                <Sparkles className="w-6 h-6" />
                                                <span>Generate Viral Titles</span>
                                            </div>
                                        </Button>
                                        <p className="text-slate-400 text-sm mt-4 flex items-center justify-center gap-2">
                                            <svg width="16" height="16" viewBox="0 0 24 24" strokeWidth="1.5" fill="none" xmlns="http://www.w3.org/2000/svg" color="currentColor"><path fillRule="evenodd" clipRule="evenodd" d="M13.2319 2.28681C13.5409 2.38727 13.75 2.6752 13.75 3.00005V9.25005H19C19.2821 9.25005 19.5403 9.40834 19.6683 9.65972C19.7963 9.9111 19.7725 10.213 19.6066 10.4412L11.6066 21.4412C11.4155 21.7039 11.077 21.8137 10.7681 21.7133C10.4591 21.6128 10.25 21.3249 10.25 21.0001V14.7501H5C4.71791 14.7501 4.45967 14.5918 4.33167 14.3404C4.20366 14.089 4.22753 13.7871 4.39345 13.5589L12.3935 2.55892C12.5845 2.2962 12.923 2.18635 13.2319 2.28681Z" fill="url(&quot;#linearGradient&quot;)"></path><defs><linearGradient gradientTransform="rotate(90)" id="linearGradient"><stop offset="0%" stopColor="#FFE629"></stop><stop offset="100%" stopColor="#FFA057"></stop></linearGradient></defs></svg>
                                            This will use 5 credits
                                        </p>
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
                        >
                            <label
                                htmlFor="file-upload"
                                className="relative block w-full cursor-pointer group"
                            >
                                <div className="w-full aspect-w-16 aspect-h-9 flex items-center justify-center border-3 border-[#47FFE7] rounded-2xl p-8 text-center transition-all duration-300 group-hover:border-[#47FEE7]/50 group-hover:bg-slate-800/20 relative overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-r from-[#47FFE7]/0 via-[#47FFE7]/5 to-[#47FFE7]/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                    <div className="relative z-10 text-[#47FFE7] group-hover:text-[#47FFE7] transition-colors duration-300">
                                        <UploadCloud className="w-16 h-16 mx-auto mb-4" />
                                        <p className="text-xl font-semibold mb-2">Upload Your Thumbnail</p>
                                        <p className="text-sm opacity-80">Drag & drop or click to browse</p>
                                    </div>
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