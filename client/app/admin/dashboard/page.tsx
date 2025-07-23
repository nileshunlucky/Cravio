"use client"

import React, { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { toast } from 'sonner'
import { motion, AnimatePresence, useMotionValue } from 'framer-motion'
import { Upload, Sparkles, ArrowRight } from 'lucide-react'

// Define a consistent type for a Persona
type Persona = {
    persona_name: string;
    image_url: string;
    model: string;
};

const Page = () => {
    const { user } = useUser()
    const email = user?.emailAddresses?.[0]?.emailAddress || ''

    // State for personas fetched from the database
    const [existingPersonas, setExistingPersonas] = useState<Persona[]>([])
    // State for the currently selected persona
    const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null)

    const [uploadedImage, setUploadedImage] = useState<File | null>(null)
    const [prompt, setPrompt] = useState('')
    const [dragActive, setDragActive] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false)
    const [imagePreview, setImagePreview] = useState<string | null>(null)

    // Motion values for potential future animations
    const mouseX = useMotionValue(0)
    const mouseY = useMotionValue(0)

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
                    toast.error("Failed to load user data")
                }
            } catch (error) {
                console.error("Failed to fetch user data:", error)
                toast.error("An error occurred while fetching data.")
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
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true)
        } else if (e.type === "dragleave") {
            setDragActive(false)
        }
    }

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(false)
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleImageUpload(e.dataTransfer.files[0])
        }
    }

    // Handler for the generate button
    const handleGenerate = async () => {
        if (!prompt || !selectedPersona || !uploadedImage) {
            toast.error("Please upload an image, select a persona, and enter a prompt.")
            return
        }

        try {
            setIsProcessing(true)
        // Simulate processing
        setTimeout(() => {
            setIsProcessing(false)
            toast.success("Image generated successfully!", {
                style: {
                    background: "linear-gradient(to right, #B08D57, #4e3c20)",
                    color: "black",
                    border: "2px solid black"
                }
            })
        }, 3000)
        } catch (error) {
            toast.error("An error occurred while generating the image.", {
                style: {
                    background: "linear-gradient(to right, #B08D57, #4e3c20)",
                    color: "black",
                    border: "2px solid black"
                }
            })
            setIsProcessing(false)
        }
    }

    return (
        <div
            className="min-h-screen bg-black text-white overflow-hidden relative flex items-center justify-center p-4 sm:p-6 lg:p-8"
            onMouseMove={(e) => {
                mouseX.set(e.clientX)
                mouseY.set(e.clientY)
            }}
        >
            <main className="w-full max-w-7xl mx-auto">
                <div className="grid lg:grid-cols-3 gap-8 items-start">

                    {/* Column 1: Image Upload */}
                    <motion.div
                        initial={{ x: -60, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ duration: 0.8, delay: 0.2, ease: [0.23, 1, 0.32, 1] }}
                        className="lg:col-span-1"
                    >
                        <motion.div
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`relative border-2 transition-all duration-500 rounded-2xl p-8 text-center cursor-pointer group
                                ${dragActive ? 'border-[#B08D57] bg-[#B08D57]/5' : 'border-[#B08D57]/50'}
                                ${imagePreview ? 'border-[#B08D57]/50' : ''}
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
                                        className="relative"
                                    >
                                        <img
                                            src={imagePreview}
                                            alt="Preview"
                                            className="w-full h-64 object-cover rounded-xl"
                                        />
                                        <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center opacity-100 transition-opacity duration-300">
                                            <p className="text-white text-sm font-light">Click or drop to change</p>
                                        </div>
                                    </motion.div>
                                ) : (
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
                                        <p className="text-white/70 font-light mb-2">Drop your image here</p>
                                        <p className="text-white/40 text-sm font-light">or click to browse</p>
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
                        <div className="grid grid-cols-2 gap-4">
                            {existingPersonas.map((persona) => (
                                <motion.div
                                    key={persona.persona_name}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setSelectedPersona(persona)}
                                    className={`relative rounded-xl overflow-hidden cursor-pointer transition-all duration-300 aspect-square
                                        ${selectedPersona?.persona_name === persona.persona_name ? 'ring-2 ring-offset-2 ring-offset-black ring-[#B08D57]' : 'ring-1 ring-white/10'}`}
                                >
                                    <img
                                        src={persona.image_url}
                                        alt={persona.persona_name}
                                        className="w-full h-full object-cover"
                                        onError={(e) => { e.currentTarget.src = `https://placehold.co/200x200/1a1a1a/ffffff?text=${persona.persona_name.charAt(0)}` }}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                                    <p className="absolute bottom-2 left-3 text-white font-medium text-sm">{persona.persona_name}</p>
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
                    </motion.div>

                    {/* Column 3: Prompt & Generate */}
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
                                    maxLength={500}
                                    className="w-full h-32 bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder-white/40 resize-none focus:outline-none focus:border-[#B08D57]/50 transition-all duration-300 font-light"
                                />
                                <motion.div
                                    className="absolute bottom-3 right-3 text-white/30 text-xs font-light"
                                    animate={{ opacity: prompt.length > 0 ? 1 : 0.5 }}
                                >
                                    {prompt.length}/500
                                </motion.div>
                            </motion.div>
                        </div>

                        <motion.div
                            whileTap={{ scale: 0.95 }}
                            onClick={handleGenerate}
                            className="w-full bg-gradient-to-r from-[#B08D57] to-[#4e3c20] text-black py-4 rounded-xl font-medium tracking-wide disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group h-16 flex items-center justify-center"
                            >
                            <AnimatePresence mode="wait">
                                {isProcessing ? (
                                    <motion.div
                                        key="processing"
                                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                                        className="flex items-center justify-center space-x-2"
                                    >
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                        >
                                            <Sparkles className="w-5 h-5" />
                                        </motion.div>
                                        <span>Crafting...</span>
                                    </motion.div>
                                ) : (
                                    <motion.button
                                        disabled={!prompt || !selectedPersona || isProcessing}
                                        key="generate"
                                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                                        className="flex items-center justify-center space-x-2"
                                    >
                                        <span>Generate Masterpiece</span>
                                        <ArrowRight className="w-5 h-5 transition-transform duration-300" />
                                    </motion.button>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    </motion.div>
                </div>
            </main>
        </div>
    )
}

export default Page
