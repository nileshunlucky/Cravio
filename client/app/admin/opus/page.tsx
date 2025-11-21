"use client"

import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Upload } from 'lucide-react';
import { useRouter } from 'next/navigation'
import { useUser } from "@clerk/nextjs"

interface TaskStatus {
    state: string
    status?: string
    current?: number
    total?: number
    progress?: number
    result?: TaskResult
    error?: string
}

interface TaskResult {
    message: string
}

const Page = () => {
    const [prompt, setPrompt] = useState('');
    const [image, setImage] = useState<File | null>(null);
    const [videoPreview, setvideoPreview] = useState<string | null>(null);
    const [model, setModel] = useState('sora 2');
    const [aspectRatio, setAspectRatio] = useState('9:16');
    const [taskId, setTaskId] = useState<string | null>(null)
    const [taskStatus, setTaskStatus] = useState<TaskStatus | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)
    const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null)
    const [progress, setProgress] = useState(0)
    const [dragActive, setDragActive] = useState(false)

    const auraCost = [
        { model: "veo3", cost: 400 },
        { model: "kling 2.1 master", cost: 250 },
        { model: "hailuo 02 pro", cost: 250 },
        { model: "wan 2.5", cost: 100 },
        { model: "sora 2", cost: 100 },]

    
    useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const urlPrompt = searchParams.get('prompt');
    const referenceMedia = searchParams.get('referenceImage');

    if (urlPrompt) {
        setPrompt(decodeURIComponent(urlPrompt));
    }

    if (referenceMedia) {
        const mediaUrl = decodeURIComponent(referenceMedia);
        
        // Check if it's a video file
        const isVideo = mediaUrl.includes('.mp4') || mediaUrl.includes('.webm') || mediaUrl.includes('.mov');
        
        if (isVideo) {
            // For videos, set as video preview
            setvideoPreview(mediaUrl);
        } else {
            // Handle as image
            setvideoPreview(mediaUrl);
        }
        
        // Clear the search params after processing
        setTimeout(() => {
            const url = new URL(window.location.href);
            url.searchParams.delete('prompt');
            url.searchParams.delete('referenceImage');
            window.history.replaceState({}, '', url.toString());
        }, 100);
    }
}, []);

    useEffect(() => {
        if (isProcessing) {
            setProgress(0)
            const timer = setInterval(() => {
                setProgress(prev => {
                    if (prev >= 100) {
                        clearInterval(timer)
                        return 100
                    }
                    return prev + 0.5 // Slower progress increment
                })
            }, 100) // Slower timing interval

            return () => clearInterval(timer)
        }
    }, [isProcessing])

    const router = useRouter()
    const { user } = useUser()
    const email = user?.emailAddresses?.[0]?.emailAddress || ''

    const handleImageUpload = (file: File) => {
        if (file && file.type.startsWith('image/')) {
            setImage(file)
            const reader = new FileReader()
            reader.onload = (e) => {
                const result = e.target?.result
                if (typeof result === "string") {
                    setvideoPreview(result)
                }
            }
            reader.readAsDataURL(file)
        }
    }

    const handleSubmit = async () => {
        if (!prompt) {
            toast.error("Please enter a prompt", {
                style: {
                    background: "linear-gradient(to bottom right, #5C0A14, #BC2120, #9B111E)",
                    color: "white",
                    border: "0px"
                }
            })
            return;
        }
        setProgress(0)
        setIsProcessing(true)
        setGeneratedVideoUrl(null) // Reset previous generated image
        setTaskStatus(null)
        try {
            const formData = new FormData()
            formData.append('model', model)
            formData.append('email', email)
            formData.append('prompt', prompt)
            formData.append('aspect_ratio', aspectRatio)

            if (image) {
                formData.append('image', image)
            }

            const res = await fetch('https://cravio-ai.onrender.com/api/opus', {
                method: 'POST',
                body: formData,
            })

            const data = await res.json()

            if (res.ok) {
                setTaskId(data.task_id)
                toast.success('Video generation started!', {
                    style: {
                        background: "linear-gradient(to bottom right, #4e3c20, #B08D57, #4e3c20)",
                        color: "black",
                        border: "0px"
                    }
                })
            }
            if (res.status === 403) {
                toast.error('Not enough aura', {
                    style: {
                        background: "linear-gradient(to bottom right, #5C0A14, #BC2120, #9B111E)",
                        color: "white",
                        border: "0px"
                    }
                });
                router.push('/admin/pricing')
            } else if (!res.ok) {
                console.error("Error from server:", data)
                toast.error("Failed to generate image", {
                    style: {
                        background: "linear-gradient(to bottom right, #5C0A14, #BC2120, #9B111E)",
                        color: "white",
                        border: "0px"
                    }
                })
            }

        } catch (error) {
            toast.error("Failed to generate Video", {
                style: {
                    background: "linear-gradient(to bottom right, #5C0A14, #BC2120, #9B111E)",
                    color: "white",
                    border: "0px"
                }
            })
            console.error("Error:", error)
        } finally {
            setIsProcessing(false)
        }
    };

    const downloadVideo = async (videoUrl: string) => {
        try {
            // Use your FastAPI backend URL with the video proxy endpoint
            const proxyUrl = `https://cravio-ai.onrender.com/proxy-video?url=${encodeURIComponent(videoUrl)}`
            const response = await fetch(proxyUrl)

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }

            const blob = await response.blob()
            const downloadUrl = URL.createObjectURL(blob)

            const a = document.createElement('a')
            a.href = downloadUrl
            a.download = `Video-${Date.now()}.mp4`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(downloadUrl)

            toast.success("Video Downloaded!", {
                style: {
                    background: "linear-gradient(to bottom right, #4e3c20, #B08D57, #4e3c20)",
                    color: "black",
                    border: "0px"
                }
            })
        } catch (error) {
            console.error("Download failed:", error)
            toast.error("Download failed. Opening video in new tab...", {
                style: {
                    background: "linear-gradient(to bottom right, #5C0A14, #BC2120, #9B111E)",
                    color: "white",
                    border: "0px"
                }
            })
            window.open(videoUrl)
        }
    }

    const handleCreateNew = () => {
        setTaskId(null);
        setTaskStatus(null);
        setPrompt('');
        setImage(null);
        setvideoPreview(null);
        setGeneratedVideoUrl(null);

    };


    useEffect(() => {
        if (!taskId) return;

        const pollStatus = async () => {
            try {
                const response = await fetch(`https://cravio-ai.onrender.com/api/task-status/${taskId}`);
                const status = await response.json();
                setTaskStatus(status);

                if (status.state === 'SUCCESS' || status.state === 'FAILURE') {
                    setIsProcessing(false);
                    if (status.state === 'SUCCESS') {
                        setGeneratedVideoUrl(status.result.fal_url);
                        toast.success('Training completed', {
                            style: {
                                background: "linear-gradient(to bottom right, #4e3c20, #B08D57, #4e3c20)",
                                color: "black",
                                border: "0px"
                            }
                        });
                        setTimeout(() => window.location.reload(), 2000);
                    } else {
                        toast.error(`Training failed: ${status.error}`, {
                            style: {
                                background: "linear-gradient(to bottom right, #5C0A14, #BC2120, #9B111E)",
                                color: "white",
                                border: "0px"
                            }
                        });
                    }
                }
            } catch (error) {
                console.error('Error polling:', error);
                toast.error('Status check failed', {
                    style: {
                        background: "linear-gradient(to bottom right, #5C0A14, #BC2120, #9B111E)",
                        color: "white",
                        border: "0px"
                    }
                });
            }
        };

        const interval = setInterval(pollStatus, 5000);
        pollStatus();

        return () => clearInterval(interval);
    }, [taskId]);

    useEffect(() => {
        if (taskStatus) {
            // Use real progress from API if available
            if (taskStatus.progress !== undefined) {
                setProgress(taskStatus.progress)
            }
        }
    }, [taskStatus])

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(false)
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleImageUpload(e.dataTransfer.files[0])
        }
    }


    const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true)
        } else if (e.type === "dragleave") {
            setDragActive(false)
        }
    }


    return (
        <div className="min-h-screen overflow-hidden relative flex items-center justify-center p-2 md:p-8 my-5">
            <main className="w-full max-w-7xl mx-auto">
                {
                    isProcessing ? (
                        <AnimatePresence>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="flex items-center justify-center p-5"
                            >
                                {/* 9:16 aspect ratio container - like a phone screen */}
                                <div
                                    className="relative bg-zinc-900 rounded-xl overflow-hidden aspect-[9/16] w-full max-w-xs"// 9:16 ratio
                                >
                                    {/* Progress Fill - Coming from top to bottom */}
                                    <motion.div
                                        className="absolute top-0 left-0 w-full "
                                        style={{
                                            background: 'linear-gradient(180deg, #B08D57 0%, #4e3c20 100%)',
                                        }}
                                        initial={{ height: '0%' }}
                                        animate={{ height: `${progress}%` }}
                                        transition={{ duration: 0.1, ease: 'easeOut' }}
                                    />

                                    {/* Glow effect at the progress edge */}
                                    <motion.div
                                        className="absolute left-0 w-full h-3"
                                        style={{
                                            background: 'linear-gradient(180deg, rgba(176, 141, 87, 0.8) 0%, transparent 100%)',
                                            filter: 'blur(4px)',
                                            top: `${progress}%`,
                                            transform: 'translateY(-50%)',
                                        }}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: progress > 0 ? 1 : 0 }}
                                    />
                                    <p className='absolute bottom-2 right-5 bg-gradient-to-br from-[#B08D57] to-[#4e3c20] bg-clip-text text-transparent font-bold text-5xl'>{Math.round(progress)}%</p>
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    ) : generatedVideoUrl ? (
                        // Generated Image Display UI
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
                            className="w-full max-w-4xl mx-auto"
                        >
                            {/* Header */}
                            <motion.div
                                initial={{ y: -30, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ duration: 0.6, delay: 0.2 }}
                                className="text-center mb-8"
                            >
                                <h1 className="text-4xl md:text-5xl font-light text-white mb-4 tracking-wide">
                                    Your Masterpiece
                                </h1>
                            </motion.div>

                            {/* Generated Image Container */}
                            <motion.div
                                initial={{ y: 40, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ duration: 0.8, delay: 0.4 }}
                                className="relative"
                            >
                                {/* Main Image Display */}
                                <div className="relative rounded-3xl overflow-hidden shadow-2xl p-2 backdrop-blur-sm border-3 border-[#B08D57]">
                                    <motion.video
                                        initial={{ opacity: 0, scale: 1.1 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ duration: 1, delay: 0.6 }}
                                        src={generatedVideoUrl}
                                        autoPlay
                                        loop
                                        muted
                                        playsInline
                                        className="w-full h-auto rounded-2xl shadow-lg"
                                    />

                                    {/* Premium Overlay Gradient */}
                                    <div className="absolute inset-2 rounded-2xl bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
                                </div>

                                {/* Action Buttons */}
                                <motion.div
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ duration: 0.6, delay: 0.8 }}
                                    className="flex flex-col sm:flex-row gap-4 mt-8 justify-center"
                                >
                                    {/* Download Button */}
                                    <motion.button
                                        onClick={() => downloadVideo(generatedVideoUrl)}
                                        className="flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-br from-[#4e3c20] via-[#B08D57] to-[#4e3c20] text-black rounded-2xl font-medium tracking-wide shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer"
                                    >
                                        Download Masterpiece
                                    </motion.button>

                                    {/* Create New Button */}
                                    <motion.button
                                        onClick={handleCreateNew}
                                        className="flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-br from-black via-zinc-900 to-black backdrop-blur-sm text-white rounded-2xl font-medium tracking-wide transition-all duration-300 group cursor-pointer"
                                    >
                                        Create New
                                    </motion.button>
                                </motion.div>

                            </motion.div>
                        </motion.div>
                    ) : (
                        <Card className="w-full max-w-xl mx-auto bg-gradient-to-r from-[#E5C88C] via-[#B08D57] to-[#A47A3E] text-black  rounded-2xl font-medium text-lg shadow-2xl shadow-amber-500/25 hover:shadow-amber-500/40 transform transition-all duration-300 border border-amber-400/20">
                            <CardContent className="p-4 space-y-6">
                                <motion.h1
                                    initial={{ opacity: 0, y: -20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.6 }}
                                    className="text-3xl font-semibold text-center"
                                >
                                    O P U S
                                </motion.h1>

                                <textarea
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    placeholder="Describe your vision..."
                                    rows={5}
                                    className="w-full bg-black border-2 border-black rounded-2xl p-3 placeholder:text-zinc-300 text-zinc-300 resize-none focus:outline-none transition-all duration-300 tracking-wide scroll-hidden"
                                />

                                <motion.div className='flex items-center justify-between gap-3'>
                                    <Select value={model} onValueChange={setModel}>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select Model" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-gradient-to-r from-[#E5C88C] via-[#B08D57] to-[#A47A3E] text-black p-3 rounded-2xl font-medium text-lg shadow-2xl shadow-amber-500/25 hover:shadow-amber-500/40 transform transition-all duration-300 border border-amber-400/20">
                                            <SelectItem value="sora 2">Sora 2</SelectItem>
                                            <SelectItem value="wan 2.5">Wan 2.5 </SelectItem>
                                            <SelectItem value="veo3">Veo 3 </SelectItem>
                                            <SelectItem value="hailuo 02 pro">Hailuo 02 Pro</SelectItem>
                                            <SelectItem value="kling 2.1 master">Kling 2.1 Master</SelectItem>
                                        </SelectContent>
                                    </Select>

                                    <Select value={aspectRatio} onValueChange={setAspectRatio}>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select Model" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-gradient-to-r from-[#E5C88C] via-[#B08D57] to-[#A47A3E] text-black p-3 rounded-2xl font-medium text-lg shadow-2xl shadow-amber-500/25 hover:shadow-amber-500/40 transform transition-all duration-300 border border-amber-400/20">
                                            <SelectItem value="9:16">9:16</SelectItem>
                                            <SelectItem value="16:9">16:9</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </motion.div>

                                <motion.div className="w-full space-y-4">
                                    <label className="cursor-pointer block w-full">
                                        <motion.div

                                            className={`relative bg-black transition-all duration-500 rounded-2xl text-center cursor-pointer group
                                ${dragActive ? 'border-2' : ''}

                            `} onDragEnter={handleDrag}
                                            onDragLeave={handleDrag}
                                            onDragOver={handleDrag}
                                            onDrop={handleDrop}>
                                            {videoPreview ? (
                                                <motion.div>
                                                    <motion.img
                                                        src={videoPreview}
                                                        alt="Preview"
                                                        className="w-full h-full object-cover rounded-xl"
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        transition={{ duration: 0.5 }}
                                                    />
                                                    <motion.div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center opacity-100 transition-opacity duration-300">
                                                        <p className="text-white text-sm font-light">Click or drop to change</p>
                                                    </motion.div>
                                                </motion.div>
                                            ) : (
                                                <motion.div
                                                    key="upload"
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -20 }}
                                                    className="py-12 flex flex-col justify-center items-center h-64 "
                                                >
                                                    <div className="w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center">
                                                        <Upload className="w-7 h-7 text-[#B08D57]" />
                                                    </div>
                                                    <p className="text-white/70 font-light mb-2">Drop your reference image here (optional)</p>
                                                </motion.div>
                                            )}
                                        </motion.div>
                                        <input type="file" accept="image/*" onChange={(e) => e.target.files && handleImageUpload(e.target.files[0])} className="hidden" />
                                    </label>
                                </motion.div>

                                <motion.button
                                    onClick={handleSubmit}
                                    className="w-full rounded-lg py-2 text-lg bg-black text-[#B08D57] cursor-pointer flex items-center justify-center  "
                                >
                                    <svg width="30" height="30" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
                                        <defs>
                                            <linearGradient id="minimalistGold" cx="50%" cy="50%" r="60%">
                                                <stop offset="0%" style={{ stopColor: "#F4E4BC", stopOpacity: 1 }} />
                                                <stop offset="50%" style={{ stopColor: "#E6C878", stopOpacity: 1 }} />
                                                <stop offset="100%" style={{ stopColor: "#C9A96E", stopOpacity: 1 }} />
                                            </linearGradient>
                                        </defs>
                                        <path d="M 200 40 
                                                Q 220 160 240 180 
                                                Q 290 190 340 200 
                                                Q 290 210 240 220 
                                                Q 220 240 200 360 
                                                Q 180 240 160 220 
                                                Q 110 210 60 200 
                                                Q 110 190 160 180 
                                                Q 180 160 200 40 
                                                Z"
                                            fill="url(#minimalistGold)"
                                            stroke="none" />
                                    </svg> {auraCost.find(item => item.model === model)?.cost}
                                </motion.button>
                            </CardContent>
                        </Card>
                    )}
            </main>
        </div>
    );
};

export default Page;