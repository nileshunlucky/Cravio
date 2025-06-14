'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import {
  Link,
  //  CloudUpload, 
  Loader2, AlertCircle, Info
} from 'lucide-react';
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useUser } from '@clerk/nextjs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import { Card } from "@/components/ui/card"

// Define TypeScript interfaces
interface TaskResult {
  video_url: string;
  thumbnail_url: string;
  credit_usage?: number;
}

interface TaskStatus {
  status: 'pending' | 'progress' | 'success' | 'failure' | 'failed';
  percent_complete?: number;
  message?: string;
  result?: TaskResult;
}

// Define a utility function to conditionally join classNames
const cn = (...classes: (string | undefined | null | false)[]) => {
  return classes.filter(Boolean).join(' ');
};

export default function OpusClip() {
  const { user } = useUser();
  const email = user?.primaryEmailAddress?.emailAddress
  const [youtubeLink, setYoutubeLink] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [creditUsage, setCreditUsage] = useState<number | null>(null);
  const [isValidYoutubeLink, setIsValidYoutubeLink] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [videoProcessed, setVideoProcessed] = useState<boolean>(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [taskProgress, setTaskProgress] = useState<number>(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const processingRef = useRef<boolean>(false);
  const initialRenderRef = useRef<boolean>(true);
  const [showMobileTip, setShowMobileTip] = useState(false)
  const [duration, setDuration] = useState<string>('30 seconds');
  const [aspectRatio, setAspectRatio] = useState<string>('9:16');
  const [includeMoments, setIncludeMoments] = useState<string>('valuable engaging moments');
  const [subtitleColor, setSubtitleColor] = useState<string>('yellow');

  const toggleMobileTip = () => {
    // Only show tooltip on small screens
    if (window.innerWidth < 768) {
      setShowMobileTip(!showMobileTip)
    }
  }

  // Improved YouTube URL validation function
  const validateYoutubeUrl = (url: string): boolean => {
    if (!url) return false;

    // Sanitize URL: Remove unnecessary query params (like `si`)
    const cleanUrl = sanitizeYoutubeUrl(url);

    // Regular expressions for different YouTube URL formats
    const regexps = [
      /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/,
      /^(https?:\/\/)?(www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11}).*$/,
      /^(https?:\/\/)?(www\.)?youtu\.be\/([a-zA-Z0-9_-]{11}).*$/,
    ];

    return regexps.some(regex => regex.test(cleanUrl));
  };

  // Improved sanitization function
  const sanitizeYoutubeUrl = (url: string): string => {
    try {
      // First handle the case where the URL might not be valid
      if (!url.startsWith('http')) {
        url = 'https://' + url;
      }

      const parsed = new URL(url);

      // Remove tracking parameters
      parsed.searchParams.delete('si');

      // Other parameters that might cause issues
      parsed.searchParams.delete('list');
      parsed.searchParams.delete('index');
      parsed.searchParams.delete('t'); // Timestamp parameter 

      // Keep only the v parameter for youtube.com
      if (parsed.hostname.includes('youtube.com')) {
        const videoId = parsed.searchParams.get('v');
        if (videoId) {
          // Create a clean URL with just the video ID
          parsed.search = '?v=' + videoId;
        }
      } else if (parsed.hostname.includes('youtu.be')) {
        // For youtu.be links, keep only the path which contains the ID
        const videoId = parsed.pathname.split('/')[1];
        if (videoId) {
          // No need to modify, the path is already clean
        }
      }

      // Return the sanitized URL
      return parsed.toString();
    } catch (error) {
      console.error("Invalid URL", error);
      return url; // Return the original URL if it fails to parse
    }
  };

  // Handle paste event directly
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      // Skip if a video is already processed
      if (videoProcessed) return;

      const pasteText = e.clipboardData?.getData('text');
      if (pasteText && validateYoutubeUrl(pasteText)) {
        setYoutubeLink(pasteText);
        // Clear any previous errors
        setErrorMessage(null);

        // Use setTimeout to allow state to update before validation
        setTimeout(() => {
          setIsValidYoutubeLink(true);
          // Only process if we're not already loading
          if (!processingRef.current) {
            handleProcess(pasteText, null);
          }
        }, 100);
      }
    };

    // Add paste event listener to the input field
    const inputElement = inputRef.current;
    if (inputElement) {
      inputElement.addEventListener('paste', handlePaste);
    }

    return () => {
      if (inputElement) {
        inputElement.removeEventListener('paste', handlePaste);
      }
    };
  }, [videoProcessed]);

  // Handle YouTube link changes for validation
  useEffect(() => {
    // Skip the validation on initial render
    if (initialRenderRef.current) {
      initialRenderRef.current = false;
      return;
    }

    if (!youtubeLink) {
      setIsValidYoutubeLink(false);
      setErrorMessage(null);
      return;
    }

    const isValid = validateYoutubeUrl(youtubeLink);
    setIsValidYoutubeLink(isValid);

    // Only show error for invalid links when user has typed something
    if (!isValid && youtubeLink.length > 5) {
      setErrorMessage("Please enter a valid YouTube link.");
      toast.error("Please enter a valid YouTube link.", {
        position: "top-right",
        duration: 2000,
      });
    } else {
      setErrorMessage(null);
    }
  }, [youtubeLink]);

  const handleRemoveVideo = async () => {
    try {
      // Check if we have video URL stored in state
      if (videoUrl) {
        setIsLoading(true);

        // Call the delete API with the video URL
        const response = await fetch('https://cravio-ai.onrender.com/delete-video', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            video_url: videoUrl
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'Failed to delete video');
        }

        const result = await response.json();
        console.log('Video deleted successfully:', result);

        // Show success message
        toast.success("Video deleted successfully", {
          position: "top-right",
          duration: 3000,
        });
      }

      // Reset the UI state regardless of API call result
      setThumbnail(null);
      setCreditUsage(null);
      setVideoProcessed(false);
      setVideoUrl(null); // Clear the stored video URL
      setTaskProgress(0); // Reset task progress
      resetForm();
    } catch (error) {
      console.error('Error deleting video:', error);
      setErrorMessage('Failed to remove video. Please try again.');

      toast.error("Failed to remove video", {
        position: "top-center",
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Clear inputs and errors
  const resetForm = () => {
    setYoutubeLink('');
    setIsValidYoutubeLink(false);
    setFile(null);
    setErrorMessage(null);

    // Reset file input if it exists
    const fileInput = document.getElementById('upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  // Extracts video ID from YouTube URL
  const getYoutubeVideoId = (url: string): string => {
    try {
      const parsed = new URL(url);
      if (parsed.hostname.includes('youtube.com')) {
        return parsed.searchParams.get('v') || '';
      } else if (parsed.hostname.includes('youtu.be')) {
        return parsed.pathname.split('/')[1] || '';
      }
      return '';
    } catch {
      return '';
    }
  };

  // Function to pre-check if a YouTube video exists
  const checkYoutubeVideoExists = async (videoId: string): Promise<boolean> => {
    try {
      // Use YouTube oEmbed API to check if video exists
      const response = await fetch(
        `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
      );
      return response.status === 200;
    } catch (error) {
      console.error("Error checking YouTube video:", error);
      return false;
    }
  };

  // Updated handleFileChange function for better file validation
  // const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   // Skip if a video is already processed
  //   if (videoProcessed) return;

  //   if (e.target.files?.[0]) {
  //     const newFile = e.target.files[0];

  //     // Check file size (4000MB = 4000 * 1024 * 1024 bytes)
  //     const maxSizeBytes = 4000 * 1024 * 1024;
  //     if (newFile.size > maxSizeBytes) {
  //       setErrorMessage("File size must be less than 4GB");
  //       toast.error("File size must be less than 4GB", {
  //         position: "top-right",
  //         duration: 3000,
  //       });
  //       return;
  //     }

  //     // For video duration check, we need to create a video element
  //     const videoElement = document.createElement('video');
  //     videoElement.preload = 'metadata';

  //     videoElement.onloadedmetadata = () => {
  //       window.URL.revokeObjectURL(videoElement.src);

  //       // Check duration (2 hours = 7200 seconds)
  //       if (videoElement.duration > 7200) {
  //         setErrorMessage("Video duration must be less than 2 hours");
  //         toast.error("Video duration must be less than 2 hours", {
  //           position: "top-right",
  //           duration: 3000,
  //         });
  //         return;
  //       }

  //       // If all checks pass, set the file
  //       setFile(newFile);

  //       // Clear any previous errors
  //       setErrorMessage(null);

  //       // Process the file upload immediately
  //       setTimeout(() => {
  //         if (!processingRef.current) {
  //           handleProcess(null, newFile);
  //         }
  //       }, 100);
  //     };

  //     videoElement.onerror = () => {
  //       setErrorMessage("Cannot read video metadata. Please try another file.");
  //       toast.error("Cannot read video metadata", {
  //         position: "top-right",
  //         duration: 3000,
  //       });
  //     };

  //     videoElement.src = URL.createObjectURL(newFile);
  //   }
  // };

  // Updated handleProcess function with improved task handling
  const handleProcess = async (ytLink: string | null = null, uploadedFile: File | null = null) => {
    const linkToProcess = ytLink || youtubeLink;
    const fileToProcess = uploadedFile || file;

    // Clear previous errors
    setErrorMessage(null);

    // Prevent multiple simultaneous processing
    if (processingRef.current || isLoading) return;

    // Validate input
    const linkValid = linkToProcess ? validateYoutubeUrl(linkToProcess) : false;

    if (!linkValid && !fileToProcess) {
      const error = "Please provide a valid YouTube link or upload a file";
      setErrorMessage(error);
      toast.error(error, {
        position: "top-center",
        duration: 3000,
      });
      return;
    }

    // Set loading state and prevent re-processing
    setIsLoading(true);
    processingRef.current = true;

    try {
      let response;

      if (linkValid) {
        // Process YouTube link
        console.log('Processing YouTube link:', linkToProcess);

        // Sanitize YouTube URL first
        const sanitizedLink = sanitizeYoutubeUrl(linkToProcess);
        console.log('Sanitized link:', sanitizedLink);

        // Pre-check if video exists
        const videoId = getYoutubeVideoId(sanitizedLink);
        if (videoId) {
          const videoExists = await checkYoutubeVideoExists(videoId);
          if (!videoExists) {
            throw new Error("This YouTube video is unavailable or doesn't exist. Please check the link and try again.");
          }
        }

        response = await fetch(`https://cravio-ai.onrender.com/process-youtube`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ youtube_url: sanitizedLink }),
        });
      } else if (fileToProcess) {
        // Process file upload
        console.log('Processing file upload:', fileToProcess.name);

        const formData = new FormData();
        formData.append('file', fileToProcess);

        // Use the opusclip endpoint for task-based processing
        response = await fetch(`https://cravio-ai.onrender.com/opusclip/upload-file`, {
          method: 'POST',
          body: formData,
        });
      }

      if (!response?.ok) {
        // Handle error response
        let errorMessage = 'Failed to process request';

        try {
          const errorData = await response?.json();
          console.error('API Error:', errorData);

          // Extract meaningful error message
          if (errorData?.detail) {
            // Handle case where detail is an object with message
            if (typeof errorData.detail === 'object' && errorData.detail.message) {
              errorMessage = errorData.detail.message;

              // Also log possible solutions if available
              if (errorData.detail.possible_solutions) {
                console.info('Possible solutions:', errorData.detail.possible_solutions);

                // Show solutions in toast
                const solutions = errorData.detail.possible_solutions.join(', ');
                errorMessage += `. Possible solutions: ${solutions}`;
              }
            } else {
              // Handle special cases in error messages for better UX
              if (typeof errorData.detail === 'string') {
                if (errorData.detail.includes("404") && errorData.detail.includes("unavailable")) {
                  errorMessage = "This YouTube video is unavailable or doesn't exist. Please check the link and try again.";
                } else if (errorData.detail.includes("private") || errorData.detail.includes("restricted")) {
                  errorMessage = "This video is private or has age restrictions. Please try another video.";
                } else {
                  errorMessage = errorData.detail;
                }
              } else {
                errorMessage = String(errorData.detail);
              }
            }
          }
        } catch (parseError) {
          console.error("Error parsing response:", parseError);
          errorMessage = `Server error (${response?.status}): Please try again later`;
        }

        throw new Error(errorMessage);
      }

      const result = await response?.json();
      console.log('Processing result:', result);

      // Check if this is a task-based response
      if (result.task_id) {

        // Set state to indicate processing has started
        setVideoProcessed(true);

        // Keep the loading state active
        setIsLoading(true);

        // Initial toast notification
        toast.info("Video processing started. This may take a few seconds...", {
          position: "top-right",
          duration: 5000,
        });

        // Start polling for task status
        const taskResult = await pollTaskStatus(result.task_id);

        // Update UI with completed task info
        setThumbnail(taskResult.thumbnail_url);
        setVideoUrl(taskResult.video_url);
        setCreditUsage(taskResult.credit_usage || 1);

        // Show task completion toast
        toast.success("Processing completed successfully!", {
          position: "top-right",
          duration: 4000,
        });

        // Set loading to false now that processing is complete
        setIsLoading(false);
      } else {
        // Handle direct response (non-task based)
        setThumbnail(result?.thumbnail_url);
        setCreditUsage(result?.credit_usage || 1);
        setVideoProcessed(true);
        setVideoUrl(result?.video_url);
        setIsLoading(false);

        toast.success("Processing successful!", {
          position: "top-right",
          duration: 4000,
        });
      }
    } catch (error) {
      console.error('Processing error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to process request';
      setErrorMessage(errorMsg);

      toast.error(errorMsg, {
        position: "top-center",
        duration: 4000,
      });

      // Reset processed state on error
      setVideoProcessed(false);
      setTaskProgress(0);
      setIsLoading(false);
    } finally {
      processingRef.current = false;
    }
  };

  // Improved task status polling function
  const pollTaskStatus = async (taskId: string): Promise<TaskResult> => {
    return new Promise((resolve, reject) => {
      const interval = setInterval(async () => {
        try {
          const res = await fetch(`https://cravio-ai.onrender.com/task-status/${taskId}`);

          if (!res.ok) {
            clearInterval(interval);
            return reject(new Error(`Error fetching status: ${res.status}`));
          }

          const statusData: TaskStatus = await res.json();
          console.log('Task status:', statusData);

          // Update progress if available
          if (statusData.status === 'progress' && statusData.percent_complete !== undefined) {
            const progressPercent = Math.round(statusData.percent_complete);
            setTaskProgress(progressPercent);

            // Only show progress toast every 10% to avoid spamming
            if (progressPercent % 10 === 0) {
              toast.info(`Processing: ${progressPercent}%`, {
                position: "top-right",
                duration: 2000,
                id: `progress-toast-${taskId}`  // Use ID to prevent duplicate toasts
              });
            }
          }

          if (statusData.status === 'success' && statusData.result) {
            clearInterval(interval);
            return resolve(statusData.result);
          }

          if (statusData.status === 'failure' || statusData.status === 'failed') {
            clearInterval(interval);
            return reject(new Error(statusData.message || 'Task failed'));
          }
        } catch (err) {
          clearInterval(interval);
          reject(err);
        }
      }, 5000); // Poll every 5 seconds
    });
  };

  const handleSubmit = async () => {

    try {
      if (!videoUrl) {
        await handleProcess()
      } else {
        await handleOpusClip()
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpusClip = async () => {
    // check videoUrl , thumbnail and creditUsage is avalable or not
    setIsLoading(true);
    if (!videoUrl || !thumbnail || !creditUsage) {
      return toast.error(`Missing ${!videoUrl ? 'videoUrl' : !thumbnail ? 'thumbnail' : 'creditUsage'}`, {
        position: "top-center",
        duration: 4000,
      })
    }

    // fetch opusclip api
    try {
      const res = await fetch('https://cravio-ai.onrender.com/opusclip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          videoUrl,
          thumbnail,
          creditUsage,
          email,
          duration,
          aspectRatio,
          includeMoments,
          subtitleColor
        }),
      })

      if (!res.ok) {
        throw new Error(`Failed to process request: ${res.status}`)
      }

      const data = await res.json()
      console.log(data)
      // Check if this is a task-based response
      if (data.task_id) {

        // Set state to indicate processing has started
        setVideoProcessed(true);

        // Keep the loading state active
        setIsLoading(true);

        // Initial toast notification
        toast.info("Video processing started. This may take a few seconds...", {
          position: "top-right",
          duration: 5000,
        });

        // Start polling for task status
        await pollTaskStatus(data.task_id);

        // Show task completion toast
        toast.success("Processing completed successfully!", {
          position: "top-right",
          duration: 4000,
        });

      }
    } catch (error) {
      console.error(error)
      toast.error("Failed to process request", {
        position: "top-center",
        duration: 4000,
      })
    } finally {
      setIsLoading(false)
      setThumbnail(null);
      setCreditUsage(null);
      setVideoProcessed(false);
      setVideoUrl(null); // Clear the stored video URL
      setTaskProgress(0); // Reset task progress
      resetForm();
    }
  }

  const isSubmitEnabled = (isValidYoutubeLink || file) && !videoProcessed;

  const videoOptions = [
    { label: "Beasty", value: "yellow", src: "https://res.cloudinary.com/db17zxsjc/video/upload/v1749576854/Video-252_f4rrxp.mp4" },
    { label: "Karaoke", value: "green", src: "https://res.cloudinary.com/db17zxsjc/video/upload/v1749891577/lv_0_20250614142604_ijtizd.mp4" },
    { label: "Simple", value: "white", src: "https://res.cloudinary.com/db17zxsjc/video/upload/v1749576850/Video-288_wqhsdk.mp4" }
  ]

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-1 sm:p-6 gap-7">
      {/* Background text - Changed from OpusClip to CRAVIO */}
      <div className="absolute inset-0 md:flex items-center justify-center overflow-hidden pointer-events-none hidden">
        <h1 className="text-[23vw] font-bold text-zinc-700/30 select-none">CRAVIO</h1>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={cn(
          "relative rounded-xl w-full max-w-2xl text-center shadow-2xl bg-black",
          "p-6 md:p-10",
          "border border-b-0 border-zinc-700 overflow-hidden",
          isLoading && "border-transparent"
        )}
      >
        {/* cravio */}
        {/* Premium loading border animation */}
        {isLoading && (
          <div className="absolute inset-0 z-0">
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 rounded-xl"
              initial={{ rotate: 0, scale: 1 }}
              animate={{
                rotate: 360,
                scale: [1, 1.01, 1], // Slight scale for subtle pulse
              }}
              transition={{
                rotate: {
                  duration: 10, // Slower full rotation for premium feel
                  repeat: Infinity,
                  ease: "linear",
                },
                scale: {
                  duration: 6,
                  repeat: Infinity,
                  repeatType: "mirror",
                  ease: "easeInOut",
                },
              }}
            />
            <div className="absolute inset-0.5 bg-black rounded-xl" />
          </div>
        )}


        <div className="space-y-4 md:space-y-6 relative z-10">
          <div className="flex items-center gap-2 sm:gap-3 bg-zinc-900 border border-zinc-700 text-white p-3 md:p-4 rounded-lg">
            <Link className="text-zinc-500 w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
            <input
              ref={inputRef}
              id="youtube"
              type="url"
              placeholder="Drop a YouTube link"
              value={youtubeLink}
              onChange={(e) => setYoutubeLink(e.target.value)}
              className={cn(
                "flex-1 bg-transparent text-white border-none focus:outline-none focus:ring-0",
                "placeholder:text-zinc-400 placeholder:font-medium placeholder:text-base md:placeholder:text-lg",
                videoProcessed && "text-zinc-700",
                isLoading && "text-zinc-700"
                // "cursor-not-allowed opacity-50"
              )}
              disabled={videoProcessed || isLoading}
            />
            {videoProcessed && (
              <motion.p
                onClick={handleRemoveVideo}
                className="text-zinc-400 text-sm md:text-base hover:text-white px-2 py-1 focus:outline-none underline flex-shrink-0 cursor-pointer"
                hidden={isLoading}
              >
                Remove
              </motion.p>
            )}
          </div>

          {/* Error message display */}
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-red-900/50 border border-red-700 rounded-lg text-red-200 text-sm"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <p>{errorMessage}</p>
            </motion.div>
          )}

          {/* <div className={cn(
            "inline-block rounded-xl hover:bg-zinc-800 hover:text-white text-zinc-400 transition-colors duration-200",
            videoProcessed && "opacity-50 pointer-events-none"
          )}>
            <input
              id="upload"
              type="file"
              accept="video/*"
              onChange={handleFileChange}
              className="hidden"
              disabled={videoProcessed || isLoading}
            />

            <motion.label
              whileHover={{ scale: videoProcessed ? 1 : 1.03 }}
              whileTap={{ scale: videoProcessed ? 1 : 0.97 }}
              htmlFor="upload"
              className={cn(
                "inline-flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 font-medium text-sm md:text-base",
                videoProcessed ? "cursor-not-allowed" : "cursor-pointer"
              )}
            >
              <CloudUpload className="w-4 h-4 md:w-5 md:h-5" />
              <span>{file ? file.name : 'Upload File'}</span>
            </motion.label>
          </div> */}

          <motion.div
            whileHover={isSubmitEnabled && !isLoading ? { scale: 1.02 } : {}}
            whileTap={isSubmitEnabled && !isLoading ? { scale: 0.98 } : {}}
          >
            <Button
              onClick={() => handleSubmit()}
              disabled={((!isSubmitEnabled && !videoProcessed) || isLoading)}
              className={cn(
                "w-full font-medium transition",
                "text-base md:text-xl",
                "py-3 md:py-6",
                (!isSubmitEnabled && !videoProcessed) || isLoading
                  ? "bg-zinc-800 text-zinc-400 cursor-not-allowed"
                  : "bg-white text-black hover:bg-gray-200"
              )}
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className='text-white'>Processing{taskProgress > 0 && ` (${taskProgress}%)`}</span>
                </div>
              ) : (
                "Get clips in 1 click"
              )}
            </Button>
          </motion.div>
        </div>
      </motion.div>

      {/* Thumbnail and Credit Usage Display - Only shown after successful processing */}
      {thumbnail && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-full max-w-2xl relative"
        >
          <div className="rounded-xl overflow-hidden shadow-xl">
            {/* Thumbnail with 16:9 aspect ratio */}
            <div className="relative w-full pb-[56.25%]">
              <img
                src={thumbnail || undefined}
                alt="Video thumbnail"
                className="absolute inset-0 w-full h-full object-contain"
              />
            </div>

            {/* Credit usage indicator and task info */}
            <div className="p-4 flex flex-col items-center justify-center gap-2">
              <div className="flex items-center gap-1">
                <span className="text-zinc-400">Credit usage: </span>
                <svg width="16" height="16" viewBox="0 0 24 24" strokeWidth="1.5" fill="none" xmlns="http://www.w3.org/2000/svg" color="currentColor">
                  <path fillRule="evenodd" clipRule="evenodd" d="M13.2319 2.28681C13.5409 2.38727 13.75 2.6752 13.75 3.00005V9.25005H19C19.2821 9.25005 19.5403 9.40834 19.6683 9.65972C19.7963 9.9111 19.7725 10.213 19.6066 10.4412L11.6066 21.4412C11.4155 21.7039 11.077 21.8137 10.7681 21.7133C10.4591 21.6128 10.25 21.3249 10.25 21.0001V14.7501H5C4.71791 14.7501 4.45967 14.5918 4.33167 14.3404C4.20366 14.089 4.22753 13.7871 4.39345 13.5589L12.3935 2.55892C12.5845 2.2962 12.923 2.18635 13.2319 2.28681Z" fill="url(#linearGradient)"></path>
                  <defs>
                    <linearGradient gradientTransform="rotate(90)" id="linearGradient">
                      <stop offset="0%" stopColor="#FFE629"></stop>
                      <stop offset="100%" stopColor="#FFA057"></stop>
                    </linearGradient>
                  </defs>
                </svg>
                <span className="font-medium ">{creditUsage}</span>
                <TooltipProvider>
                  <Tooltip open={showMobileTip || undefined}>
                    <TooltipTrigger asChild>
                      <Info
                        className="w-4 h-4 text-zinc-400 cursor-pointer"
                        onClick={toggleMobileTip}
                      />
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <p>1 credit = 1 min video processing</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>

            <div className="p-1 items-center justify-center gap-2 text-sm text-zinc-400 text-center">
              <p>Using video you don’t own may violate copyright laws. By continuing, you confirm this is your own original content.</p>
            </div>

            {/* Customization options */}
            <div className="p-3 bg-zinc-900 text-zinc-400 flex flex-col gap-4 rounded-xl mt-3">
              <div className="flex items-center gap-5">
                <div className="flex items-center gap-2">
                  <p>clip duration</p>
                  <Select disabled={isLoading} value={duration} onValueChange={setDuration}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30 seconds">30s</SelectItem>
                      <SelectItem value="45 seconds">45s</SelectItem>
                      <SelectItem value="60 seconds">60s</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <p>aspect ratio</p>

                  <Select disabled={isLoading} value={aspectRatio} onValueChange={setAspectRatio}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="9:16">9:16</SelectItem>
                      <SelectItem value="1:1">1:1</SelectItem>
                      <SelectItem value="16:9">16:9</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex flex-col gap-2 w-full">
                <p>Include specific moments</p>
                <div className="w-full">
                  <input disabled={isLoading} onChange={(e) => setIncludeMoments(e.target.value)} className={`w-full focus:outline-none p-2 rounded border border-zinc-500 ${isLoading ? 'text-zinc-600' : 'text-white'}`} type='text' placeholder='Example: find some hilarious moments' />
                </div>
              </div>
            </div>

            <div className={`p-3 bg-zinc-900 text-zinc-400 flex flex-col gap-4 rounded-xl mt-3 ${isLoading ? "opacity-50" : ""}`}>
              <div className="flex flex-wrap justify-between items-center w-full">
                {videoOptions.map((option) => (
                  <Card
                    key={option.value}
                    onClick={() => !isLoading && setSubtitleColor(option.value)}
                    className={`cursor-pointer transition-all w-24 sm:w-28 md:w-32 flex flex-col items-center border-2 rounded-xl overflow-hidden 
          ${subtitleColor === option.value ? "border-white" : "border-zinc-600 hover:border-white"} 
          ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <div className="w-full aspect-[9/16]">
                      <video
                        src={option.src}
                        muted
                        autoPlay
                        loop
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="text-center text-xs py-2 text-zinc-300 capitalize w-full">
                      {option.label}
                    </div>
                  </Card>
                ))}
              </div>
            </div>

          </div>
        </motion.div>
      )}
    </div>
  );
}