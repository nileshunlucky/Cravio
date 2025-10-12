"use client";

import React, { useState, useRef, ChangeEvent, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { toast } from 'sonner'

const Page = () => {
  const { user } = useUser();
  const email = user?.emailAddresses?.[0]?.emailAddress || "";
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [image, setImage] = useState<File | null>(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImage(file);
    if (image) {
    console.log("Current image ready to upload:", image.name);
    }

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

  useEffect(() => {
        const fetchUserData = async () => {
            if (!email) {
                return
            }

            try {
                const res = await fetch(`https://cravio-ai.onrender.com/user/${email}`)
                const data = await res.json()

                if (res.ok) {
                  console.log("Data", data)
                } else {
                    console.error("Error from server:", data)
                    toast.error("Failed to load user data", {
                        style: {
                            background: "linear-gradient(to bottom right, #5C0A14, #BC2120, #9B111E)",
                            color: "white",
                            border: "0px"
                        }
                    })
                }
            } catch (error) {
                console.error("Failed to fetch user data:", error)
                toast.error("An error occurred while fetching data.", {
                    style: {
                        background: "linear-gradient(to bottom right, #5C0A14, #BC2120, #9B111E)",
                        color: "white",
                        border: "0px"
                    }
                })
            }
        }

        fetchUserData()
    }, [email])

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
