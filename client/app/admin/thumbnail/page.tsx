"use client"

import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, Link, Sparkles } from 'lucide-react';
import { toast } from "sonner";
import { useUser } from "@clerk/nextjs"

const Page = () => {
    const [activeTab, setActiveTab] = useState('link');
    const [youtubeUrl, setYoutubeUrl] = useState('');
    const { user } = useUser();

    type ImageWithPreview = { file: File; preview: string };

    const [thumbnailImage, setThumbnailImage] = useState<ImageWithPreview | null>(null);
    const [faceImage, setFaceImage] = useState<ImageWithPreview | null>(null);
    const [loading, setLoading] = useState(false);
    const [thumbnailUrl, setThumbnailUrl] = useState('');

    const thumbnailRef = useRef<HTMLInputElement>(null);
    const faceRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = (file: File, type: 'thumbnail' | 'face') => {
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const result = e.target && typeof e.target.result === 'string' ? e.target.result : '';
                if (type === 'thumbnail') {
                    setThumbnailImage({ file, preview: result });
                } else if (type === 'face') {
                    setFaceImage({ file, preview: result });
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async () => {
        try {
            setLoading(true);
            if ((!youtubeUrl && !thumbnailImage) || !faceImage) {
                toast.error('Please provide either a YouTube link or a thumbnail image, and a face image.');
                setLoading(false);
                return;
            }

            const email = user?.primaryEmailAddress?.emailAddress

            const formData = new FormData();

            if (activeTab === 'link') {
                formData.append('youtubeUrl', youtubeUrl);
            } else {
                formData.append('thumbnailImage', thumbnailImage ? thumbnailImage.file : '');
            }
            formData.append('faceImage', faceImage ? faceImage.file : '');
            formData.append('email', email || '');

            const res = await fetch('https://cravio-ai.onrender.com/api/faceswap', {
                method: 'POST',
                body: formData
            });


            if (res.ok) {
                const data = await res.json();
                setThumbnailUrl(data.thumbnailUrl);
                setLoading(false);
                console.log(data);
            }

        } catch (error) {
            setLoading(false);
            console.error('Error submitting form:', error);
            toast.error('Error submitting form. Please try again.');
        }
    };

    const canSubmit = () => {
        const hasSource = activeTab === 'link' ? youtubeUrl.trim() : thumbnailImage;
        return hasSource && faceImage;
    };

    return (
        <div className="min-h-screen my-5 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-2xl  rounded-lg p-6 space-y-7 border-2"
                style={{
                    boxShadow: canSubmit() ? '0 0 20px rgba(71, 255, 231, 0.3)' : 'none'
                }}
            >

                {/* Tab Buttons */}
                <div className="flex rounded-lg gap-3 p-1 bg-zinc-900">
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setActiveTab('link')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${activeTab === 'link'
                            ? 'text-black'
                            : 'text-gray-300 hover:text-white hover:border hover:border-[#47FFE7]'
                            }`}
                        style={{
                            backgroundColor: activeTab === 'link' ? '#47FFE7' : 'transparent',
                            boxShadow: activeTab === 'link' ? '0 0 10px rgba(71, 255, 231, 0.5)' : 'none'
                        }}
                    >
                        <Link className="w-4 h-4" />
                        Link
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setActiveTab('upload')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${activeTab === 'upload'
                            ? 'text-black'
                            : 'text-gray-300 hover:text-white hover:border hover:border-[#47FFE7]'
                            }`}
                        style={{
                            backgroundColor: activeTab === 'upload' ? '#47FFE7' : 'transparent',
                            boxShadow: activeTab === 'upload' ? '0 0 10px rgba(71, 255, 231, 0.5)' : 'none'
                        }}
                    >
                        <Upload className="w-4 h-4" />
                        Upload
                    </motion.button>
                </div>

                {/* Input Section */}
                <div className="space-y-4">
                    {activeTab === 'link' ? (
                        <Input
                            placeholder="Drop a YouTube link"
                            value={youtubeUrl}
                            onChange={(e) => setYoutubeUrl(e.target.value)}
                            className="bg-gray-700 border-2 border-[#47FFE7] text-[#47FFE7] placeholder-gray-400 focus:outline-none px-5"
                        />
                    ) : (
                        <motion.div
                            whileHover={{ scale: 1.02 }}
                            className="border-2 border-[#47FFE7] rounded-lg p-3 text-center cursor-pointer transition-colors "
                            onClick={() => thumbnailRef.current?.click()}
                        >
                            <input
                                ref={thumbnailRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                    if (e.target.files && e.target.files[0]) {
                                        handleFileUpload(e.target.files[0], 'thumbnail');
                                    }
                                }}
                            />
                            {thumbnailImage ? (
                                <div className="space-y-2">
                                    <img
                                        src={thumbnailImage.preview}
                                        alt="Thumbnail"
                                        className=" mx-auto rounded object-contain"
                                    />
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <Upload className="w-8 h-8 mx-auto text-gray-500" />
                                    <p className="text-gray-400 text-sm">Click to upload thumbnail</p>
                                </div>
                            )}
                        </motion.div>
                    )}
                </div>

                {/* Face Image Upload */}
                <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="border-2 border-[#47FFE7]  rounded-lg p-3 text-center cursor-pointer transition-colors"
                    onClick={() => faceRef.current?.click()}
                >
                    <input
                        ref={faceRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        required
                        onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                                handleFileUpload(e.target.files[0], 'face');
                            }
                        }}
                    />
                    {faceImage ? (
                        <div className="space-y-2">
                            <img
                                src={faceImage.preview}
                                alt="Face"
                                className="md:w-72 md:h-72 w-24 h-24 mx-auto rounded-full object-contain"
                            />
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <Upload className="w-8 h-8 mx-auto text-gray-500" />
                            <p className="text-gray-400 text-sm">Upload face image</p>
                        </div>
                    )}
                </motion.div>

                {/* Submit Button */}
                <motion.div
                    whileHover={{ scale: canSubmit() && !loading ? 1.02 : 1 }}
                    whileTap={{ scale: canSubmit() && !loading ? 0.98 : 1 }}
                >
                    <Button
                        onClick={handleSubmit}
                        disabled={loading}
                        className={`w-full py-3 text-sm font-bold rounded-lg transition-all text-black hover:brightness-110`}
                        style={{
                            backgroundColor: '#47FFE7',
                            boxShadow: '0 0 15px rgba(71, 255, 231, 0.4)'
                        }}
                    >
                        <Sparkles />  {loading ? 'Generating...' : 'Generate'}
                    </Button>
                </motion.div>
                <motion.div>
                    {
                        thumbnailUrl &&
                        <motion.div
                            whileHover={{ scale: 1.02 }}
                            className="border-2 border-[#47FFE7] rounded-lg p-3 text-center cursor-pointer transition-colors"
                        >
                            <img
                                src={thumbnailUrl}
                                alt="Thumbnail"
                                className="object-contain"
                            />
                        </motion.div>
                    }
                </motion.div>
            </motion.div>
        </div>
    );
};

export default Page;