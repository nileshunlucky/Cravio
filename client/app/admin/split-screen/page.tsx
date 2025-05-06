"use client"

import { useRouter } from 'next/navigation';
import React, { useState } from 'react'
import RedditFont from '@/components/RedditFont'
import RedditVideo from '@/components/RedditVideo'
import UserVideo from '@/components/UserVideo'
import { useUser } from "@clerk/nextjs"
import { toast } from "sonner"
import { Button } from '@/components/ui/button'
import LoadingAndDownload from '@/components/LoadingAndDownload'

const Page = () => {
    const router = useRouter();
    const { user } = useUser()
    const userEmail = user?.emailAddresses[0]?.emailAddress || ''
    
    const [font, setFont] = useState('')
    const [video, setVideo] = useState('')
    const [userVideo, setUserVideo] = useState<string | File>('')
    const [loading, setLoading] = useState(false)
    const [fileUrl, setFileUrl] = useState<string | null>(null)
    const [progress, setProgress] = useState('')
    
    // For steps
    const [currentStep, setCurrentStep] = useState(1)
    
    const handleFontChange = (font: string) => setFont(font)
    const handleVideoChange = (video: string) => setVideo(video)
    const handleUserVideoChange = (video: string | File) => setUserVideo(video)
    
    const handleNextStep = () => setCurrentStep(prevStep => Math.min(prevStep + 1, 3))
    const handleBackStep = () => setCurrentStep(prevStep => Math.max(prevStep - 1, 1))
    
    const handleGenerate = async () => {
        const missingFields = []

        if (!userVideo) missingFields.push('User Video')
        if (!video) missingFields.push('Gameplay Video')
        if (!font) missingFields.push('Font')
        if (!userEmail) missingFields.push('Email')
      
        if (missingFields.length > 0) {
          toast.error(`Missing: ${missingFields.join(', ')}`)
          return
        }

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('video', video)
            formData.append('font', font)
            formData.append('user_email', userEmail)

            if (userVideo instanceof File) {
                formData.append('user_video', userVideo)
            } else if (typeof userVideo === 'string' && userVideo) {
                try {
                    const response = await fetch(userVideo)
                    const blob = await response.blob()
                    const file = new File([blob], 'user_video.mp4', { type: blob.type })
                    formData.append('user_video', file)
                } catch {
                    formData.append('user_video', userVideo)
                }
            }

            const response = await fetch('https://cravio-ai.onrender.com/create-split-screen', {
                method: 'POST',
                body: formData,
            })

            if (!response.ok) {
                // Handle if not enough credits
                const errorData = await response.json();
                if (errorData.detail === 'Not enough credits') {
                  router.push('/admin/plan');
                  return;
                }
          
                throw new Error(`Server responded with ${response.status}: ${await response.text()}`);
            }

            const { task_id } = await response.json()
            console.log('Task ID:', task_id)

            const pollTaskStatus = async (taskId: string): Promise<{ url: string }> => {
                return new Promise((resolve, reject) => {
                    const interval = setInterval(async () => {
                        try {
                            const res = await fetch(`https://cravio-ai.onrender.com/task-status/${taskId}`)
                            if (!res.ok) {
                                clearInterval(interval)
                                return reject(new Error(`Error fetching status: ${res.status}`))
                            }

                            const statusData = await res.json()
                            console.log('Task status:', statusData)

                            if (statusData.status === 'progress') {
                                setProgress(statusData.percent_complete)
                            }

                            if (statusData.status === 'success') {
                                clearInterval(interval)
                                return resolve(statusData.result)
                            }

                            if (statusData.status === 'failure' || statusData.status === 'failed') {
                                clearInterval(interval)
                                return reject(new Error(statusData.message || 'Task failed'))
                            }
                        } catch (err) {
                            clearInterval(interval)
                            reject(err)
                        }
                    }, 5000)
                })
            }

            const result = await pollTaskStatus(task_id) as { url: string }
            console.log('Task result:', result)
            setFileUrl(result?.url)
            setLoading(false)
        } catch (err) {
            console.error('Error during generation:', err)
            setLoading(false)
            setFileUrl(null)
        }
    }

    const showLoadingAndDownload = loading || fileUrl !== null

    if (showLoadingAndDownload) {
        return (
            <div className="container mx-auto py-8 max-w-3xl">
                <div className="relative p-5">
                    <LoadingAndDownload fileUrl={fileUrl} isLoading={loading} progress={progress} />
                </div>
            </div>
        )
    }

    return (
        <div className="container mx-auto py-8 max-w-4xl flex flex-col items-center">
            <h1 className="text-2xl font-bold text-center mb-8">Split Screen Creator</h1>
            
            {/* Step indicator */}
            <div className="w-full mb-10">
                <div className="flex items-center max-w-md mx-auto px-4 md:px-0">
                    {[1, 2, 3].map((step, index) => (
                        <React.Fragment key={step}>
                            {/* Step circle */}
                            <div
                                className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10
                                    ${currentStep === step ? 'bg-blue-500' :
                                    currentStep > step ? '' : ''}`}
                            >
                                <span className="text-xs sm:text-sm">{step}</span>
                            </div>

                            {/* Connector line */}
                            {index < 2 && (
                                <div className="flex-1 h-1 mx-1 sm:mx-2">
                                    <div className={`h-full ${currentStep > step ? 'bg-white' : 'bg-gray-200'}`}></div>
                                </div>
                            )}
                        </React.Fragment>
                    ))}
                </div>
                
                {/* Step labels */}
                <div className="flex justify-between max-w-md mx-auto px-2 mt-2 text-xs">
                    <span className="text-center w-16">User Video</span>
                    <span className="text-center w-16">Font</span>
                    <span className="text-center w-16">Video Style</span>
                </div>
            </div>
            
            {/* Component Container - Centered */}
            <div className="w-full max-w-3xl mx-auto">
                <div className="rounded-lg shadow-sm p-3">
                    {currentStep === 1 && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-semibold text-center">Upload Your Video</h2>
                            <UserVideo value={userVideo} onChange={handleUserVideoChange} />
                            <div className="flex justify-center mt-8">
                                <Button 
                                    onClick={handleNextStep}
                                    className="px-8 py-2"
                                    disabled={!userVideo}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}
                    
                    {currentStep === 2 && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-semibold text-center">Select Font Color</h2>
                            <RedditFont 
                                value={font} 
                                onChange={handleFontChange} 
                                onNext={handleNextStep} 
                                onBack={handleBackStep} 
                            />
                        </div>
                    )}
                    
                    {currentStep === 3 && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-semibold text-center">Choose Video Style</h2>
                            <RedditVideo 
                                value={video} 
                                onChange={handleVideoChange} 
                                onNext={handleGenerate} 
                                onBack={handleBackStep} 
                            />
                        </div>
                    )}
                </div>
            </div>
            
            
        </div>
    )
}

export default Page