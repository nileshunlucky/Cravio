"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter, useParams } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton"; // Assuming this is imported correctly

type Post = {
  reel_url: string;
  caption: string;
  created_at: string;
  id: string;
};

// Utility function to shuffle an array (Fisher-Yates)
const shuffleArray = (array: Post[]) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

// NOTE: For a real 1000+ video system, you would implement PAGINATION here.
// You would fetch a page of videos (e.g., 10-20), and load more on scroll.
// The initial request would fetch the video corresponding to the ID, plus
// a randomized set of surrounding/other videos.

export default function MellByIdPage() {
  const { user } = useUser();
  const router = useRouter();
  const { id } = useParams();
  const [posts, setPosts] = useState<Post[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState<boolean[]>([]);
  const [isMuted, setIsMuted] = useState<boolean[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [initialScrollDone, setInitialScrollDone] = useState(false);
  const videoRefs = useRef<HTMLVideoElement[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Format date to Instagram style
  const formatInstagramDate = (dateString: string) => {
    // ... (Your existing formatInstagramDate implementation)
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffMinutes < 1) return "now";
    if (diffMinutes < 60) return `${diffMinutes}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Fetch and process user mells 
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user?.emailAddresses?.[0]?.emailAddress || !id) return;
      
      setIsLoading(true);
      try {
        // --- 1. Fetch ALL Data ---
        // (In a real app, this endpoint would support pagination and ID retrieval)
        const res = await fetch("https://cravio-ai.onrender.com/users");
        if (!res.ok) {
          setIsLoading(false);
          return;
        }
        const data = await res.json();
        
        // Extract all posts and filter for validity
        const allValidPosts: Post[] = data.flatMap((user: any) => 
          user.posts?.map((post: any) => ({
            reel_url: post.reel_url,
            caption: post.caption,
            created_at: post.created_at,
            id: post.id
          })).filter((post: any) => post.reel_url && post.caption && post.created_at && post.id) || []
        );
        
        // --- 2. Separate Requested Post and Others ---
        const requestedPostIndex = allValidPosts.findIndex(post => post.id === id);
        let requestedPost: Post | undefined;
        let otherPosts: Post[];
        
        if (requestedPostIndex !== -1) {
          requestedPost = allValidPosts[requestedPostIndex];
          otherPosts = allValidPosts.filter((_, idx) => idx !== requestedPostIndex);
        } else {
          // If the ID is not found, treat all posts as 'other'
          otherPosts = allValidPosts;
        }

        // --- 3. Shuffle Other Posts for Random Order ---
        const shuffledOtherPosts = shuffleArray(otherPosts);
        
        // --- 4. Assemble Final Posts Array ---
        let finalPosts: Post[] = [];
        if (requestedPost) {
          // Put the requested post first
          finalPosts = [requestedPost, ...shuffledOtherPosts];
          // Since the requested post is first, currentIndex will be 0.
          setCurrentIndex(0); 
        } else {
          // If ID not found, just use the random set
          finalPosts = shuffledOtherPosts;
          setCurrentIndex(0); // Start at the first randomized video
          
          // OPTIONAL: If ID was passed but not found, redirect to base mells
          if(id) {
             console.warn(`Post with ID ${id} not found. Showing random feed.`);
             // router.replace('/mells'); // Uncomment if you want to redirect
          }
        }

        setPosts(finalPosts);
        setIsPlaying(new Array(finalPosts.length).fill(false));
        // Initialize all muted to true (standard for autoplay feeds)
        setIsMuted(new Array(finalPosts.length).fill(true)); 
        
        setIsLoading(false);
      } catch (err) {
        console.error("Failed to fetch user data:", err);
        setIsLoading(false);
      }
    };
    fetchUserData();
  }, [user, id]);

  // Handle initial scroll to the correct video (which is now guaranteed to be index 0)
  useEffect(() => {
    if (!isLoading && posts.length > 0 && !initialScrollDone) {
      // The video matching the ID is now always at index 0.
      if (containerRef.current) {
        // Use requestAnimationFrame for smoother scroll in Next.js/React hydration
        const scroll = () => {
             containerRef.current!.scrollTop = 0; // Scroll to the very top (index 0)
             setInitialScrollDone(true);
        }
        // Delay to ensure component is fully rendered and ref is ready
        setTimeout(scroll, 50); 
      }
    }
  }, [isLoading, posts, initialScrollDone]); // id is no longer needed in dependency list

  // Auto-play/pause based on intersection (unchanged, as it is robust)
  useEffect(() => {
    if (posts.length === 0 || !initialScrollDone) return;

    // ... (Your existing IntersectionObserver implementation)
    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                const video = entry.target as HTMLVideoElement;
                const videoIndex = videoRefs.current.indexOf(video);
                if (videoIndex === -1) return;

                if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
                    video.currentTime = 0;
                    video.play().catch(() => {});
                    video.muted = isMuted[videoIndex];
                    
                    setCurrentIndex(videoIndex);
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
  }, [posts, isMuted, initialScrollDone]);

  // Update URL when currentIndex changes (for navigation)
  useEffect(() => {
    if (initialScrollDone && posts.length > 0 && currentIndex >= 0 && currentIndex < posts.length) {
      const currentPost = posts[currentIndex];
      // Only update URL if it's a different ID
      if (currentPost?.id && currentPost.id !== id) {
        // Use replace to update URL without adding to history
        router.replace(`/mells/${currentPost.id}`, { scroll: false });
      }
    }
  }, [currentIndex, posts, id, router, initialScrollDone]);

  // ... (Your existing toggleMute and handleHoldPause implementations)
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

  const handleHoldPause = useCallback((index: number, pause: boolean) => {
    const video = videoRefs.current[index];
    if (!video) return;

    if (pause) video.pause();
    else video.play().catch(() => {});
  }, []);

  // Instagram-style skeleton loading (unchanged)
  const LoadingSkeleton = () => (
    <div className="bg-black min-h-screen">
      <div className="h-screen overflow-y-auto snap-y snap-mandatory scrollbar-hide">
        {Array.from({ length: 3 }).map((_, idx) => (
          <div key={idx} className="relative h-screen snap-start flex items-center justify-center">
            <div className="relative w-full h-full max-w-md mx-auto">
              {/* Video skeleton */}
              <Skeleton className="w-full h-full bg-zinc-800" />
              
              {/* User info skeleton */}
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
                <div className="flex items-center gap-3 mb-2">
                  <Skeleton className="w-8 h-8 rounded-full bg-zinc-700" />
                  <Skeleton className="h-4 w-20 bg-zinc-700" />
                </div>
                <Skeleton className="h-4 w-full mb-1 bg-zinc-700" />
                <Skeleton className="h-3 w-16 bg-zinc-700" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (posts.length === 0) {
    return (
      <div className="bg-black min-h-screen flex items-center justify-center">
        <div className="text-white text-center">
          <p className="text-xl mb-2">No reels found</p>
          <p className="text-zinc-400">Check back later for new content!</p>
        </div>
      </div>
    );
  }

  // Final Render (Video Feed)
  return (
    <div className="bg-black min-h-screen">
      <div
        ref={containerRef}
        className="h-screen overflow-y-auto snap-y snap-mandatory scrollbar-hide"
        style={{ scrollSnapType: "y mandatory" }}
      >
        {posts.map((post, idx) => (
          <div
            key={post.id}
            className="relative h-screen snap-start flex items-center justify-center"
          >
            <div className="relative w-full h-full max-w-md mx-auto bg-black">
              {/* Video Player */}
              <video
                ref={(el) => {
                  if (el) {
                    videoRefs.current[idx] = el;
                    el.muted = isMuted[idx];
                  }
                }}
                src={post.reel_url}
                className="w-full h-full object-contain"
                loop
                playsInline
                preload="metadata"
                onClick={() => toggleMute(idx)}
                onPointerDown={() => handleHoldPause(idx, true)}
                onPointerUp={() => handleHoldPause(idx, false)}
                onError={(e) => {
                  console.error("Video failed to load:", post.reel_url);
                  e.currentTarget.style.display = 'none';
                  // You might want to add a placeholder or error message here
                }}
              />

              {/* User Info & Caption */}
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 via-black/20 to-transparent">
                <div className="flex items-center gap-3 mb-3">
                  <img
                    src={
                      user?.imageUrl ||
                      "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face"
                    }
                    alt={user?.username || "User"}
                    className="w-9 h-9 rounded-full object-cover border-2 border-white/20"
                  />
                  <span className="text-white font-semibold text-sm">
                    {user?.username || user?.firstName || "User"}
                  </span>
                </div>
                <p className="text-white text-sm leading-relaxed line-clamp-3 mb-2">{post.caption}</p>
                <span className="text-zinc-300 text-xs">{formatInstagramDate(post.created_at)}</span>
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
        .line-clamp-3 {
          overflow: hidden;
          display: -webkit-box;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 3;
        }
      `}</style>
    </div>
  );
}