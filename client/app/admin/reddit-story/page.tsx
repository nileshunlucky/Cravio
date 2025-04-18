'use client'

import React, { useState } from 'react'
import RedditScript from '@/components/RedditScript' // Ensure the path is correct
import RedditFont from '@/components/RedditFont' // Ensure the path is correct
import RedditVideo from '@/components/RedditVideo' // Ensure the path is correct
import RedditVoice from '@/components/RedditVoice' // Ensure the path is correct
import LoadingAndDownload from '@/components/LoadingAndDownload'
import {useUser} from "@clerk/nextjs"

const Page = () => {
    const { user } = useUser()
    const userEmail = user?.emailAddresses[0]?.emailAddress || '' // Get the user's email address
    const [font, setFont] = useState('')
    const [script, setScript] = useState('')
    const [avatar, setAvatar] = useState<string | File>('') 
    const [title, setTitle] = useState('')
    const [username, setUsername] = useState('')
    const [video, setVideo] = useState('')
    const [voice, setVoice] = useState('')
    const [loading, setLoading] = useState(false)
    const [fileUrl, setFileUrl] = useState<string | null>(null)
    

    // State for tracking the current step
    const [currentStep, setCurrentStep] = useState(1)

    const handleScriptChange = (script: string) => {
        setScript(script)
    }

    const handleSetFields = (fields: { title: string; username: string; avatar: string }) => {
        setTitle(fields.title)
        setUsername(fields.username)
        setAvatar(fields.avatar)
    }

    const handleFontChange = (font: string) => {
        setFont(font)
    }

    const handleVideoChange = (video: string) => {
        setVideo(video)
    }

    const handleVoiceChange = (voice: string) => {
        setVoice(voice)
    }

    const handleNextStep = () => {
        setCurrentStep((prevStep) => Math.min(prevStep + 1, 4)) // Ensure the step doesn't go beyond 4
    }

    const handleBackStep = () => {
        setCurrentStep((prevStep) => Math.max(prevStep - 1, 1)) // Ensure the step doesn't go below 1
    }

// Modify the handleGenerate function in your Page component:

const handleGenerate = async () => {
    setLoading(true);
    
    try {
        // Create FormData object to handle the file upload and other form fields
        const formData = new FormData();
        
        // Add all required form fields
        formData.append('username', username);
        formData.append('title', title);
        formData.append('script', script);
        formData.append('voice', voice);
        formData.append('video', video);
        formData.append('font', font);
        formData.append('user_email', userEmail); // You'll need to add a state for this
        
        // If avatar is a file object (from file input)
        if (avatar instanceof File) {
            formData.append('avatar', avatar);
        } 
        // If avatar is a string URL or base64, you may need to fetch and convert it to a file
        if (typeof avatar === 'string' && avatar) {
            try {
                const response = await fetch(avatar);
                const blob = await response.blob();
                const file = new File([blob], 'avatar.jpg', { type: blob.type });
                formData.append('avatar', file);
            } catch (error) {
                console.error('Error processing avatar URL:', error);
                // Fallback: Send as string if conversion fails
                formData.append('avatar', avatar);
            }
        }
        
        // Send the API request
        const response = await fetch('https://cravio-ai.onrender.com/create-reddit-post', {
            method: 'POST',
            body: formData,
        });
        
        if (!response.ok) {
            throw new Error(`Server responded with ${response.status}: ${await response.text()}`);
        }
        
        const data = await response.json();
        console.log('Success:', data);
        
        // Set the file URL from the response
        setFileUrl(data.fileUrl || data.videoUrl);
        
    } catch (error) {
        console.error('Error generating video:', error);
        alert('Failed to generate video. Please try again.');
    } finally {
        setLoading(false);
    }
};

    // Show LoadingAndDownload only when loading or when fileUrl is available
    const showLoadingAndDownload = loading || fileUrl !== null

    return (
        <div className="container mx-auto py-8 md:w-[70%] w-full">
            {/* Step indicator */}
            <div className="md:mb-8">
                <div className="flex items-center w-full max-w-md mx-auto px-4 md:px-0 mb-6">
                    {[1, 2, 3, 4].map((step, index) => (
                        <React.Fragment key={step}>
                            {/* Step circle */}
                            <div
                                className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10
          ${currentStep === step
                                        ? 'bg-blue-500 text-white'
                                        : currentStep > step
                                            ? 'bg-black text-white'
                                            : 'bg-gray-200 text-gray-600'}`}
                            >
                                <span className="text-xs sm:text-sm">{step}</span>
                            </div>

                            {/* Connector line (not on the last item) */}
                            {index < 3 && (
                                <div className="flex-1 h-1 mx-1 sm:mx-2">
                                    <div
                                        className={`h-full ${currentStep > step ? 'bg-black' : 'bg-gray-200'}`}
                                    ></div>
                                </div>
                            )}
                        </React.Fragment>
                    ))}
                </div>
            </div>

            {/* Content area */}
            <div className="relative p-5">
                {/* Conditional rendering based on currentStep */}
                {currentStep === 1 && (
                    <RedditScript
                        value={script}
                        onChange={handleScriptChange}
                        onNext={handleNextStep}
                        onSetFields={handleSetFields}
                    />
                )}

                {currentStep === 2 && (
                    <RedditFont
                        value={font}
                        onChange={handleFontChange}
                        onNext={handleNextStep}
                        onBack={handleBackStep}
                    />
                )}

                {currentStep === 3 && (
                    <RedditVideo
                        value={video}
                        onChange={handleVideoChange}
                        onNext={handleNextStep}
                        onBack={handleBackStep}
                    />
                )}

                {currentStep === 4 && (
                    <RedditVoice
                        value={voice}
                        onChange={handleVoiceChange}
                        onSubmit={handleGenerate}
                        onBack={handleBackStep}
                        loading={loading}
                    />
                )}

                {/* Loading and Download component */}
                {showLoadingAndDownload && (
                    <div className={``}>
                        <LoadingAndDownload fileUrl={fileUrl} isLoading={loading} />
                    </div>
                )}
            </div>
        </div>
    )
}

export default Page;