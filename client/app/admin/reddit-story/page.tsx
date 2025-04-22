'use client'

import React, { useState } from 'react'
import RedditScript from '@/components/RedditScript' // Ensure the path is correct
import RedditFont from '@/components/RedditFont' // Ensure the path is correct
import RedditVideo from '@/components/RedditVideo' // Ensure the path is correct
import RedditVoice from '@/components/RedditVoice' // Ensure the path is correct
import LoadingAndDownload from '@/components/LoadingAndDownload'
import { useUser } from "@clerk/nextjs"
type TaskResult = {
    url: string
  }
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
    const [progressMessage, setProgressMessage] = useState('')

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
            const formData = new FormData();

            // Append form fields
            formData.append('username', username);
            formData.append('title', title);
            formData.append('script', script);
            formData.append('voice', voice);
            formData.append('video', video);
            formData.append('font', font);
            formData.append('user_email', userEmail);

            // Handle avatar (File or URL)
            if (avatar instanceof File) {
                formData.append('avatar', avatar);
            } else if (typeof avatar === 'string' && avatar) {
                try {
                    const response = await fetch(avatar);
                    const blob = await response.blob();
                    const file = new File([blob], 'avatar.jpg', { type: blob.type });
                    formData.append('avatar', file);
                } catch {
                    formData.append('avatar', avatar)
                  }          
            }

            // Make the POST request
            const response = await fetch('https://cravio-ai.onrender.com/create-reddit-post', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error(`Server responded with ${response.status}: ${await response.text()}`);
            }

            const { task_id } = await response.json();
            console.log('Task ID:', task_id);

            // Polling function to check task status
            const pollTaskStatus = async (taskId: string): Promise<TaskResult> => {
                return new Promise((resolve, reject) => {
                  const interval = setInterval(async () => {
                    try {
                      const res = await fetch(
                        `https://cravio-ai.onrender.com/task-status/${taskId}`
                      );
                      if (!res.ok) {
                        clearInterval(interval);
                        return reject(new Error(`Error fetching status: ${res.status}`));
                      }
              
                      const statusData = await res.json();
                      console.log('Task status:', statusData);
              
                      // update progress if in-progress
                      if (statusData.status === 'progress') {
                        setProgressMessage(statusData.percent_complete);
                      }
              
                      // completed
                      if (statusData.status === 'success') {
                        clearInterval(interval);
                        return resolve(statusData.result);
                      }
              
                      // failed
                      if (statusData.status === 'failure' || statusData.status === 'failed') {
                        clearInterval(interval);
                        return reject(
                          new Error(statusData.message || 'Task failed')
                        );
                      }
                      // else: still 'pending'—do nothing, keep polling
              
                    } catch (err) {
                      clearInterval(interval);
                      reject(err);
                    }
                  }, 5000); // poll every 5s
                });
              };
              
            
            const result = await pollTaskStatus(task_id);
            console.log('Task result:', result);
            setFileUrl(result?.url); // Assuming the result contains the file URL

            setLoading(false);
        } catch (err) {
            console.error('Error during generation:', err);
            setLoading(false);
            setFileUrl(null); // Reset file URL on error
        }
    }

    // Show LoadingAndDownload only when loading or when fileUrl is available
    const showLoadingAndDownload = loading || fileUrl !== null
    const showVoiceForm = currentStep === 4 && !showLoadingAndDownload;

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

                {showVoiceForm && (
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
                        {loading && progressMessage && (
                            <p className="text-center mt-4 text-xl">{progressMessage} %</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

export default Page;
