'use client';

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UploadCloud, X } from "lucide-react";
import { motion } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { toast } from "sonner";

interface UserVideoProps {
  value: string | File;
  onChange: (video: string | File) => void;
}

const UserVideo: React.FC<UserVideoProps> = ({ value, onChange }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoURL, setVideoURL] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setIsLoading(true);
      
      // Check file size (10MB = 10 * 1024 * 1024 bytes)
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error("Video size must be less than 10MB");
        e.target.value = '';
        setIsLoading(false);
        return;
      }

      // Create URL for the video
      const objectUrl = URL.createObjectURL(file);
      
      // Create a video element to check duration
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      video.onloadedmetadata = () => {
        URL.revokeObjectURL(objectUrl);
        
        // Check video duration (30 seconds)
        if (video.duration > 30) {
          toast.error("Video length must be less than 30 seconds");
          e.target.value = '';
          setIsLoading(false);
          return;
        }
        
        // If validation passes, set the video
        setVideoURL(URL.createObjectURL(file));
        onChange(file);
        setIsLoading(false);
      };
      
      video.onerror = () => {
        toast.error("Invalid video file");
        e.target.value = '';
        setIsLoading(false);
      };
      
      video.src = objectUrl;
    }
  };

  const handleRemoveVideo = () => {
    if (videoURL) {
      URL.revokeObjectURL(videoURL);
      setVideoURL(null);
      onChange('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  useEffect(() => {
    if (value instanceof File) {
      const url = URL.createObjectURL(value);
      setVideoURL(url);

      return () => URL.revokeObjectURL(url); // cleanup
    } else if (typeof value === 'string' && value) {
      setVideoURL(value);
    } else {
      setVideoURL(null);
    }
  }, [value]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full"
    >
      <Card className="bg-black border-white border-2 rounded-none shadow-2xl min-h-screen flex flex-col items-center justify-center relative">
        <CardContent className="flex flex-col items-center justify-center p-6 space-y-6 w-full">
          <input
            type="file"
            accept="video/*"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />
          
          {!videoURL && !isLoading && (
            <Button
              variant="ghost"
              className="text-white border border-white hover:bg-white hover:text-black transition-colors duration-300"
              onClick={handleUploadClick}
            >
              <UploadCloud className="mr-2 h-5 w-5" />
              Upload Video
            </Button>
          )}

          {isLoading && (
            <div className="text-white flex flex-col items-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white mb-4"></div>
              <p>Processing video...</p>
            </div>
          )}

          {videoURL && (
            <>
              <Button
                variant="ghost"
                className="absolute top-4 right-4 text-white bg-black/50 rounded-full p-2 z-10 hover:bg-black/80"
                onClick={handleRemoveVideo}
              >
                <X className="h-5 w-5" />
              </Button>
              
              <motion.video
                key={videoURL}
                ref={videoRef}
                src={videoURL}
                autoPlay
                muted
                loop
                playsInline
                className="w-full min-h-screen object-contain"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.7 }}
              />
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default UserVideo;