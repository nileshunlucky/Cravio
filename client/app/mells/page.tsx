"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

type Post = {
  reel_url: string;
  caption: string;
  created_at: string;
  id: string;
};

export default function MellsRoot() {
  const router = useRouter();

  useEffect(() => {
    async function goToRandom() {
      try {
        // Fetch all users and their posts from API
        const res = await fetch("https://cravio-ai.onrender.com/users");
        const data = await res.json();

        // Extract all posts from all users
        const allPosts: Post[] = data.flatMap((user: any) => 
          user.posts?.map((post: any) => ({
            reel_url: post.reel_url,
            caption: post.caption,
            created_at: post.created_at,
            id: post.id
          })).filter((post: any) => post.reel_url && post.caption && post.created_at && post.id) || []
        );

        if (allPosts.length === 0) {
          console.error("No valid posts found");
          return;
        }

        // Select a random post
        const randomIndex = Math.floor(Math.random() * allPosts.length);
        const randomPost = allPosts[randomIndex];

        // Navigate to the random post
        router.replace(`/mells/${randomPost.id}`);
      } catch (e) {
        console.error("Could not get random mell id", e);
      }
    }
    goToRandom();
  }, [router]);

  return null; // nothing visible while redirecting
}
