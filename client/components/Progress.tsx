"use client";

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from "framer-motion"

interface TaskStatus {
    progress?: number
}

interface ProgressProps {
    isProcessing?: boolean
    taskStatus?: TaskStatus | null
}

const Progress = ({ isProcessing = false, taskStatus = null }: ProgressProps) => {
        const [progress, setProgress] = useState(0)

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

     useEffect(() => {
        if (taskStatus?.progress !== undefined) {
            setProgress(taskStatus.progress)
        }
    }, [taskStatus?.progress])
  return (
    <div >
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
    </div>
  )
}

export default Progress
