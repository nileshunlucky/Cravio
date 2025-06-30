'use client';

import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectItem, SelectContent, SelectValue } from "@/components/ui/select";
import { motion } from 'framer-motion';
import { useUser } from '@clerk/nextjs';
import { toast } from 'sonner';

const Page = () => {
    const [youtubeUrl, setYoutubeUrl] = useState('');
    const [persona, setPersona] = useState('');
    const [prompt, setPrompt] = useState('');
    const [thumbnailUrl, setThumbnailUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const { user } = useUser();

    const handleSubmit = async () => {
        setLoading(true);
        if (!user) return toast.error("Please login to continue.");
        const email = user.emailAddresses[0]?.emailAddress;

        if (!youtubeUrl) return toast.error("YouTube link is required.");

        try {
            const formData = new FormData();
            formData.append("youtube_url", youtubeUrl);
            formData.append("persona", persona);
            formData.append("prompt", prompt);
            formData.append("email", email);

            const response = await fetch("https://cravio-ai.onrender.com/api/generate-thumbnail", {
                method: "POST",
                body: formData,
            });

            const data = await response.json();

            if (response.ok) {
                toast.success("Thumbnail generated successfully!");
                console.log("Thumbnail URL:", data.generated_thumbnail);
                setThumbnailUrl(data.generated_thumbnail);
            } else {
                console.error("Error:", data.error);
                toast.error("Failed to generate thumbnail");
            }
            setLoading(false);
        } catch (err) {
            console.error("Request failed", err);
            toast.error("An error occurred.");
            setLoading(false);
        }
    };


    return (
        <motion.div
            className="max-w-xl mx-auto p-6 space-y-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
        >

            <div className="space-y-2">
                <Label>YouTube Link</Label>
                <Input
                    placeholder="Paste YouTube video link"
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                />
            </div>

            <div className="space-y-2">
                <Label>Select Persona</Label>
                <Select onValueChange={setPersona}>
                    <SelectTrigger>
                        <SelectValue placeholder="Choose a persona" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="https://upload.wikimedia.org/wikipedia/commons/thumb/f/f4/USAFA_Hosts_Elon_Musk_%28Image_1_of_17%29_%28cropped%29.jpg/640px-USAFA_Hosts_Elon_Musk_%28Image_1_of_17%29_%28cropped%29.jpg">Elon Musk</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label>Optional Prompt</Label>
                <Input
                    placeholder="e.g. Bugatti parked near a mansion"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                />
            </div>

            {
                loading ? (
                    <Button disabled className="w-full" variant="secondary">
                        Generating...
                    </Button>
                ) : (
                    <Button onClick={handleSubmit} className="w-full">
                        Generate Thumbnail
                    </Button>
                )
            }

            {thumbnailUrl && (
                <div className="mt-6">
                    <Label>Generated Thumbnail</Label>
                    <img src={thumbnailUrl} alt="Generated Thumbnail" className="rounded-xl mt-2" />
                </div>
            )}

        </motion.div>
    );
};

export default Page;
