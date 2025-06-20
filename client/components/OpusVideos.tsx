"use client";

import React, { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs'; // Assuming Clerk for user management
import Link from 'next/link'; // Assuming Next.js Link for navigation

// Define the structure of an Opus Clip
interface OpusClip {
    thumbnail: string;
    uniqueId: string;
    createdAt: string; // Assuming ISO date string
    caption?: string; // Optional: if you have titles
}

// Helper function to format dates (e.g., "2 hours ago", "Mar 15, 2023")
const getDaysLeft = (createdAt: string): string => {
    const createdDate = new Date(createdAt);
    const now = new Date();

    const expiryDate = new Date(createdDate.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 days later
    const timeDiff = expiryDate.getTime() - now.getTime();

    const daysLeft = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

    if (daysLeft > 1) return `${daysLeft} days left`;
    if (daysLeft === 1) return `1 day left`;
    if (daysLeft === 0) return `Expires today`;
    return `Expired`;
};


const OpusVideos = () => {
    const { user } = useUser();
    const [opusclips, setOpusClips] = useState<OpusClip[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchVideos = async () => {
            if (!user?.primaryEmailAddress?.emailAddress) {
                // User not loaded or email not available, wait for user data
                // Or handle as unauthenticated state if necessary
                if (user !== undefined) { // user is loaded but no email
                    setLoading(false);
                    setError("User email not available.");
                }
                return;
            }
            const email = user.primaryEmailAddress.emailAddress;
            setLoading(true);
            setError(null);

            try {
                const res = await fetch(`https://cravio-ai.onrender.com/user/${email}`);
                if (!res.ok) {
                    throw new Error(`Failed to fetch videos: ${res.status} ${res.statusText}`);
                }
                const data = await res.json();
                // Ensure data.opusclips is an array, provide default if not
                setOpusClips(Array.isArray(data?.opusclips) ? data.opusclips : []);
                
            } catch (err) {
                console.error('Error fetching videos:', err);
                setError(err instanceof Error ? err.message : 'An unknown error occurred.');
                setOpusClips([]); // Clear clips on error
            } finally {
                setLoading(false);
            }
        };

        // Only fetch if user object is available.
        // The useUser hook might provide user asynchronously.
        if (user) {
            fetchVideos();
        } else if (user === null) { // Explicitly null means user is loaded and not authenticated
            setLoading(false);
            // Optionally, set a message like "Please log in to see your clips."
            // setError("Please log in to see your clips.");
        }
        // If user is undefined, it means the hook is still loading the user state.
        // The effect will re-run when `user` changes.

    }, [user]); // Re-run effect when user object changes

    return (
        <div className="p-4 sm:p-6 font-sans">
            <h2 className="text-xl sm:text-2xl font-bold mb-5 ">Your Clips</h2>

            {loading && (
                <div className="flex space-x-4 overflow-hidden">
                    {[...Array(3)].map((_, index) => (
                        <div key={index} className="flex-shrink-0 w-72 md:w-80 animate-pulse">
                            <div className="aspect-[16/9] w-full bg-neutral-700 rounded-lg"></div>
                            <div className="mt-2">
                                <div className="h-4 bg-neutral-700 rounded w-3/4 mb-1"></div>
                                <div className="h-3 bg-neutral-700 rounded w-1/2"></div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {!loading && error && (
                <div className="bg-red-800 border border-red-700 text-red-100 px-4 py-3 rounded-lg relative" role="alert">
                    <strong className="font-bold">Error: </strong>
                    <span className="block sm:inline">{error}</span>
                </div>
            )}

            {!loading && !error && opusclips.length === 0 && (
                <p className="text-neutral-400 text-center py-8">
                    No clips found. Start creating some amazing content!
                </p>
            )}

            {!loading && !error && opusclips.length > 0 && (
                <div className="flex overflow-x-auto scroll-hidden space-x-4 pb-4 scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-neutral-800">
                    {[...opusclips].reverse().map((clip) => (
                        <div
                            key={clip.uniqueId} // Use uniqueId for the key
                            className="flex-shrink-0 w-72 md:w-80 bg-neutral-800 rounded-xl overflow-hidden shadow-lg transition-all duration-300 ease-in-out hover:scale-105 group"
                        >
                            <Link href={`/admin/clips/${clip.uniqueId}`} className="block cursor-pointer">
                                <div className="aspect-[16/9] w-full bg-black overflow-hidden">
                                    {/* Background color helps if image is transparent or doesn't load perfectly */}
                                    <img
                                        src={clip.thumbnail || 'https://placehold.co/320x180/1a1a1a/777777?text=Video'}
                                        alt={clip.caption || `Video ${clip.uniqueId}`}
                                        className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-110"
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.onerror = null; // Prevent infinite loop if fallback also fails
                                            target.src = 'https://placehold.co/320x180/1a1a1a/777777?text=Error+Loading';
                                        }}
                                    />
                                </div>
                                <div className="p-3 space-y-1">
                                    <p className="text-xs text-neutral-400">
                                        {getDaysLeft(clip.createdAt)}
                                    </p>
                                </div>
                            </Link>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default OpusVideos;
