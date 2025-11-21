"use client";

import React, { useEffect, useRef, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton"; // shadcn/ui

interface Post {
  id: string;
  reel_url: string;
}

export default function Mells() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [muted, setMuted] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<HTMLVideoElement[]>([]);

  // --- Fetch videos once ---
  useEffect(() => {
    fetch("https://cravio-ai.onrender.com/users")
      .then(r => r.json())
      .then((users: { posts?: Post[] }[]) => {
        const all = users.flatMap(u => u.posts || []).filter(p => p.reel_url);
        // Shuffle the array to make it random
        const shuffled = all.sort(() => Math.random() - 0.5);
        setPosts(shuffled);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // --- Auto play/pause the visible reel ---
  useEffect(() => {
    if (!containerRef.current) return;
    const io = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          const v = entry.target as HTMLVideoElement;
          if (entry.isIntersecting && entry.intersectionRatio > 0.8) {
            v.muted = muted;
            v.play().catch(() => {});
          } else {
            v.pause();
          }
        });
      },
      { root: containerRef.current, threshold: 0.8 }
    );
    videoRefs.current.forEach(v => v && io.observe(v));
    return () => io.disconnect();
  }, [posts, muted]);

  // --- Global mute/unmute on tap ---
  const handleVideoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const newMute = !muted;
    setMuted(newMute);
    videoRefs.current.forEach(v => (v.muted = newMute));
  };

  return (
    <div className="bg-black flex justify-center">
      <div className="relative w-full md:max-w-[420px] h-screen">
        {/* Header like Instagram Reels */}
        <header className="absolute top-0 left-0 right-0 z-20 p-4 flex justify-center items-center bg-gradient-to-b from-black/60 to-transparent">
          <span className="font-semibold text-xl text-white">Mells</span>
        </header>

        {/* Scrollable vertical feed */}
        <div
          ref={containerRef}
          className="h-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {loading
            ? Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={`skeleton-${i}`}
                  className="h-screen snap-start flex items-center justify-center bg-black"
                >
                  <Skeleton className="w-full h-full bg-zinc-800" />
                </div>
              ))
            : posts.map((p, i) => (
                <div
                  key={p.id}
                  className="h-screen snap-start flex items-center justify-center relative"
                >
                  <video
                    ref={el => {
                      if (el) videoRefs.current[i] = el;
                    }}
                    src={p.reel_url}
                    className="w-full h-full object-contain aspect-[9/16]"
                    playsInline
                    loop
                    muted={muted}
                    onClick={handleVideoClick}
                  />
                </div>
              ))}
        </div>
      </div>

      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none; /* IE/Edge */
          scrollbar-width: none; /* Firefox */
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none !important; /* Chrome/Safari/Opera */
          width: 0 !important;
          height: 0 !important;
        }
        .scrollbar-hide::-webkit-scrollbar-track {
          display: none !important;
        }
        .scrollbar-hide::-webkit-scrollbar-thumb {
          display: none !important;
        }
      `}</style>
    </div>
  );
}
