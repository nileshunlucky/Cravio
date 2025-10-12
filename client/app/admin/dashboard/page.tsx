"use client";

import React, { useState, useRef } from "react";
import { useUser } from "@clerk/nextjs";

const Page = () => {
  const { user } = useUser();
  const email = user?.emailAddresses?.[0]?.emailAddress || "";
  const fileInputRef = useRef(null);
  const [image, setImage] = useState(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImage(file);

    // Create form data
    const formData = new FormData();
    formData.append("email", email);
    formData.append("image", file);

    try {
      const res = await fetch("https://cravio-ai.onrender.com/api/image", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      console.log("response:", data);
    } catch (err) {
      console.error("Upload failed:", err);
    }
  };

  return (
    <div className="relative min-h-screen bg-black">
      <input
        type="file"
        accept="image/*"
        capture="environment"
        ref={fileInputRef}
        onChange={handleChange}
        className="hidden"
      />

      <button
        onClick={handleClick}
        className="fixed bottom-6 right-6 bg-white text-black rounded-full w-14 h-14 flex items-center justify-center text-3xl shadow-lg hover:scale-105 transition"
      >
        +
      </button>
    </div>
  );
};

export default Page;
