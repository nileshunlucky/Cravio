"use client";

import React, { useEffect, useRef, useState } from "react";
import { useUser } from "@clerk/nextjs";

type Post = {
  post_url: string;
  caption: string;
  created_at: string;
};

export default function Mells() {
  const { user } = useUser();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isPlaying, setIsPlaying] = useState<boolean[]>([]);
  const [isMuted, setIsMuted] = useState<boolean[]>([]);
  const videoRefs = useRef<HTMLVideoElement[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const dummyPosts: Post[] = [
      {
        post_url: "https://www.w3schools.com/html/mov_bbb.mp4",
        caption: "Having fun! ✨ #travel #wanderlust #goodvibes #sunset",
        created_at: "2h",
      },
      {
        post_url: "https://www.w3schools.com/html/movie.mp4",
        caption: "Summer vibes are unmatched 🌊☀️ Who else is ready for beach season? #summer #beach #ocean #paradise",
        created_at: "5h",
      },
      {
        post_url: "https://www.w3schools.com/html/mov_bbb.mp4",
        caption: "Check this transformation! 🎨 What do you think? Drop your thoughts below 👇 #art #creative #diy #transformation",
        created_at: "1d",
      },
    ];
    setPosts(dummyPosts);
    setIsPlaying(new Array(dummyPosts.length).fill(true));
    setIsMuted(new Array(dummyPosts.length).fill(true)); // all start muted
  }, []);

  // Auto-play/pause based on intersection
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const video = entry.target as HTMLVideoElement;
          const videoIndex = videoRefs.current.indexOf(video);
          if (videoIndex === -1) return;

          if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
            video.currentTime = 0;
            video.play().catch(() => {});
            video.muted = isMuted[videoIndex]; // respect user's mute choice
            setIsPlaying((prev) => {
              const newState = [...prev];
              newState[videoIndex] = true;
              return newState;
            });
          } else {
            video.pause();
            setIsPlaying((prev) => {
              const newState = [...prev];
              newState[videoIndex] = false;
              return newState;
            });
          }
        });
      },
      { threshold: [0.5] }
    );

    videoRefs.current.forEach((video) => video && observer.observe(video));
    return () => {
      videoRefs.current.forEach((video) => video && observer.unobserve(video));
    };
  }, [posts, isMuted]);

  const toggleMute = (index: number) => {
    const video = videoRefs.current[index];
    if (video) {
      const newMuted = !video.muted;
      video.muted = newMuted;
      setIsMuted((prev) => {
        const newState = [...prev];
        newState[index] = newMuted;
        return newState;
      });
    }
  };

  const handleHoldPause = (index: number, pause: boolean) => {
    const video = videoRefs.current[index];
    if (!video) return;

    if (pause) video.pause();
    else video.play().catch(() => {});
  };

  return (
    <div className="bg-black min-h-screen">
      <div
        ref={containerRef}
        className="h-screen overflow-y-auto snap-y snap-mandatory scrollbar-hide"
        style={{ scrollSnapType: "y mandatory" }}
      >
        {posts.map((post, idx) => (
          <div
            key={idx}
            className="relative h-screen snap-start flex items-center justify-center"
          >
            <div className="relative w-full h-full max-w-md mx-auto">
              <video
                ref={(el) => {
                  if (el) {
                    videoRefs.current[idx] = el;
                    el.muted = isMuted[idx]; // respect state
                  }
                }}
                src={post.post_url}
                className="w-full h-full object-contain"
                loop
                playsInline
                onClick={() => toggleMute(idx)} // Tap to mute/unmute
                onPointerDown={() => handleHoldPause(idx, true)} // Hold to pause
                onPointerUp={() => handleHoldPause(idx, false)} // Release to resume
              />

              {/* User Info & Caption */}
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
                <div className="flex items-center gap-3 mb-2">
                  <img
                    src={
                      user?.imageUrl ||
                      "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face"
                    }
                    alt={user?.username || "User"}
                    className="w-8 h-8 rounded-full object-cover border border-white"
                  />
                  <span className="text-white font-semibold text-sm">
                    {user?.username || user?.firstName || "User"}
                  </span>
                  <span className="text-gray-300 text-sm">{post.created_at}</span>
                </div>
                <p className="text-white text-sm mb-2 line-clamp-2">{post.caption}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .line-clamp-2 {
          overflow: hidden;
          display: -webkit-box;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 2;
        }
      `}</style>
    </div>
  );
}
