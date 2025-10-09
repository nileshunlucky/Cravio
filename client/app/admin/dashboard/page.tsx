"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowUp, ArrowDownToLine , Plus} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import Starter from "@/components/Starter"

interface TaskResult {
    fal_url: string;
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

const Page = () => {
  const router = useRouter();
  const { user } = useUser();
  const email = user?.emailAddresses?.[0]?.emailAddress || '';
  const [persona, setPersona] = useState("")
  const [loading, setLoading] = useState(false)
    const [progress, setProgress] = useState(0)
   const [taskStatus, setTaskStatus] = useState<TaskStatus | null>(null)
    const [prompt, setPrompt] = useState("");
  const [isTall, setIsTall] = useState(false);
    const [generatedContentUrl, setGeneratedContentUrl] = useState("")
    const [taskId, setTaskId] = useState<string | null>(null)

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const MAX_ROWS = 8; 
  const LINE_HEIGHT = 24; 

  // Fetch user data and personas on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      if (!email) {
        return;
      }

      try {
        const res = await fetch(`https://cravio-ai.onrender.com/user/${email}`);
        const data = await res.json();

        if (res.ok) {
          const personasData = data.personas;
          if (personasData && personasData.length > 0) {
            // Use the first persona's video URL
            setPersona(personasData[0].video_url || "");
          }
        } else {
          console.error("Error from server:", data);
          toast.error("Failed to load user data", {
            style: {
              background: "linear-gradient(to bottom right, #5C0A14, #BC2120, #9B111E)",
              color: "white",
              border: "0px"
            }
          });
        }
      } catch (error) {
        console.error("Failed to fetch user data:", error);
        toast.error("Failed to load data", {
          style: {
            background: "linear-gradient(to bottom right, #5C0A14, #BC2120, #9B111E)",
            color: "white",
            border: "0px"
          }
        });
      }
    };

    fetchUserData();
  }, [email]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"; 
      const maxHeight = MAX_ROWS * LINE_HEIGHT;
      const newHeight = Math.min(textareaRef.current.scrollHeight, maxHeight);
      textareaRef.current.style.height = `${newHeight}px`;

      setIsTall(newHeight > LINE_HEIGHT * 2);
    }
  }, [prompt]);

  useEffect(() => {
        if (loading) {
            setProgress(0)
            const timer = setInterval(() => {
                setProgress(prev => {
                    if (prev >= 100) {
                        clearInterval(timer)
                        return 100
                    }
                    return prev + 0.5
                })
            }, 100)

            return () => clearInterval(timer)
        }
    }, [loading])

     useEffect(() => {
        if (taskStatus) {
            if (taskStatus.progress !== undefined) {
                setProgress(taskStatus.progress)
            }
        }
    }, [taskStatus])

  const handleSend = async () => {
        if (!prompt.trim()) {
            toast.error("Please describe your idea or topic", {
                style: {
                    background: "linear-gradient(to bottom right, #5C0A14, #BC2120, #9B111E)",
                    color: "white",
                    border: "0px"
                }
            })
            return;
        }
        setProgress(0)
        setLoading(true)
        setGeneratedContentUrl("") // Reset previous generated content
        setTaskStatus(null)
        try {
            const formData = new FormData()
            formData.append('email', email)
            formData.append('prompt', prompt)
            formData.append('persona', persona)

            const res = await fetch('https://cravio-ai.onrender.com/api/content', {
                method: 'POST',
                body: formData,
            })

            const data = await res.json()

            if (res.ok) {
                setTaskId(data.task_id)
                toast.success('Content generation started!', {
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
                toast.error("Failed to generate Content",data, {
                    style: {
                        background: "linear-gradient(to bottom right, #5C0A14, #BC2120, #9B111E)",
                        color: "white",
                        border: "0px"
                    }
                })
            }

        } catch (error) {
            toast.error("Failed to generate Content", {
                style: {
                    background: "linear-gradient(to bottom right, #5C0A14, #BC2120, #9B111E)",
                    color: "white",
                    border: "0px"
                }
            })
            console.error("Error:", error)
        } finally {
            setLoading(false)
            setPrompt("");
        }
    };

      useEffect(() => {
        if (!taskId) return;

        const pollStatus = async () => {
            try {
                const response = await fetch(`https://cravio-ai.onrender.com/api/task-status/${taskId}`);
                const status = await response.json();
                setTaskStatus(status);

                if (status.state === 'SUCCESS' || status.state === 'FAILURE') {
                    setLoading(false);
                    if (status.state === 'SUCCESS') {
                        setGeneratedContentUrl(status.result.fal_url);
                        toast.success('Training completed', {
                            style: {
                                background: "linear-gradient(to bottom right, #4e3c20, #B08D57, #4e3c20)",
                                color: "black",
                                border: "0px"
                            }
                        });
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


   const handleCreateNew = () => {
        setTaskId(null);
        setTaskStatus(null);
        setPrompt('');
        setGeneratedContentUrl("");

    };


    const downloadContent = async (generatedContentUrl: string) => {
        try {
            // Use your FastAPI backend URL with the video proxy endpoint
            const proxyUrl = `https://cravio-ai.onrender.com/proxy-video?url=${encodeURIComponent(generatedContentUrl)}`
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
            window.open(generatedContentUrl)
        }
    }

  return (
    <div>
      {loading ? (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex items-center justify-center p-5 h-screen"
          >
            {/* 9:16 aspect ratio container - like a phone screen */}
            <div
              className="relative bg-zinc-900 rounded-xl overflow-hidden aspect-[9/16] w-full max-w-xs"
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
      ) : generatedContentUrl ? (
        <motion.div
  initial={{ opacity: 0, scale: 0.98 }}
  animate={{ opacity: 1, scale: 1 }}
  transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
  className="w-full max-w-md mx-auto px-4 py-6"
>
  {/* Header */}
  <motion.div
    initial={{ y: -20, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    transition={{ duration: 0.5, delay: 0.2 }}
    className="text-center mb-4"
  >
    <h1 className="text-3xl sm:text-4xl font-light text-white tracking-tight">
      Your Masterpiece
    </h1>
  </motion.div>

  {/* Video Container */}
  <motion.div
    initial={{ y: 30, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    transition={{ duration: 0.6, delay: 0.3 }}
    className="relative w-full aspect-[9/16] rounded-3xl overflow-hidden border border-white/10 shadow-xl backdrop-blur-sm"
  >
    {/* Video */}
    <motion.video
      initial={{ opacity: 0, scale: 1.03 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, delay: 0.4 }}
      src={generatedContentUrl}
      autoPlay
      loop
      muted
      playsInline
      className="w-full h-full object-cover"
    />

    {/* Gradient overlay for contrast */}
    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

    {/* Action bar inside bottom */}
    <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-5 pb-4">
      <button
        onClick={() => downloadContent(generatedContentUrl)}
        className="p-3 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 backdrop-blur-lg transition"
      >
        <ArrowDownToLine className="w-6 h-6 text-white" />
      </button>

      <button
        onClick={handleCreateNew}
        className="p-3 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 backdrop-blur-lg transition"
      >
        <Plus className="w-6 h-6 text-white" />
      </button>
    </div>
  </motion.div>
</motion.div>


      ) : !persona ? (
        <Starter/>
      ) : (
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="fixed bottom-4 left-0 right-0 flex justify-center px-4 sm:px-0"
        >
          <div
            className={`relative flex bg-zinc-900 shadow-lg px-4 w-full max-w-[95%] md:max-w-3xl transition-all duration-200 ${
              isTall ? "rounded-2xl" : "rounded-full"
            }`}
          >
            <textarea
              ref={textareaRef}
              placeholder="Describe your idea..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="flex-1 resize-none border-none focus:ring-0 bg-transparent placeholder:text-zinc-500 py-3 md:py-4 text-base sm:text-lg md:text-xl focus:outline-none  leading-[24px]"
              rows={1}
            />
            <Button
              onClick={handleSend}
              disabled={!prompt.trim()} 
              className={`absolute right-2 md:right-3 bg-white p-3 md:p-4 rounded-full hover:opacity-90 transition-all duration-200 ${
                isTall ? "bottom-2" : "top-1/2 -translate-y-1/2"
              }`}
            >
              <ArrowUp className="w-5 h-5 md:w-6 md:h-6 text-black" />
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  )
}

export default Page
