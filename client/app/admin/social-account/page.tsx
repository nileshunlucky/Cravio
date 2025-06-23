// app/social-account/page.jsx (Next.js app router)
"use client";
import React from "react";

const YOUTUBE_AUTH_URL = process.env.NEXT_PUBLIC_YOUTUBE_AUTH_URL;
const INSTAGRAM_AUTH_URL = process.env.NEXT_PUBLIC_INSTAGRAM_AUTH_URL;

const SocialAccountPage = () => {
  const handleYouTubeConnect = () => {
    if (YOUTUBE_AUTH_URL) {
      window.location.href = YOUTUBE_AUTH_URL;
    } else {
      alert("YouTube authentication URL is not set.");
    }
  };

  const handleInstagramConnect = () => {
    if (INSTAGRAM_AUTH_URL) {
      window.location.href = INSTAGRAM_AUTH_URL;
    } else {
      alert("Instagram authentication URL is not set.");
    }
  };

  return (
    <div className="p-8 flex flex-col gap-6 items-center">
      <h1 className="text-2xl font-bold">Connect Your Social Accounts</h1>
      
      <button
        onClick={handleYouTubeConnect}
        className="px-6 py-2 bg-red-600 text-white rounded-xl shadow hover:bg-red-700"
      >
        🎥 Connect YouTube
      </button>

      <button
        onClick={handleInstagramConnect}
        className="px-6 py-2 bg-gradient-to-r from-purple-500 via-pink-500 to-yellow-500 text-white rounded-xl shadow hover:opacity-90"
      >
        📸 Connect Instagram
      </button>
    </div>
  );
};

export default SocialAccountPage;
