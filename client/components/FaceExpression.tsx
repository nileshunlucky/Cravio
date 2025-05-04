'use client';

import React, { useState, useRef } from 'react'; // Import useRef
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils'; // Assuming cn is utility for merging class names

const emotions = ['😊 Smile', '😂 Laugh', '😢 Cry', '😞 Sad', '😠 Angry', '😍 Love'];

const Page = () => {
    const [image, setImage] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [selectedEmotion, setSelectedEmotion] = useState<string>('');


    // Ref for the hidden file input
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImage(file);
            setPreview(URL.createObjectURL(file));
            // Clear the value of the input so the same file can be selected again
            if (e.target) {
                e.target.value = '';
            }
        }
    };


    // Function to trigger the file input click
    const triggerFileSelect = () => {
        fileInputRef.current?.click();
    };


    const handleEmotionSelect = (emotion: string) => {
        setSelectedEmotion(emotion);
    };

    const handleCreate = () => { // Renamed from handleUpload
        if (!image || !selectedEmotion) {
            alert('Please upload an image and select an emotion.');
            return;
        }
        console.log('Creating image:', image.name, 'with emotion:', selectedEmotion);
        alert(`Simulating creation for image "${image.name}" with emotion: ${selectedEmotion}`);
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 md:p-6">
            <Card className="w-full max-w-lg shadow-xl border border-gray-300 rounded-xl overflow-hidden ">
                <CardContent className="p-8 space-y-8">

                    {/* Hidden file input */}
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden" // Keep hidden
                        id="imageUpload"
                        ref={fileInputRef} // Assign ref
                    />

                    {/* Image Preview - Renders when preview exists */}
                    <AnimatePresence>
                        {preview && (
                            <motion.div
                                key="image-preview"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 20 }}
                                transition={{ duration: 0.4 }}
                            >
                                <img
                                    src={preview}
                                    alt="Preview"
                                    className="w-full h-64 object-contain rounded-lg border border-gray-300 shadow-sm"
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Conditional rendering based on image presence */}
                    {!image ? (
                        // Drag and drop area when no image is uploaded
                        <div>
                            {/* Label triggers the hidden input */}
                            <Button variant="outline" size="lg" className="mt-2 w-full" onClick={triggerFileSelect}>
                                Choose Image
                            </Button>
                        </div>
                    ) : (
                        // Simple button to change image when an image is uploaded
                        <motion.div
                            key="change-button" // Key for AnimatePresence if used, or just for motion
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4 }}
                        >
                            {/* Button triggers file select via function */}
                            <Button
                                variant="outline"
                                size="lg"
                                className="w-full py-3 text-lg font-semibold"
                                onClick={triggerFileSelect}
                            >
                                Change Image
                            </Button>
                        </motion.div>
                    )}


                    {/* Emotion Selection */}
                    <div className="space-y-4">
                        <p className="text-gray-800 font-medium text-lg">Select an emotion:</p>
                        <div className="grid grid-cols-3 gap-4">
                            {emotions.map((emotion) => (
                                <motion.button
                                    key={emotion}
                                    onClick={() => handleEmotionSelect(emotion)}
                                    className={cn(
                                        'flex items-center justify-center text-base px-4 py-3 rounded-md border transition-colors duration-200 ease-in-out',
                                        selectedEmotion === emotion
                                            ? 'bg-black text-white border-black shadow-md'
                                            : 'bg-white text-gray-700 hover:bg-gray-100 border-gray-300 hover:border-gray-400'
                                    )}
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.97 }}
                                    transition={{ duration: 0.1 }}
                                >
                                    {emotion}
                                </motion.button>
                            ))}
                        </div>
                    </div>

                    {/* Create Button - Label changed */}
                    <Button
                        className="w-full py-4 text-lg font-semibold tracking-wide bg-black text-white hover:bg-gray-800 disabled:bg-gray-300 disabled:text-gray-500 transition-colors"
                        onClick={handleCreate} // Call handleCreate
                        disabled={!image || !selectedEmotion}
                    >
                        Create
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
};

export default Page;