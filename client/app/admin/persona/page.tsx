"use client"

import React, { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, X, CheckCircle, AlertCircle, Clock, Loader2, Crown, Sparkles, User, Calendar } from 'lucide-react'
import { toast } from 'sonner'
import { useUser } from '@clerk/nextjs'

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
    uploaded_urls: string | undefined
    progress: number
    _id: string
    persona_name: string
    training_status: string
    created_at: string
    model_s3_url?: string
    trigger_word?: string
}
interface UserData {
    _id: string
    email: string
    credits: number
    personas: Persona[]
}

const MAX_IMAGES = 20

const Page = () => {
    const [personaName, setPersonaName] = useState('')
    const [images, setImages] = useState<ImageFile[]>([])
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [taskId, setTaskId] = useState<string | null>(null)
    const [taskStatus, setTaskStatus] = useState<TaskStatus | null>(null)
    const { user } = useUser()
    const [userData, setUserData] = useState<UserData | null>(null)
    const [existingPersonas, setExistingPersonas] = useState<Persona[]>([])
    const [showExisting, setShowExisting] = useState(false)
    const email = user?.emailAddresses?.[0]?.emailAddress || ''

    useEffect(() => {
        const fetchUserData = async () => {
            if (!user?.emailAddresses?.[0]?.emailAddress) {
                toast.error("Failed to load user data")
                return
            }

            try {
                const res = await fetch(`https://cravio-ai.onrender.com/user/${email}`)
                const data = await res.json()

                if (res.ok) {
                    setUserData(data)
                    setExistingPersonas(data.personas || [])
                    if (data.personas && data.personas.length > 0) {
                        setShowExisting(true)
                    }
                } else {
                    console.error("Error from server:", data)
                    toast.error("Failed to load user data")
                }
            } catch (error) {
                console.error("Failed to fetch user data:", error)
            }
        }

        fetchUserData()
    }, [user])

    // Poll task status when we have a task ID
    useEffect(() => {
        if (!taskId) return;

        const pollStatus = async () => {
            try {
                const response = await fetch(`https://cravio-ai.onrender.com/api/task-status/${taskId}`);
                const status = await response.json();
                setTaskStatus(status);

                // Stop polling if task finished
                if (status.state === 'SUCCESS' || status.state === 'FAILURE') {
                    setIsSubmitting(false);
                    if (status.state === 'SUCCESS') {
                        toast.success('Persona training completed successfully!');
                        setTimeout(() => window.location.reload(), 2000);
                    } else {
                        toast.error(`Training failed: ${status.error}`);
                    }
                }
            } catch (error) {
                console.error('Error polling:', error);
                toast.error('Error checking task status');
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
            toast.error('Please enter a name and upload at least 10 images.')
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
                toast.success('Training started! You can track progress below.')
            } else {
                throw new Error(data.detail || 'Failed to start training')
            }

        } catch (error) {
            console.error('Error submitting persona:', error)
            toast.error('An error occurred while starting training.')
            setIsSubmitting(false)
        }
    }

    const getStatusIcon = (state: string) => {
        switch (state) {
            case 'SUCCESS':
                return <CheckCircle className="w-5 h-5 text-[#B08D57]" />
            case 'FAILURE':
                return <AlertCircle className="w-5 h-5 text-red-500" />
            case 'PROGRESS':
                return <Loader2 className="w-5 h-5 text-[#B08D57] animate-spin" />
            default:
                return <Clock className="w-5 h-5 text-[#B08D57]/70" />
        }
    }

    const getStatusColor = (state: string) => {
        switch (state) {
            case 'SUCCESS':
                return 'text-[#B08D57]'
            case 'FAILURE':
                return 'text-red-500'
            case 'PROGRESS':
                return 'text-[#B08D57]'
            default:
                return 'text-[#B08D57]/70'
        }
    }

    const getPersonaStatusBadge = (status: string) => {
        switch (status) {
            case 'completed':
                return <Badge className="bg-[#B08D57]/20 text-[#B08D57] border-[#B08D57]/30">Completed</Badge>
            case 'training_in_progress':
                return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Training</Badge>
            case 'failed':
                return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Failed</Badge>
            default:
                return <Badge className="bg-[#B08D57]/20 text-[#B08D57] border-[#B08D57]/30">{status}</Badge>
        }
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    return (
        <div className="min-h-screen">
            <div className="relative z-10 max-w-6xl mx-auto p-6 space-y-8">

                {/* Existing Personas */}
                <AnimatePresence>
                    {showExisting && existingPersonas.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.5 }}
                            className="space-y-4"
                        >
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-bold text-[#B08D57]">Your Personas</h2>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowExisting(!showExisting)}
                                    className="text-[#B08D57] hover:bg-[#B08D57]/10"
                                >
                                    {showExisting ? 'Hide' : 'Show'} ({existingPersonas.length})
                                </Button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {existingPersonas.map((persona, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                    >
                                        <Card className=" border-[#B08D57]/20 backdrop-blur-sm hover:border-[#B08D57]/40 transition-all duration-300 group">
                                            <CardHeader className="pb-3">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <img
                                                            src={persona.uploaded_urls}
                                                            alt={persona.persona_name}
                                                            className="w-10 h-10 rounded-full object-cover"
                                                        />
                                                        <CardTitle className="text-white truncate">
                                                            {persona.persona_name}
                                                        </CardTitle>
                                                    </div>
                                                    {getPersonaStatusBadge(persona.training_status)}
                                                </div>
                                            </CardHeader>
                                            <CardContent className="pt-0">
                                                <div className="space-y-2 text-sm">
                                                    {/* show progress only when  */}
                                                    <div className="flex items-center gap-2">
                                                        <Progress
                                                            value={persona.progress || 100}
                                                            className="w-full h-3 bg-[#B08D57] border border-[#B08D57]/20"
                                                        />
                                                        <span className="text-xs text-gray-400">
                                                            {Math.round(persona.progress || 100)}%
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-gray-400">
                                                        <Calendar className="w-4 h-4" />
                                                        <span>{formatDate(persona.created_at)}</span>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Main Training Form */}
                <motion.div
                    className="space-y-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.8 }}
                >
                    <Card className=" border-[#B08D57]/20 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle className="text-[#B08D57] flex items-center gap-2">
                                <Sparkles className="w-5 h-5" />
                                Create New Persona
                                {userData && userData.credits >= 200 && (
                                    <span className="ml-2 text-xs text-green-400">(Sufficient credits)</span>
                                )}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-300">Persona Name</label>
                                <Input
                                    type="text"
                                    placeholder="Enter a unique name for your AI persona"
                                    value={personaName}
                                    onChange={(e) => setPersonaName(e.target.value)}
                                    disabled={isSubmitting}
                                    className="bg-gray-800/50 border-[#B08D57]/30 text-white placeholder-gray-400 focus:border-[#B08D57] focus:ring-[#B08D57]/20"
                                />
                            </div>

                            <div className="space-y-4">
                                <label className="text-sm font-medium text-gray-300">Training Images</label>
                                <motion.label
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="relative w-full border-2 border-dashed border-[#B08D57]/30 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-[#B08D57]/50 transition-all duration-300 bg-gradient-to-br from-[#B08D57]/5 to-transparent group"
                                >
                                    <div className="absolute inset-0 bg-[#B08D57]/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                    <Upload className="w-8 h-8 mb-3 text-[#B08D57] group-hover:scale-110 transition-transform duration-300" />
                                    <span className="text-lg font-medium text-[#B08D57] mb-1">Upload 10–20 Images</span>
                                    <span className="text-sm text-gray-400">High-quality images work best</span>
                                    <Input
                                        type="file"
                                        multiple
                                        accept="image/png, image/jpg"
                                        className="hidden"
                                        onChange={handleImageUpload}
                                        disabled={isSubmitting}
                                    />
                                </motion.label>

                                {images.length > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3"
                                    >
                                        {images.map((img, index) => (
                                            <motion.div
                                                key={img.preview}
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: index * 0.05 }}
                                            >
                                                <Card className="relative group overflow-hidden bg-gray-800/50 border-[#B08D57]/20">
                                                    <CardContent className="p-0">
                                                        <img
                                                            src={img.preview}
                                                            alt={`upload-${index}`}
                                                            className="w-full h-20 object-cover transition-transform duration-300 group-hover:scale-110"
                                                        />
                                                        {!isSubmitting && (
                                                            <motion.button
                                                                whileHover={{ scale: 1.1 }}
                                                                whileTap={{ scale: 0.9 }}
                                                                onClick={() => handleRemoveImage(index)}
                                                                className="absolute top-1 right-1 bg-red-500/80 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                                            >
                                                                <X size={12} />
                                                            </motion.button>
                                                        )}
                                                    </CardContent>
                                                </Card>
                                            </motion.div>
                                        ))}
                                    </motion.div>
                                )}

                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-400">
                                        {images.length} / {MAX_IMAGES} images uploaded
                                    </span>
                                    <span className="text-[#B08D57]">
                                        {images.length >= 10 ? '✓ Ready to train' : `${10 - images.length} more needed`}
                                    </span>
                                </div>
                            </div>

                            <motion.div
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <Button
                                    onClick={handleSubmit}
                                    disabled={images.length < 10 || !personaName || isSubmitting}
                                    className="w-full bg-[#B08D57] hover:bg-[#B08D57]/90 text-white font-medium py-6 text-lg disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-[#B08D57]/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                                            Initializing Training...
                                        </>
                                    ) : (
                                        <>
                                            <Crown className="w-5 h-5 mr-3" />
                                            Train Persona (200 Credits)
                                        </>
                                    )}
                                </Button>
                            </motion.div>
                        </CardContent>
                    </Card>

                    {/* Premium Training Status */}
                    <AnimatePresence>
                        {taskStatus && (
                            <motion.div
                                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                                className="relative"
                            >
                                <Card className="bg-gradient-to-br from-gray-900/80 to-gray-900/60 border-[#B08D57]/30 backdrop-blur-sm overflow-hidden">
                                    {/* Animated Background */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-[#B08D57]/5 via-transparent to-[#B08D57]/5 animate-pulse"></div>

                                    <CardHeader className="relative z-10">
                                        <CardTitle className="flex items-center gap-3">
                                            <motion.div
                                                animate={{ rotate: taskStatus.state === 'PROGRESS' ? 360 : 0 }}
                                                transition={{ duration: 2, repeat: taskStatus.state === 'PROGRESS' ? Infinity : 0, ease: "linear" }}
                                            >
                                                {getStatusIcon(taskStatus.state)}
                                            </motion.div>
                                            <span className={`text-xl font-bold ${getStatusColor(taskStatus.state)}`}>
                                                Premium Training Status
                                            </span>
                                            <div className="flex-1"></div>
                                            {taskStatus.state === 'PROGRESS' && (
                                                <motion.div
                                                    animate={{ opacity: [0.5, 1, 0.5] }}
                                                    transition={{ duration: 2, repeat: Infinity }}
                                                    className="flex items-center gap-2 text-[#B08D57]"
                                                >
                                                    <Sparkles className="w-4 h-4" />
                                                    <span className="text-sm">Processing</span>
                                                </motion.div>
                                            )}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="relative z-10 space-y-6">
                                        {/* Progress Bar */}
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm font-medium text-gray-300">Progress</span>
                                                <span className="text-sm font-bold text-[#B08D57]">
                                                    {Math.round(taskStatus.progress || 0)}%
                                                </span>
                                            </div>
                                            <div className="relative">
                                                <Progress
                                                    value={taskStatus.progress || 0}
                                                    className="h-3 bg-gray-800 border border-[#B08D57]/20"
                                                />
                                                <motion.div
                                                    className="absolute inset-0 bg-gradient-to-r from-transparent via-[#B08D57]/30 to-transparent h-full rounded-full"
                                                    animate={{ x: [-100, 200] }}
                                                    transition={{
                                                        duration: 2,
                                                        repeat: taskStatus.state === 'PROGRESS' ? Infinity : 0,
                                                        ease: "linear"
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        {/* Status Details */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <div className="text-sm text-gray-400">Current Status</div>
                                                <div className="text-lg font-medium text-white">
                                                    {taskStatus.status || taskStatus.state}
                                                </div>
                                            </div>

                                            {taskStatus.current && taskStatus.total && (
                                                <div className="space-y-2">
                                                    <div className="text-sm text-gray-400">Training Step</div>
                                                    <div className="text-lg font-medium text-[#B08D57]">
                                                        {taskStatus.current} of {taskStatus.total}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Error Display */}
                                        {taskStatus.error && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                className="bg-red-500/10 border border-red-500/30 rounded-lg p-4"
                                            >
                                                <div className="flex items-center gap-2 text-red-400 mb-2">
                                                    <AlertCircle className="w-4 h-4" />
                                                    <span className="font-medium">Training Error</span>
                                                </div>
                                                <div className="text-sm text-red-300">{taskStatus.error}</div>
                                            </motion.div>
                                        )}

                                        {/* Success Display */}
                                        {taskStatus.result && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                className="bg-[#B08D57]/10 border border-[#B08D57]/30 rounded-lg p-4"
                                            >
                                                <div className="flex items-center gap-2 text-[#B08D57] mb-2">
                                                    <CheckCircle className="w-4 h-4" />
                                                    <span className="font-medium">Training Complete!</span>
                                                </div>
                                                <div className="text-sm text-gray-300">{taskStatus.result.message}</div>
                                            </motion.div>
                                        )}

                                        {/* Task ID */}
                                        {taskId && (
                                            <div className="text-xs text-gray-500 font-mono bg-gray-800/50 p-2 rounded border border-gray-700">
                                                <span className="text-gray-400">Task ID:</span> {taskId}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>
        </div>
    )
}

export default Page