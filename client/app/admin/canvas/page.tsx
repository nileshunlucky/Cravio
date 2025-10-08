"use client"

import React, { Suspense, useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, User } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useSearchParams } from 'next/navigation'

interface TaskResult {
    message: string
    generated_image_url?: string
}

interface TaskStatus {
    state: string
    status?: string
    current?: number
    total?: number
    progress?: number
    result?: TaskResult
    error?: string
}

// Define a consistent type for a Persona
type Persona = {
    persona_name: string;
    image_url: string;
    model: string;
};

// Component that uses useSearchParams - wrapped in Suspense
function CanvasContent() {
    const { user } = useUser()
    const email = user?.emailAddresses?.[0]?.emailAddress || ''
    const router = useRouter()
    const searchParams = useSearchParams() // Now safely wrapped in Suspense

    // State for personas fetched from the database
    const [existingPersonas, setExistingPersonas] = useState<Persona[]>([])
    // State for the currently selected persona
    const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null)

    const [uploadedImage, setUploadedImage] = useState<File | null>(null)
    const [prompt, setPrompt] = useState('')
    const [isProcessing, setIsProcessing] = useState(false)
    const [imagePreview, setImagePreview] = useState<string | null>(null)
    const [taskId, setTaskId] = useState<string | null>(null)
    const [taskStatus, setTaskStatus] = useState<TaskStatus | null>(null)
    const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null)

    // Lux processing animation
    const [progress, setProgress] = useState(0)

    // Handle URL parameters on component mount
    useEffect(() => {
        const urlPrompt = searchParams.get('prompt');
        const referenceImage = searchParams.get('referenceImage');

        if (urlPrompt) {
            setPrompt(decodeURIComponent(urlPrompt));
        }

        if (referenceImage) {
            // If you want to set the reference image as well
            const imageUrl = decodeURIComponent(referenceImage);
            // You can set this in an image preview state or use it as needed
            setImagePreview(imageUrl);
            
            // clear the search params
            setTimeout(() => {
                router.replace('/admin/canvas');
            }, 100);
        }
    }, [searchParams, router]);

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

    // Fetch user data and personas on component mount
    useEffect(() => {
        const fetchUserData = async () => {
            if (!email) {
                return
            }

            try {
                const res = await fetch(`https://cravio-ai.onrender.com/user/${email}`)
                const data = await res.json()

                if (res.ok) {
                    const personasData = data.personas;
                    // Handle cases where 'personas' is a single object or an array
                    if (personasData) {
                        setExistingPersonas(Array.isArray(personasData) ? personasData : [personasData]);
                    } else {
                        setExistingPersonas([]);
                    }
                } else {
                    console.error("Error from server:", data)
                    toast.error("Failed to load user data", {
                        style: {
                            background: "linear-gradient(to bottom right, #5C0A14, #BC2120, #9B111E)",
                            color: "white",
                            border: "0px"
                        }
                    })
                }
            } catch (error) {
                console.error("Failed to fetch user data:", error)
                toast.error("An error occurred while fetching data.", {
                    style: {
                        background: "linear-gradient(to bottom right, #5C0A14, #BC2120, #9B111E)",
                        color: "white",
                        border: "0px"
                    }
                })
            }
        }

        fetchUserData()
    }, [email])

    // Handler for image file selection
    const handleImageUpload = (file: File) => {
        if (file && file.type.startsWith('image/')) {
            setUploadedImage(file)
            const reader = new FileReader()
            reader.onload = (e) => {
                const result = e.target?.result
                if (typeof result === "string") {
                    setImagePreview(result)
                }
            }
            reader.readAsDataURL(file)
        }
    }

    // Drag and drop handlers
    const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        e.stopPropagation()
    }

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleImageUpload(e.dataTransfer.files[0])
        }
    }

    // Handler for the generate button
    const handleGenerate = async () => {
        if (!prompt || !selectedPersona) return toast.error(!prompt ? "Please enter a prompt." : "Please select a persona.", {
            style: {
                background: "linear-gradient(to bottom right, #5C0A14, #BC2120, #9B111E)",
                color: "white",
                border: "0px"
            }
        });

        setProgress(0)
        setIsProcessing(true)
        setGeneratedImageUrl(null) // Reset previous generated image
        setTaskStatus(null)
        try {
            const formData = new FormData()
            formData.append('lora_url', selectedPersona.model)
            formData.append('email', email)
            formData.append('prompt', prompt)
            if (uploadedImage) {
                formData.append('image', uploadedImage)
            }

            const res = await fetch('https://cravio-ai.onrender.com/api/persona-image', {
                method: 'POST',
                body: formData,
            })

            const data = await res.json()

            if (res.ok) {
                setTaskId(data.task_id)
                toast.success('Image generation started!', {
                    style: {
                        background: "linear-gradient(to bottom right, #4e3c20, #B08D57, #4e3c20)",
                        color: "black",
                        border: "0px"
                    }
                })
            }
            else if (res.status === 403) {
                toast.error('Not enough aura', {
                    style: {
                        background: "linear-gradient(to bottom right, #5C0A14, #BC2120, #9B111E)",
                        color: "white",
                        border: "0px"
                    }
                });
                router.push('/admin/pricing')
            }
            else {
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
            toast.error("An error occurred while generating the image.", {
                style: {
                    background: "linear-gradient(to bottom right, #5C0A14, #BC2120, #9B111E)",
                    color: "white",
                    border: "0px"
                }
            })
            console.log(error)
        } finally {
            setIsProcessing(false)
        }
    }

    useEffect(() => {
        if (!taskId) return;

        const pollStatus = async () => {
            try {
                const response = await fetch(`https://cravio-ai.onrender.com/api/task-status/${taskId}`);
                const status = await response.json();
                setTaskStatus(status);

                // Stop polling if task finished
                if (status.state === 'SUCCESS' || status.state === 'FAILURE') {
                    setIsProcessing(false);
                    if (status.state === 'SUCCESS') {
                        // Set the generated image URL from the result
                        if (status.result?.generated_image_url) {
                            setGeneratedImageUrl(status.result.generated_image_url);
                        }
                        toast.success('Image generation completed!', {
                            style: {
                                background: "linear-gradient(to bottom right, #4e3c20, #B08D57, #4e3c20)",
                                color: "black",
                                border: "0px"
                            }
                        });
                    } else {
                        toast.error(`Image generation failed: ${status.error}`, {
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
                toast.error('Error checking task status', {
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

    // Handler for downloading the generated image
    const downloadImage = async (imageUrl: string) => {
        try {
            // Use your FastAPI backend URL
            const proxyUrl = `https://cravio-ai.onrender.com/proxy-image?url=${encodeURIComponent(imageUrl)}`
            const response = await fetch(proxyUrl)

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }

            const blob = await response.blob()
            const downloadUrl = URL.createObjectURL(blob)

            const a = document.createElement('a')
            a.href = downloadUrl
            a.download = `Post-${Date.now()}.jpg`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(downloadUrl)

            toast.success("Post Downloaded!", {
                style: {
                    background: "linear-gradient(to bottom right, #4e3c20, #B08D57, #4e3c20)",
                    color: "black",
                    border: "0px"
                }
            })
        } catch (error) {
            console.error("Download failed:", error)
            toast.error("Download failed. Opening image in new tab...", {
                style: {
                    background: "linear-gradient(to bottom right, #5C0A14, #BC2120, #9B111E)",
                    color: "white",
                    border: "0px"
                }
            })
            window.open(imageUrl)
        }
    }

    // Handler for creating a new image (reset)
    const handleCreateNew = () => {
        setGeneratedImageUrl(null);
        setTaskId(null);
        setTaskStatus(null);
        setPrompt('');
        setUploadedImage(null);
        setImagePreview(null);
        setSelectedPersona(null);
    };

    useEffect(() => {
        if (taskStatus) {
            // Use real progress from API if available
            if (taskStatus.progress !== undefined) {
                setProgress(taskStatus.progress)
            }
        }
    }, [taskStatus])

    return (
        <div className="min-h-screen overflow-hidden relative flex items-center justify-center p-4 sm:p-6 lg:p-8">
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
                    ) : generatedImageUrl ? (
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
                                <p className="text-zinc-400 font-light">
                                    Crafted with {selectedPersona?.persona_name}
                                </p>
                            </motion.div>

                            {/* Generated Image Container */}
                            <motion.div
                                initial={{ y: 40, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ duration: 0.8, delay: 0.4 }}
                                className="relative"
                            >
                                {/* Main Image Display */}
                                <div className="relative rounded-3xl overflow-hidden shadow-2xl p-2 backdrop-blur-sm border-3">
                                    <motion.img
                                        initial={{ opacity: 0, scale: 1.1 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ duration: 1, delay: 0.6 }}
                                        src={generatedImageUrl}
                                        alt="Generated masterpiece"
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
                                        onClick={() => downloadImage(generatedImageUrl)}
                                        className="flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-[#C9A96E] via-[#B08D57] to-[#ad8544] transition-all duration-300 text-black rounded-2xl font-medium tracking-wide shadow-lg hover:shadow-xl transition-all duration-300 group"
                                    >
                                        Download Masterpiece
                                    </motion.button>

                                    {/* Create New Button */}
                                    <motion.button
                                        onClick={handleCreateNew}
                                        className="bg-gradient-to-r from-[#E5C88C] via-[#B08D57] to-[#A47A3E] text-black p-3 rounded-2xl font-medium text-lg shadow-2xl shadow-amber-500/25 hover:shadow-amber-500/40 transform transition-all duration-300 border group"
                                    >
                                        Create New
                                    </motion.button>
                                </motion.div>

                            </motion.div>
                        </motion.div>
                    ) : (
                        // Original UI for creation
                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="flex flex-col gap-8">
                                {/* Column 1: Image Upload */}
                                <motion.div
                                    initial={{ x: -60, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    transition={{ duration: 0.8, delay: 0.2, ease: [0.23, 1, 0.32, 1] }}
                                    className="lg:col-span-1"
                                >
                                    <motion.div
                                        className={`relative border-3 transition-all duration-500 rounded-2xl p-2 text-center cursor-pointer group
                               
                            `}
                                        onDragEnter={handleDrag}
                                        onDragLeave={handleDrag}
                                        onDragOver={handleDrag}
                                        onDrop={handleDrop}
                                        onClick={() => document.getElementById('image-upload')?.click()}
                                    >
                                        <AnimatePresence mode="wait">
                                            {imagePreview ? (
                                                <motion.div
                                                    key="preview"
                                                    initial={{ opacity: 0, scale: 0.8 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.8 }}
                                                >
                                                    <img
                                                        src={imagePreview}
                                                        alt="Preview"
                                                        className="w-full h-64 object-cover rounded-xl"
                                                    />
                                                    <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center opacity-100 transition-opacity duration-300">
                                                        <p className="text-white text-sm font-light">Click or drop to change</p>
                                                    </div>
                                                    {/* remove setImagePreview button */}
                                                    <button onClick={() => setImagePreview(null)} className="absolute top-0 right-2 text-[#B08D57] text-3xl p-3 rounded-full p-2">x</button>
                                                </motion.div>
                                            ) : (
                                                <motion.div
                                                    key="upload"
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -20 }}
                                                    className="py-12 flex flex-col justify-center items-center h-64"
                                                >
                                                    <div className="w-16 h-16 mx-auto mb-6  rounded-full flex items-center justify-center">
                                                        <Upload className="w-6 h-6 " />
                                                    </div>
                                                    <p className="text-white/50 font-light mb-2">Drop your reference image here (optional)</p>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                        <input
                                            id="image-upload"
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) => e.target.files && handleImageUpload(e.target.files[0])}
                                        />
                                    </motion.div>
                                </motion.div>

                                {/*Prompt & Generate */}
                                <motion.div
                                    initial={{ x: 60, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    transition={{ duration: 0.8, delay: 0.6, ease: [0.23, 1, 0.32, 1] }}
                                    className="lg:col-span-1 space-y-8"
                                >
                                    <div>
                                        <motion.div whileFocus={{ scale: 1.02 }} className="relative">
                                            <textarea
                                                value={prompt}
                                                onChange={(e) => setPrompt(e.target.value)}
                                                placeholder="Describe your vision..."
                                                className="w-full h-32 bg-white/5 border border-white rounded-xl p-4 placeholder-white/40 resize-none focus:outline-none transition-all duration-300 font-light scroll-hidden"
                                            />
                                            <motion.div
                                                className="absolute bottom-3 right-3 text-white/30 text-xs font-light"
                                                animate={{ opacity: prompt.length > 0 ? 1 : 0.5 }}
                                            >
                                                {prompt.length}
                                            </motion.div>
                                        </motion.div>
                                    </div>

                                    <motion.button
                                        onClick={handleGenerate}
                                        key="generate"
                                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                                        className="w-full bg-gradient-to-r from-[#E5C88C] via-[#B08D57] to-[#A47A3E] text-black p-3 rounded-2xl font-medium text-lg shadow-2xl shadow-amber-500/25 hover:shadow-amber-500/40 transform transition-all duration-300 border group cursor-pointer"
                                    >
                                        <span>Craft Masterpiece</span>
                                    </motion.button>
                                </motion.div>
                            </div>

                            {/* Column 2: Persona Selection */}
                            <motion.div
                                initial={{ y: 60, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ duration: 0.8, delay: 0.4, ease: [0.23, 1, 0.32, 1] }}
                                className="lg:col-span-1 space-y-6"
                            >
                                <div className="flex items-center space-x-3">
                                    <h2 className="text-2xl font-light text-zinc-300 tracking-wide">Select Your Persona</h2>
                                </div>

                                {existingPersonas?.length > 0 ? (
                                    <div className="grid grid-cols-2 gap-4">
                                        {existingPersonas.map((persona) => (
                                            <motion.div
                                                key={persona.persona_name}
                                                onClick={() => setSelectedPersona(persona)}
                                                className={`relative rounded-xl overflow-hidden cursor-pointer transition-all duration-300 aspect-square
                        ${selectedPersona?.persona_name === persona.persona_name ? 'ring-2 ring-offset-2 ring-offset-black ring-[#B08D57]' : 'ring-1 ring-white/10'}`}
                                            >
                                                <img
                                                    src={persona.image_url}
                                                    alt={persona.persona_name}
                                                    className="w-full h-full object-cover"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                                                <p className="absolute bottom-2 left-3 text-white font-medium ">{persona.persona_name}</p>
                                                <AnimatePresence>
                                                    {selectedPersona?.persona_name === persona.persona_name && (
                                                        <motion.div
                                                            initial={{ opacity: 0, scale: 0.5 }}
                                                            animate={{ opacity: 1, scale: 1 }}
                                                            exit={{ opacity: 0, scale: 0.5 }}
                                                            className="absolute top-2 right-2 w-6 h-6 bg-[#B08D57] rounded-full flex items-center justify-center"
                                                        >
                                                            <svg className="w-4 h-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                            </svg>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </motion.div>
                                        ))}
                                    </div>
                                ) : (
                                    // No Personas State
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.6 }}
                                        className="flex flex-col items-center justify-center py-16 px-6 text-center space-y-6"
                                    >
                                        {/* Icon */}
                                        <div className="w-20 h-20 rounded-full flex items-center justify-center">
                                            <User className='w-10 h-10' />
                                        </div>

                                        {/* Message */}
                                        <div className="space-y-3">
                                            <h3 className="text-xl font-medium text-white">No Personas Found</h3>
                                        </div>

                                        {/* Create Persona Button */}
                                        <motion.div
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                        >
                                            <button
                                                onClick={() => router.push('/admin/personas')}
                                                className="px-8 py-3 bg-gradient-to-r from-[#E5C88C] via-[#B08D57] to-[#A47A3E] text-black p-3 rounded-2xl font-medium text-lg shadow-2xl shadow-amber-500/25 hover:shadow-amber-500/40 transform transition-all duration-300 border group cursor-pointer flex items-center gap-2"
                                            >
                                                Create Persona
                                            </button>
                                        </motion.div>
                                    </motion.div>
                                )}
                            </motion.div>

                        </div>)
                }
            </main>
        </div>
    )
}

// Main Page component with Suspense boundary
const Page = () => {
    return (
        <Suspense fallback={
            <div className="min-h-screen overflow-hidden relative flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-black">
                <div className="flex items-center justify-center">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-white text-lg font-light"
                    >
                        Loading canvas...
                    </motion.div>
                </div>
            </div>
        }>
            <CanvasContent />
        </Suspense>
    )
}

export default Page
