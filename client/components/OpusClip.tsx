'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Link, CloudUpload, Loader2 } from 'lucide-react';
import { toast } from "sonner";
import { motion } from "framer-motion";
import Image from 'next/image';

// Define a utility function to conditionally join classNames
const cn = (...classes: (string | undefined | null | false)[]) => {
    return classes.filter(Boolean).join(' ');
};

export default function OpusClipSimplePage() {
    const [youtubeLink, setYoutubeLink] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [thumbnail, setThumbnail] = useState<string | null>(null);
    const [isValidYoutubeLink, setIsValidYoutubeLink] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const processingRef = useRef(false);
    const initialRenderRef = useRef(true);

    // Validate YouTube URL function
    const validateYoutubeUrl = (url: string) => {
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

    // Helper function to sanitize YouTube URL
    const sanitizeYoutubeUrl = (url: string) => {
        try {
            const parsed = new URL(url);

            // Remove any unnecessary query parameters (like `si`)
            parsed.searchParams.delete('si');

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
            const pasteText = e.clipboardData?.getData('text');
            if (pasteText && validateYoutubeUrl(pasteText)) {
                setYoutubeLink(pasteText);
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
    }, []);

    // Handle YouTube link changes for validation
    useEffect(() => {
        // Skip the validation on initial render
        if (initialRenderRef.current) {
            initialRenderRef.current = false;
            return;
        }

        if (!youtubeLink) {
            setIsValidYoutubeLink(false);
            return;
        }

        const isValid = validateYoutubeUrl(youtubeLink);
        setIsValidYoutubeLink(isValid);

        // Only show error for invalid links when user has typed something
        if (!isValid && youtubeLink.length > 5) {
            toast.error("Please enter a valid YouTube link.", {
                position: "top-right",
                duration: 2000,
            });
        }
    }, [youtubeLink]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            const newFile = e.target.files[0];
            setFile(newFile);

            // Process the file upload immediately
            setTimeout(() => {
                if (!processingRef.current) {
                    handleProcess(null, newFile);
                }
            }, 100);
        }
    };

    const handleProcess = async (ytLink: string | null = null, uploadedFile: File | null = null) => {
        const linkToProcess = ytLink || youtubeLink;
        const fileToProcess = uploadedFile || file;

        // Prevent multiple simultaneous processing
        if (processingRef.current || isLoading) return;

        // Validate input
        const linkValid = linkToProcess ? validateYoutubeUrl(linkToProcess) : false;

        if (!linkValid && !fileToProcess) {
            toast.error("Please provide a valid YouTube link or upload a file", {
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

                response = await fetch(`https://cravio-ai.onrender.com/process-youtube`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ youtube_url: linkToProcess }),
                });
            } else if (fileToProcess) {
                // Process file upload
                console.log('Processing file upload:', fileToProcess.name);

                const formData = new FormData();
                formData.append('file', fileToProcess);

                response = await fetch(`https://cravio-ai.onrender.com/upload-file`, {
                    method: 'POST',
                    body: formData,
                });
            }

            if (!response?.ok) {
                const errorData = await response?.json();
                throw new Error(errorData?.detail || 'Failed to process request');
            }

            const result = await response?.json()
            console.log('Processing result:', result);
            setThumbnail(result?.thumbnail_url);

            // Display success message with video URL
            toast.success("Processing successful!", {
                position: "top-right",
                duration: 4000,
            });

            // Reset form after successful processing
            if (linkValid) {
                setYoutubeLink('');
                setIsValidYoutubeLink(false);
            } else if (fileToProcess) {
                setFile(null);
                // Reset file input
                const fileInput = document.getElementById('upload') as HTMLInputElement;
                if (fileInput) fileInput.value = '';
            }

        } catch (error) {
            console.error('Processing error:', error);
            toast.error(`Error: ${error instanceof Error ? error.message : 'Failed to process request'}`, {
                position: "top-center",
                duration: 4000,
            });
        } finally {
            setIsLoading(false);
            processingRef.current = false;
        }
    };

    const isSubmitEnabled = isValidYoutubeLink || file;

    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-1 sm:p-6 gap-7">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className={cn(
                    "relative rounded-xl w-full max-w-2xl text-center shadow-2xl",
                    "p-6 md:p-10",
                    "border border-b-0 border-zinc-700 overflow-hidden",
                    isLoading && "border-transparent"
                )}
            >
                {/* Premium loading border animation */}
                {isLoading && (
                    <div className="absolute inset-0 z-0">
                        <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 rounded-xl"
                            initial={{ rotate: 0 }}
                            animate={{
                                rotate: 360,
                                backgroundPosition: ["0% 0%", "100% 100%"],
                                scale: [1, 1.02, 1]
                            }}
                            transition={{
                                rotate: { duration: 3, repeat: Infinity, ease: "linear" },
                                backgroundPosition: { duration: 3, repeat: Infinity, ease: "linear" },
                                scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
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
                            className="flex-1 bg-transparent text-white border-none focus:outline-none focus:ring-0 placeholder:text-zinc-400 placeholder:font-medium placeholder:text-base md:placeholder:text-lg"
                        />
                        {youtubeLink && (
                            <motion.p
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => {
                                    setYoutubeLink('');
                                    setIsValidYoutubeLink(false);
                                }}
                                className="text-zinc-400 text-sm md:text-base hover:text-white px-2 py-1 focus:outline-none underline flex-shrink-0 cursor-pointer"
                            >
                                Remove
                            </motion.p>
                        )}
                    </div>

                    <div className="inline-block rounded-xl hover:bg-zinc-800 hover:text-white text-zinc-400 transition-colors duration-200">
                        <input
                            id="upload"
                            type="file"
                            accept="video/*,audio/*"
                            onChange={handleFileChange}
                            className="hidden"
                        />

                        <motion.label
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            htmlFor="upload"
                            className="inline-flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 cursor-pointer font-medium text-sm md:text-base"
                        >
                            <CloudUpload className="w-4 h-4 md:w-5 md:h-5" />
                            <span>{file ? file.name : 'Upload File'}</span>
                        </motion.label>
                    </div>

                    <motion.div
                        whileHover={isSubmitEnabled && !isLoading ? { scale: 1.02 } : {}}
                        whileTap={isSubmitEnabled && !isLoading ? { scale: 0.98 } : {}}
                    >
                        <Button
                            onClick={() => handleProcess()}
                            disabled={!isSubmitEnabled || isLoading}
                            className={cn(
                                "w-full font-medium transition",
                                "text-base md:text-xl",
                                "py-3 md:py-6",
                                isSubmitEnabled && !isLoading ? "bg-white text-black hover:bg-gray-200" : "bg-zinc-800 text-zinc-400 cursor-not-allowed"
                            )}
                        >
                            {isLoading ? (
                                <div className="flex items-center justify-center gap-2">
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    <span>Processing</span>
                                </div>
                            ) : (
                                "Get clips in 1 click"
                            )}
                        </Button>
                    </motion.div>
                </div>
            </motion.div>
            <motion.div className="aspect-video w-full">
                {thumbnail && (
                    <Image
                        src={thumbnail}
                        alt="Thumbnail"
                        fill
                        className="object-cover"
                    />
                )}
            </motion.div>

        </div>
    );
}