"use client"

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, Link, Sparkles, Download, Plus } from 'lucide-react';
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
    const [activeTab, setActiveTab] = useState('link');
    const [youtubeUrl, setYoutubeUrl] = useState('');
    const [thumbnailImage, setThumbnailImage] = useState<ImageWithPreview | null>(null);
    const [faceImage, setFaceImage] = useState<ImageWithPreview | null>(null);
    const [animation, setAnimation] = useState(false);
    const [loading, setLoading] = useState(false);
    const [thumbnailUrl, setThumbnailUrl] = useState('');

    const router = useRouter()

    const thumbnailRef = useRef<HTMLInputElement>(null);
    const faceRef = useRef<HTMLInputElement>(null);

    const { user } = useUser();

    type ImageWithPreview = { file: File; preview: string };

    const handleDownload = () => {
        if (!thumbnailUrl) return;

        const link = document.createElement('a');
        link.href = thumbnailUrl;
        link.download = 'cravio_thumbnail.jpg'; // or .png
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };


    const handleFileUpload = (file: File, type: 'thumbnail' | 'face') => {
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const result = e.target && typeof e.target.result === 'string' ? e.target.result : '';
                if (type === 'thumbnail') {
                    setThumbnailImage({ file, preview: result });
                } else if (type === 'face') {
                    setFaceImage({ file, preview: result });
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async () => {
        try {
            setAnimation(true);
            setLoading(true);
            if ((!youtubeUrl && !thumbnailImage) || !faceImage) {
                toast.error('Please fill in all the fields.');
                setAnimation(false); // Go back to form if validation fails
                setLoading(false);
                return;
            }

            const email = user?.primaryEmailAddress?.emailAddress

            const formData = new FormData();

            if (activeTab === 'link') {
                formData.append('youtubeUrl', youtubeUrl);
            } else {
                formData.append('thumbnailImage', thumbnailImage ? thumbnailImage.file : '');
            }
            formData.append('faceImage', faceImage ? faceImage.file : '');
            formData.append('email', email || '');

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
                if (res.status === 402 && data.error === "Not enough credits") {
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
            setLoading(false);
        }
    };

    const canSubmit = () => {
        const hasSource = activeTab === 'link' ? youtubeUrl.trim() : thumbnailImage;
        return hasSource && faceImage;
    };

    return (
        <div className="min-h-screen my-5 flex items-center justify-center p-4">
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
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.5 }}
                                className="w-full max-w-2xl rounded-lg p-6 space-y-7 border-2"
                                style={{
                                    borderColor: canSubmit() ? '#47FFE7' : 'rgba(255, 255, 255, 0.2)',
                                    boxShadow: canSubmit() ? '0 0 20px rgba(71, 255, 231, 0.3)' : 'none'
                                }}
                            >

                                {/* Tab Buttons */}
                                <div className="flex rounded-lg gap-3 p-1 bg-zinc-900">
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => setActiveTab('link')}
                                        className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${activeTab === 'link'
                                            ? 'text-black'
                                            : 'text-gray-300 hover:text-white hover:border hover:border-[#47FFE7]'
                                            }`}
                                        style={{
                                            backgroundColor: activeTab === 'link' ? '#47FFE7' : 'transparent',
                                            boxShadow: activeTab === 'link' ? '0 0 10px rgba(71, 255, 231, 0.5)' : 'none'
                                        }}
                                    >
                                        <Link className="w-4 h-4" />
                                        Link
                                    </motion.button>
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => setActiveTab('upload')}
                                        className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${activeTab === 'upload'
                                            ? 'text-black'
                                            : 'text-gray-300 hover:text-white hover:border hover:border-[#47FFE7]'
                                            }`}
                                        style={{
                                            backgroundColor: activeTab === 'upload' ? '#47FFE7' : 'transparent',
                                            boxShadow: activeTab === 'upload' ? '0 0 10px rgba(71, 255, 231, 0.5)' : 'none'
                                        }}
                                    >
                                        <Upload className="w-4 h-4" />
                                        Upload
                                    </motion.button>
                                </div>

                                {/* Input Section */}
                                <div className="space-y-4">
                                    {activeTab === 'link' ? (
                                        <Input
                                            placeholder="Drop a YouTube link"
                                            value={youtubeUrl}
                                            onChange={(e) => setYoutubeUrl(e.target.value)}
                                            className="bg-gray-700 border-2 border-[#47FFE7] text-[#47FFE7] placeholder-gray-400 focus:outline-none px-5"
                                        />
                                    ) : (
                                        <motion.div
                                            whileHover={{ scale: 1.02 }}
                                            className="border-2 border-[#47FFE7] rounded-lg p-3 text-center cursor-pointer transition-colors hover:bg-zinc-800/50"
                                            onClick={() => thumbnailRef.current?.click()}
                                        >
                                            <input
                                                ref={thumbnailRef}
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={(e) => {
                                                    if (e.target.files && e.target.files[0]) {
                                                        handleFileUpload(e.target.files[0], 'thumbnail');
                                                    }
                                                }}
                                            />
                                            {thumbnailImage ? (
                                                <img
                                                    src={thumbnailImage.preview}
                                                    alt="Thumbnail Preview"
                                                    className="w-full h-auto mx-auto rounded object-contain"
                                                />
                                            ) : (
                                                <div className="space-y-2 py-8">
                                                    <Upload className="w-8 h-8 mx-auto text-gray-500" />
                                                    <p className="text-gray-400 text-sm">Click to upload thumbnail</p>
                                                </div>
                                            )}
                                        </motion.div>
                                    )}
                                </div>

                                {/* Face Image Upload */}
                                <motion.div
                                    whileHover={{ scale: 1.02 }}
                                    className="border-2 border-[#47FFE7] rounded-lg p-3 text-center cursor-pointer transition-colors hover:bg-zinc-800/50"
                                    onClick={() => faceRef.current?.click()}
                                >
                                    <input
                                        ref={faceRef}
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        required
                                        onChange={(e) => {
                                            if (e.target.files && e.target.files[0]) {
                                                handleFileUpload(e.target.files[0], 'face');
                                            }
                                        }}
                                    />
                                    {faceImage ? (
                                        <img
                                            src={faceImage.preview}
                                            alt="Face Preview"
                                            className="w-32 h-32 mx-auto rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="space-y-2 py-5">
                                            <Upload className="w-8 h-8 mx-auto text-gray-500" />
                                            <p className="text-gray-400 text-sm">Upload face image</p>
                                        </div>
                                    )}
                                </motion.div>

                                {/* Submit Button */}
                                <motion.div
                                    whileHover={{ scale: canSubmit() && !loading ? 1.02 : 1 }}
                                    whileTap={{ scale: canSubmit() && !loading ? 0.98 : 1 }}
                                >
                                    <Button
                                        onClick={handleSubmit}
                                        disabled={loading}
                                        className="w-full flex items-center gap-2 py-3 text-base font-bold rounded-lg transition-all text-black disabled:opacity-50 disabled:cursor-not-allowed"
                                        style={{
                                            backgroundColor: '#47FFE7',
                                            boxShadow: '0 0 15px rgba(71, 255, 231, 0.4)'
                                        }}
                                    >
                                        <Sparkles className='w-5 h-5' />
                                        {loading ? 'Generating...' : 'Generate'}
                                    </Button>
                                </motion.div>
                            </motion.div>)
                }
            </AnimatePresence>
        </div>
    );
};

export default Page;