"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
// Removed all icon imports (Volume2, VolumeX, Loader2, X, ChevronLeft)

// Interfaces are kept outside the component for clean typing
interface Post {
  id: string;
  reel_url?: string;
}

interface FetchedUser {
  posts?: Post[];
}

/**
 * Utility function to perform the Fisher-Yates (Knuth) shuffle.
 * This shuffles an array in place with O(n) complexity.
 * @param array The array to shuffle.
 */
function shuffleArray<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    // Pick a random element before the current element
    const j = Math.floor(Math.random() * (i + 1));
    // Swap it with the current element
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Custom hook to handle exponential backoff for fetch retries (Logic unchanged)
const useFetchWithBackoff = (url: string, maxRetries = 3) => {
  const [data, setData] = useState<FetchedUser[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    let lastError = null;

    for (let i = 0; i < maxRetries; i++) {
      try {
        const res = await fetch(url);
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        const json: FetchedUser[] = await res.json();
        setData(json);
        setLoading(false);
        return;
      } catch (err) {
        lastError = (err as Error).message;
        const delay = Math.pow(2, i) * 1000; // 1s, 2s, 4s...
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    setLoading(false);
    setError(`Failed to fetch data after ${maxRetries} attempts: ${lastError}`);
  }, [url, maxRetries]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error };
};


// Main Reel Component
const ReelScrollApp = ({ initialPostId = "" }) => {
  // Use the provided API endpoint
  const API_URL = "https://cravio-ai.onrender.com/users";

  const { data: fetchedData, loading: isLoading, error: fetchError } = useFetchWithBackoff(API_URL);

  const [posts, setPosts] = useState<Post[]>([]);
  const [isGloballyMuted, setIsGloballyMuted] = useState(true);

  const videoRefs = useRef<HTMLVideoElement[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const isInitialScrollDone = useRef(false);

  // --- 1. Data Processing and Initial Scroll/Play Logic ---
  useEffect(() => {
    if (isLoading || fetchError || !fetchedData) return;

    // Flatten and filter for valid reels
    let allPosts: Post[] = fetchedData
      .flatMap((user) => user.posts || [])
      .filter(post => post.reel_url && post.id);

    if (allPosts.length === 0) {
      console.error("No valid video posts found.");
      return;
    }
    
    // 💡 MODIFICATION START: SHUFFLE THE POSTS ARRAY
    // Use the shuffle utility to randomize the order of the posts
    allPosts = shuffleArray(allPosts);
    // 💡 MODIFICATION END

    setPosts(allPosts);
    
    // Find the initial post index (it will now be based on the shuffled array)
    let startIndex = allPosts.findIndex(post => post.id === initialPostId);
    
    // Use random start index if initialPostId is not found or not provided.
    // NOTE: This will always result in a random start index since the array is already shuffled, 
    // but we keep the logic for robustness if `initialPostId` is passed.
    if (startIndex === -1 || !initialPostId) {
        startIndex = Math.floor(Math.random() * allPosts.length);
    }

    // Use a slight delay to ensure the DOM has rendered and the container has measured its size
    const initialSetup = () => {
      if (!containerRef.current || !videoRefs.current[startIndex]) {
        // If elements aren't ready, try again shortly
        if (allPosts.length > 0 && !isInitialScrollDone.current) {
              setTimeout(initialSetup, 50);
        }
        return;
      }
      
      const targetVideo = videoRefs.current[startIndex];
      const container = containerRef.current;
      const videoHeight = targetVideo.offsetHeight;
      
      // Scroll to the correct initial position
      container.scrollTop = startIndex * videoHeight;
      isInitialScrollDone.current = true;
      
      // Initial play of the target video
      targetVideo.muted = isGloballyMuted;
      targetVideo.play().catch(e => console.log("Initial Play failed, waiting for user interaction.", e));
    };

    setTimeout(initialSetup, 100);

  }, [fetchedData, isLoading, fetchError, initialPostId, isGloballyMuted]);


  // --- 2. Intersection Observer for Auto-Play/Pause ---
  useEffect(() => {
    if (posts.length === 0 || !containerRef.current) return;

    // Function to check if a video is the *primary* one in view (at the snap-point)
    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        const video = entry.target as HTMLVideoElement;
        
        // Check if the video is fully visible (high threshold)
        if (entry.isIntersecting && entry.intersectionRatio >= 0.9) {
          // Play the video and apply current mute state
          video.muted = isGloballyMuted;
          video.play().catch(() => {});
        } else {
          // Pause if it scrolls away, but only if it was playing
          if (!video.paused) {
            video.pause();
          }
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, { 
      root: containerRef.current, 
      // Ensure the video is mostly in view to trigger the play/pause
      threshold: [0.1, 0.9] 
    });

    // Attach observer to all video elements
    videoRefs.current.forEach((v) => v && observer.observe(v));
    
    // Cleanup function
    return () => observer.disconnect();
  }, [posts, isGloballyMuted]); // Dependency on isGloballyMuted is important

  // --- 3. Global Mute/Unmute Logic ---
  const toggleGlobalMute = useCallback(() => {
    const newMuted = !isGloballyMuted;
    setIsGloballyMuted(newMuted);

    // Apply the new mute state to ALL video elements immediately
    videoRefs.current.forEach(video => {
      if (video) {
        video.muted = newMuted;
        // If unmuting, try to play the current video (IO will handle it gracefully)
        if (!newMuted && video.paused) {
          video.play().catch(() => {});
        }
      }
    });
  }, [isGloballyMuted]);
  
  // Handler to prevent double-click (dblclick) interference
  const handleDoubleClick = useCallback((e: React.MouseEvent<HTMLVideoElement>) => {
      e.preventDefault();
      e.stopPropagation();
  }, []);


  // --- Component Rendering ---
  
  if (isLoading) {
    return (
      <div className="bg-black min-h-screen flex items-center justify-center font-sans text-white text-lg">
        Loading Mells...
      </div>
    );
  }

  if (fetchError || posts.length === 0) {
    return (
      <div className="bg-black min-h-screen flex items-center justify-center p-4">
        <div className="text-white text-lg p-6 bg-red-800/20 border border-red-700">
          <span>{fetchError || "No valid video posts found."}</span>
        </div>
      </div>
    );
  }

  return (
    // Main Container: Uses bg-black for default dark mode
    <div className="bg-black min-h-screen flex justify-center font-sans text-white">
      
      {/* Reel Frame: Constrained width on desktop, full height */}
      <div className="w-full h-screen md:max-w-[420px] md:h-screen overflow-hidden relative">

        {/* Header: Minimal text only */}
        <header className="absolute top-0 left-0 right-0 z-20 p-4 flex justify-center items-center bg-gradient-to-b from-black/50 to-transparent">
            <span className="font-semibold text-xl">Mells</span>
        </header>

        {/* Scrollable Container (Instagram Feed) - Now using bg-black */}
        <div 
          ref={containerRef} 
          className="h-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide bg-black"
        >
          {posts.map((post, idx) => (
            <div
              key={post.id || `post-${idx}`}
              // h-screen ensures full height on all devices
              className="relative h-screen snap-start flex items-center justify-center overflow-hidden"
            >
              
              {/* Video Element: object-contain for all screen sizes. */}
              <video
                ref={(el) => {
                  // Keep the ref up to date
                  if (el) videoRefs.current[idx] = el;
                }}
                src={post.reel_url}
                // FIX: Add e.preventDefault() to stop the browser's default action (which causes the scroll jump)
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleGlobalMute();
                }}
                // Add double-click handler to prevent default browser behavior
                onDoubleClick={handleDoubleClick}
                // Use object-contain for all sizes
                className="w-full h-full object-contain aspect-[9/16]"
                loop
                playsInline
                preload="auto"
                muted={isGloballyMuted}
              />
              
              {/* Removed Mute Icon Overlay and Content Overlay */}

            </div>
          ))}
        </div>

        {/* Removed Footer Placeholder */}

        {/* Tailwind & Custom CSS for clean scrolling */}
        <style>{`
          /* Hide scrollbar for a clean UI */
          .scrollbar-hide {
            -ms-overflow-style: none; /* IE and Edge */
            scrollbar-width: none; /* Firefox */
          }
          .scrollbar-hide::-webkit-scrollbar {
            display: none; /* Chrome, Safari, Opera */
          }
        `}</style>
      </div>
    </div>
  );
};

// Removed Extracted Mute Button component

export default ReelScrollApp;