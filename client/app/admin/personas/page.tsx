"use client"

import React, { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, X,Loader2, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'

interface ImageFile {
    file: File
    preview: string
}

interface TaskResult {
    message: string
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

interface Persona {
    image_url: string 
    progress: number
    _id: string
    persona_name: string
    status: string
    created_at: string
    model: string
}

const MAX_IMAGES = 20

// Skeleton Components
const PersonaSkeleton = () => (
    <div className="aspect-square bg-gradient-to-br from-zinc-900/40 to-zinc-800/20 rounded-2xl overflow-hidden">
        <motion.div 
            className="w-full h-full bg-gradient-to-br from-transparent via-white/5 to-transparent"
            animate={{
                x: ['-100%', '100%']
            }}
            transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
            }}
        />
    </div>
)

const Page = () => {
    const [personaName, setPersonaName] = useState('')
    const [images, setImages] = useState<ImageFile[]>([])
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [taskId, setTaskId] = useState<string | null>(null)
    const [taskStatus, setTaskStatus] = useState<TaskStatus | null>(null)
    const [existingPersonas, setExistingPersonas] = useState<Persona[]>([])
    const [showCreateNew, setShowCreateNew] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const { user } = useUser()
    const router = useRouter()
    const email = user?.emailAddresses?.[0]?.emailAddress || ''

    useEffect(() => {
        const fetchUserData = async () => {
            if (!user?.emailAddresses?.[0]?.emailAddress) {
                toast.error("Authentication required", {
                    style: {
                        background: "linear-gradient(to bottom right, #5C0A14, #BC2120, #9B111E)",
                        color: "white",
                        border: "0px"
                    }
                })
                return
            }

            try {
                const res = await fetch(`https://cravio-ai.onrender.com/user/${email}`)
                const data = await res.json()

                if (res.ok) {
                    setExistingPersonas(data.personas || [])
                } else {
                    toast.error("Failed to load data", {
                        style: {
                            background: "linear-gradient(to bottom right, #5C0A14, #BC2120, #9B111E)",
                            color: "white",
                            border: "0px"
                        }
                    })
                }
            } catch (error) {
                console.error("Failed to fetch user data:", error)
                toast.error("Failed to load data", {
                    style: {
                        background: "linear-gradient(to bottom right, #5C0A14, #BC2120, #9B111E)",
                        color: "white",
                        border: "0px"
                    }
                })
            } finally {
                setIsLoading(false)
            }
        }

        fetchUserData()
    }, [user, email])

    useEffect(() => {
        if (!taskId) return;

        const pollStatus = async () => {
            try {
                const response = await fetch(`https://cravio-ai.onrender.com/api/task-status/${taskId}`);
                const status = await response.json();
                setTaskStatus(status);

                if (status.state === 'SUCCESS' || status.state === 'FAILURE') {
                    setIsSubmitting(false);
                    if (status.state === 'SUCCESS') {
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

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (!files) return

        const selectedFiles = Array.from(files).slice(0, MAX_IMAGES - images.length)
        const newImages = selectedFiles.map(file => ({
            file,
            preview: URL.createObjectURL(file),
        }))

        setImages(prev => [...prev, ...newImages])
    }

    const handleRemoveImage = (index: number) => {
        setImages(prev => {
            const newArr = [...prev]
            URL.revokeObjectURL(newArr[index].preview)
            newArr.splice(index, 1)
            return newArr
        })
    }

    const handleSubmit = async () => {
        if (!personaName || images.length < 10) {
            toast.error('Name and 10+ images required!', {
                style: {
                    background: "linear-gradient(to bottom right, #5C0A14, #BC2120, #9B111E)",
                    color: "white",
                    border: "0px"
                }
            })
            return
        }

        setIsSubmitting(true)
        setTaskStatus(null)

        const formData = new FormData()
        formData.append('persona_name', personaName)
        formData.append('email', email)
        images.forEach((img) => {
            formData.append('images', img.file)
        })

        try {
            const res = await fetch('https://cravio-ai.onrender.com/api/train-persona', {
                method: 'POST',
                body: formData,
            })

            const data = await res.json()

            if (res.ok) {
                setTaskId(data.task_id)
                toast.success('Training initiated', {
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
                })
                router.push('/admin/pricing')
            }

        } catch (error) {
            console.error('Error submitting persona:', error)
            toast.error('Training failed to start', {
                style: {
                    background: "linear-gradient(to bottom right, #5C0A14, #BC2120, #9B111E)",
                    color: "white",
                    border: "0px"
                }
            })
        } finally {
            setIsSubmitting(false)
        }
    }


    const getPersonaStatusBadge = (status: string) => {
        const variants: Record<string, string> = {
            // #4e3c20, #B08D57, #4e3c20
            'completed': 'bg-gradient-to-br from-[#4e3c20] via-[#B08D57] to-[#4e3c20] text-black',
            'processing': 'bg-black text-[#B08D57] border-[#B08D57] border-2',
            'failed': 'bg-gradient-to-br from-[#5C0A14] via-[#BC2120] to-[#9B111E] text-white',
        }

        return (
            <Badge className={`${variants[status]} `}>
                {status === 'completed' ? 'Completed' : status === 'processing' ? 'Processing' : 'Failed'}
            </Badge>
        )
    }

    return (
        <div className="min-h-screen bg-black">
            {/* Ambient Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <motion.div
                    className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-gradient-to-br from-[#B08D57]/5 to-transparent blur-3xl"
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.5, 0.3]
                    }}
                    transition={{ duration: 8, repeat: Infinity }}
                />
            </div>

            <div className="relative z-10 max-w-6xl mx-auto px-4 py-8">
                
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between mb-12"
                >
                    <div className="flex items-center gap-4">
                        {showCreateNew && (
                            <motion.button
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setShowCreateNew(false)}
                                className="w-10 h-10 rounded-full bg-gradient-to-br from-zinc-900/80 to-zinc-800/60 backdrop-blur-xl border border-zinc-700/50 flex items-center justify-center text-white/70 hover:text-white transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4" />
                            </motion.button>
                        )}
                        <h1 className="text-3xl md:text-4xl font-extralight text-white tracking-wider">
                            {showCreateNew ? 'Create' : `Persona's`}
                        </h1>
                    </div>

                    {!showCreateNew && (
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setShowCreateNew(true)}
                            className="px-6 py-3 bg-gradient-to-r from-[#E5C88C] via-[#B08D57] to-[#A47A3E] text-black p-3 rounded-2xl font-medium text-lg shadow-2xl shadow-amber-500/25 hover:shadow-amber-500/40 transform transition-all duration-300 border border-amber-400/20 group cursor-pointer flex items-center gap-2"
                        >
                            <span>New Persona</span>
                        </motion.button>
                    )}
                </motion.div>

                <AnimatePresence mode="wait">
                    {!showCreateNew ? (
                        /* Collection Grid */
                        <motion.div
                            key="collection"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
                        >
                            {isLoading ? (
                                Array.from({ length: 10 }).map((_, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: i * 0.1 }}
                                    >
                                        <PersonaSkeleton />
                                    </motion.div>
                                ))
                            ) : (
                                existingPersonas.map((persona, index) => (
                                    <motion.div
                                        key={persona._id}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="group cursor-pointer"
                                    >
                                        <div className="aspect-square relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900/50 to-zinc-800/30 backdrop-blur-xl border-zinc-700/30 hover:border-[#B08D57] transition-all duration-500">
                                            <img
                                                src={persona.image_url}
                                                alt={persona.persona_name}
                                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-100 transition-opacity duration-300" />
                                            
                                            {/* Status Badge */}
                                            <div className="absolute top-3 right-3">
                                                {getPersonaStatusBadge(persona.status)}
                                            </div>

                                            {/* Name Overlay */}
                                            <div className="absolute bottom-0 left-0 right-0 p-4 transform  transition-transform duration-300">
                                                <h3 className="text-white font-light text-sm tracking-wide">
                                                    {persona.persona_name}
                                                </h3>
                                                {persona.status === 'processing' && (
                                                    <div className="mt-2 flex items-center">
                                                        <Progress
                                                            value={persona.progress}
                                                            className="h-1 bg-zinc-800/50"
                                                        />
                                                        <p>{persona.progress}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </motion.div>
                    ) : (
                        /* Create New Persona */
                        <motion.div
                            key="create"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="max-w-2xl mx-auto"
                        >
                            <Card className="bg-gradient-to-r from-[#E5C88C] via-[#B08D57] to-[#A47A3E] backdrop-blur-2xl rounded-3xl overflow-hidden">
                                <CardContent className="p-8">

                                    {/* Name Input */}
                                    <div className="mb-8 bg-black">
                                        <Input
                                            type="text"
                                            placeholder="Persona Name"
                                            value={personaName}
                                            onChange={(e) => setPersonaName(e.target.value)}
                                            disabled={isSubmitting}
                                            className=" border-0 border-b border-zinc-700/50 rounded-none placeholder-zinc-500 text-xl font-light p-3 focus:border-[#B08D57] focus:ring-0 transition-colors duration-500"
                                        />
                                    </div>

                                    {/* Image Upload */}
                                    <div className="mb-8">
                                        <motion.label
                                            whileHover={{ scale: 1.005 }}
                                            className="relative block w-full aspect-[3/2] bg-gradient-to-br from-[#000000] via-[#111111] to-[#000000] border-[#B08D57] rounded-2xl cursor-pointer group overflow-hidden hover:border-[#B08D57]/50 transition-colors duration-500"
                                        >
                                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                <motion.div
                                                    whileHover={{ scale: 1.1 }}
                                                    className="w-15 h-15 rounded-full flex items-center justify-center mb-4"
                                                >
                                                    <Upload className="w-5 h-5 text-[#B08D57]" />
                                                </motion.div>
                                                <p className="text-white/70 font-light mb-1">Upload Images</p>
                                                <p className="text-zinc-500 text-sm font-light">10-20 high quality photos</p>
                                            </div>
                                            <Input
                                                type="file"
                                                multiple
                                                accept="image/png, image/jpg"
                                                className="hidden"
                                                onChange={handleImageUpload}
                                                disabled={isSubmitting}
                                            />
                                        </motion.label>

                                        {/* Image Preview Grid */}
                                        {images.length > 0 && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                className="grid grid-cols-8 gap-2 mt-6"
                                            >
                                                {images.map((img, index) => (
                                                    <motion.div
                                                        key={img.preview}
                                                        initial={{ opacity: 0, scale: 0.8 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        transition={{ delay: index * 0.05 }}
                                                        className="relative aspect-square group"
                                                    >
                                                        <img
                                                            src={img.preview}
                                                            alt={`${index}`}
                                                            className="w-full h-full object-cover rounded-lg"
                                                        />
                                                        {!isSubmitting && (
                                                            <motion.button
                                                                whileHover={{ scale: 1.1 }}
                                                                whileTap={{ scale: 0.9 }}
                                                                onClick={() => handleRemoveImage(index)}
                                                                className="absolute -top-1 -right-1 w-5 h-5 bg-zinc-800/90 backdrop-blur-xl rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                            >
                                                                <X className="w-3 h-3 text-white" />
                                                            </motion.button>
                                                        )}
                                                    </motion.div>
                                                ))}
                                            </motion.div>
                                        )}

                                        {/* Progress */}
                                        <div className="flex justify-between items-center mt-4">
                                            <span className="text-black text-sm font-light">
                                                {images.length} / {MAX_IMAGES}
                                            </span>
                                            <span className={`text-sm font-light ${images.length >= 10 ? 'text-[#B08D57]' : 'text-black'}`}>
                                                {images.length >= 10 ? 'Ready' : `${10 - images.length} more needed`}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Submit Button */}
                                    <motion.button
                                        onClick={handleSubmit}
                                        className="w-full bg-black p-3 rounded-2xl font-medium text-lg shadow-2xl  transform transition-all duration-300  group flex justify-center items-center cursor-pointer"
                                    >
                                        {isSubmitting ? (
                                            <div className="flex items-center justify-center gap-3">
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                <span>Training...</span>
                                            </div>
                                        ) : (
                                            <motion.div>
                                                <svg width="30" height="30" viewBox="0 0 400 400"  xmlns="http://www.w3.org/2000/svg">
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
                                    </svg>
                                            </motion.div>
                                        )} 250
                                    </motion.button>
                                </CardContent>
                            </Card>

                            {/* Training Status */}
                            <AnimatePresence>
                                {taskStatus && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        className="mt-6"
                                    >
                                        <Card className="bg-gradient-to-r from-[#E5C88C] via-[#B08D57] to-[#A47A3E] text-black p-3 rounded-2xl font-medium text-lg shadow-2xl shadow-amber-500/25 hover:shadow-amber-500/40 transform transition-all duration-300 border border-amber-400/20">
                                            <CardContent className="p-6">
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="flex items-center gap-3">
                                                        <Loader2 className="w-4 h-4 text-[#B08D57] animate-spin" />
                                                        <span className="text-white font-light">Training</span>
                                                    </div>
                                                    <span className="text-[#B08D57] text-sm font-light">
                                                        {Math.round(taskStatus.progress || 0)}%
                                                    </span>
                                                </div>
                                                <Progress
                                                    value={taskStatus.progress || 0}
                                                    className="h-1 bg-zinc-800/50"
                                                />
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}

export default Page