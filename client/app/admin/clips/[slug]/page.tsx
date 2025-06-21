"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Download, ArrowLeft, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

// Define the structure of a clip
interface Clip {
  clipUrl: string;
  subtitle: string;
  caption: string;
  viralityScore: string;
}

// Define the structure of an Opus Clip
interface OpusClip {
  uniqueId: string;
  thumbnail: string;
  clips: Clip[];
  createdAt: {
    $date: string;
  };
}

const ClipPage = () => {
  const { slug } = useParams();
  const router = useRouter();
  const { user } = useUser();
  const [opusClip, setOpusClip] = useState<OpusClip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  useEffect(() => {
    const fetchClipData = async () => {
      if (!user?.primaryEmailAddress?.emailAddress) {
        if (user !== undefined) {
          setLoading(false);
          setError("User email not available.");
        }
        return;
      }

      try {
        const email = user.primaryEmailAddress.emailAddress;
        const res = await fetch(`https://cravio-ai.onrender.com/user/${email}`);

        if (!res.ok) {
          throw new Error(`Failed to fetch data: ${res.status} ${res.statusText}`);
        }

        const userData = await res.json();

        if (!userData?.opusclips || !Array.isArray(userData.opusclips)) {
          throw new Error("Invalid user data format");
        }

        // Find the specific clip with matching uniqueId
        const foundClip = userData.opusclips.find(
          (clip: OpusClip) => clip.uniqueId === slug
        );

        if (!foundClip) {
          throw new Error("Clip not found");
        }

        setOpusClip(foundClip);

        // Initialize states for each clip
        if (foundClip.clips) {
          videoRefs.current = videoRefs.current.slice(0, foundClip.clips.length);
        }
      } catch (err) {
        console.error('Error fetching clip:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (slug && user) {
      fetchClipData();
    } else if (user === null) {
      setLoading(false);
      setError("Please log in to view this clip");
    }
  }, [slug, user]);

  // Format date function
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  };

  // Handle downloading a clip
  const handleDownload = (url: string, index: number) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `clip-${index + 1}.mp4`;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Toggle play/pause for a video
  const togglePlay = (index: number) => {
    const videoRef = videoRefs.current[index];

    if (videoRef) {
      if (videoRef.paused) {
        videoRef.play();
      } else {
        videoRef.pause();
      }
    }
  };

  // Toggle like state

  // Handle video reference
  const setVideoRef = (element: HTMLVideoElement | null, index: number) => {
    videoRefs.current[index] = element;
  };

  // Loading state
  if (loading) {
    return (
      <div className="w-full min-h-screen bg-black">
        <div className="max-w-md mx-auto p-4">
          <div className="flex items-center mb-6">
            <Skeleton className="h-6 w-6 rounded-full mr-2" />
            <Skeleton className="h-6 w-32" />
          </div>

          <Skeleton className="h-[80vh] w-full rounded-xl mb-4" />

          <div className="flex justify-between items-center mb-3">
            <div className="flex space-x-4">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>

          <Skeleton className="h-4 w-32 mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="w-full min-h-screen bg-black flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-neutral-900 border border-neutral-800 p-6 rounded-xl text-center">
          <h2 className="text-xl font-bold mb-3 text-red-400">Error</h2>
          <p className="text-neutral-300">{error}</p>
          <Button
            variant="outline"
            className="mt-4 border-neutral-700 hover:bg-neutral-800"
            onClick={() => router.back()}
          >
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  // No clips found or empty collection
  if (!opusClip || !opusClip.clips || opusClip.clips.length === 0) {
    return (
      <div className="w-full min-h-screen bg-black flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-neutral-900 border border-neutral-800 p-6 rounded-xl text-center">
          <h2 className="text-xl font-bold mb-3">No Clips Found</h2>
          <p className="text-neutral-400">
            This collection doesn&apos;t have any clips or the clip ID is invalid.
          </p>
          <Button
            variant="outline"
            className="mt-4 border-neutral-700 hover:bg-neutral-800"
            onClick={() => router.back()}
          >
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const getViralityColor = (scoreStr: string): string => {
  const score = parseInt(scoreStr.replace("%", ""));
  if (score <= 30) return "text-red-500";
  if (score <= 70) return "text-yellow-400";
  return "text-green-500";
};

  return (
    <div className="w-full min-h-screen bg-black p-4">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="max-w-md mx-auto relative pb-16"
      >
        {/* Header navigation */}
        <motion.div
          variants={itemVariants}
          className="sticky top-0 z-10 bg-black/90 backdrop-blur-sm flex items-center justify-between p-4 border-b border-neutral-800"
        >
          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-neutral-800"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-medium">Collection</h1>
          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-neutral-800"
          >
            <MoreHorizontal className="h-5 w-5" />
          </Button>
        </motion.div>

        {/* Clips feed */}
        <div>
          {opusClip.clips.map((clip, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="border-b border-neutral-800 pb-4 mb-2"
            >
              <Card className="border-0 bg-transparent">
                {/* User info header */}
                <div className="flex items-center p-3">
                  <Avatar className="h-8 w-8 mr-2 border border-neutral-700">
                    <img
                      src={user?.imageUrl || "https://placehold.co/100/333/FFF?text=U"}
                      alt="User"
                      className="rounded-full"
                    />
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{user?.firstName || "User"}</p>
                    <p className="text-xs text-neutral-400">
                      {opusClip.createdAt?.$date ? formatDate(opusClip.createdAt.$date) : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs bg-neutral-800 border-neutral-700">
                    Clip {index + 1}
                  </Badge>
                  <Badge variant="outline" className="text-xs bg-neutral-800 border-neutral-700">
                    Virality Score:{" "}
                    <span className={`font-bold ${getViralityColor(clip.viralityScore)}`}>
                      {clip.viralityScore}
                    </span>
                  </Badge>
                  </div>
                </div>

                {/* Video with 9:16 aspect ratio */}
                <div className="relative aspect-[9/16] bg-black overflow-hidden mb-2">
                  <video
                    ref={(el) => setVideoRef(el, index)}
                    src={clip.clipUrl}
                    className="absolute w-full h-full object-cover"
                    playsInline
                    onClick={() => togglePlay(index)}
                  >
                    Your browser does not support the video tag.
                  </video>

                  {/* Play/pause overlay (invisible but clickable) */}
                  <div
                    className="absolute inset-0 cursor-pointer z-10"
                    onClick={() => togglePlay(index)}
                  />

                  {/* Download button */}
                  <Button
                    variant="outline"
                    size="icon"
                    className="absolute top-4 right-4 bg-black/30 hover:bg-black/50 border-0 backdrop-blur-sm z-20"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload(clip.clipUrl, index);
                    }}
                  >
                    <Download className="h-4 w-4" />
                    <span className="sr-only">Download</span>
                  </Button>
                </div>

                {/* Caption & subtitle */}
                <div className="px-4 pt-1">
                  {/* Caption */}
                  <p className="text-sm font-medium mb-2">
                    {clip.caption}
                  </p>

                  {/* Subtitle */}
                  <p className="text-sm text-neutral-400 leading-relaxed">
                    {clip.subtitle}
                  </p>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default ClipPage;