"use client";

import React, { useState, useRef, ChangeEvent, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Camera, Upload } from "lucide-react";

interface TradeAnalysis {
  image_url: string;
  labels: Record<string, number | string>;
  created_at: string;
  _loading?: boolean;
}

const Page = () => {
  const { user } = useUser();
  const email = user?.emailAddresses?.[0]?.emailAddress || "";
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const [analyses, setAnalyses] = useState<TradeAnalysis[]>([]);
  const [selected, setSelected] = useState<TradeAnalysis | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const router = useRouter();

  const uploadImage = async (file: File) => {
    const fakeCard: TradeAnalysis = {
      image_url: "",
      labels: {},
      created_at: new Date().toISOString(),
      _loading: true,
    };
    setAnalyses(prev => [fakeCard, ...prev]);

    const formData = new FormData();
    formData.append("email", email);
    formData.append("image", file);

    try {
      const res = await fetch("https://cravio-ai.onrender.com/api/image", {
        method: "POST",
        body: formData,
      });

      if (res.status === 403) {
        toast.error("Paid feature. Subscribe to continue.");
        router.push("/admin/pricing");
        setAnalyses(prev => prev.filter(c => c !== fakeCard));
        return;
      }

      const data = await res.json();
      if (res.ok && data?.data?.image_url) {
        setAnalyses(prev => [data.data, ...prev.filter(c => c !== fakeCard)]);
      } else {
        toast.error("Something went wrong. Try again.");
        setAnalyses(prev => prev.filter(c => c !== fakeCard));
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed! Try again.");
      setAnalyses(prev => prev.filter(c => c !== fakeCard));
    }
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    await uploadImage(file);
    
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
    setShowMenu(false);
  };

  const handleCameraClick = () => {
    cameraInputRef.current?.click();
    setShowMenu(false);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
    setShowMenu(false);
  };

  useEffect(() => {
    const fetchUserData = async () => {
      if (!email) return;
      try {
        const res = await fetch(`https://cravio-ai.onrender.com/user/${email}`);
        const data = await res.json();

        if (res.ok) {
          if (Array.isArray(data.image_analysis)) {
            setAnalyses(data.image_analysis.slice().reverse());
          }
        } else {
          toast.error("Failed to fetch user data.");
        }
      } catch (err) {
        console.error(err);
        toast.error("Error fetching data.");
      }
    };

    fetchUserData();
  }, [email]);

  return (
    <div className="relative min-h-screen bg-black p-4 md:ml-20 ml-0">
      {/* Hidden file inputs */}
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />
      <input
        type="file"
        accept="image/*"
        capture="environment"
        ref={cameraInputRef}
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Menu options */}
      <AnimatePresence>
        {showMenu && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-24 right-6 bg-zinc-900 rounded-2xl shadow-2xl overflow-hidden z-50 border border-zinc-800"
          >
            <button
              onClick={handleCameraClick}
              className="flex items-center gap-3 px-6 py-4 hover:bg-zinc-800 transition w-full text-left text-white"
            >
              <Camera className="w-5 h-5" />
              <span className="font-medium">Open Camera</span>
            </button>
            <div className="h-px bg-zinc-800"></div>
            <button
              onClick={handleUploadClick}
              className="flex items-center gap-3 px-6 py-4 hover:bg-zinc-800 transition w-full text-left text-white"
            >
              <Upload className="w-5 h-5" />
              <span className="font-medium">Upload Image</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating action button */}
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="fixed bottom-6 right-6 bg-white text-black rounded-full w-14 h-14 flex items-center justify-center text-3xl shadow-lg hover:scale-105 transition z-50"
      >
        {showMenu ? "×" : "+"}
      </button>

      {/* Grid of analyses */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-6">
        {analyses.map((a, idx) => (
          <motion.div
            key={idx}
            layout
            whileHover={{ scale: 1.02 }}
            onClick={() => setSelected(a)}
            className="relative"
          >
            <Card className="cursor-pointer overflow-hidden h-64 relative">
              {a._loading ? (
                <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-zinc-800 to-zinc-700 flex flex-col justify-end p-4">
                  <div className="h-5 bg-zinc-600 rounded w-1/2 mb-3"></div>
                  <div className="grid grid-cols-2 gap-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="h-3 bg-zinc-600 rounded"></div>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  <img
                    src={a.image_url}
                    alt={a.image_url}
                    className="w-full h-full object-cover absolute inset-0"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
                  <CardContent className="absolute bottom-4 left-4 right-4 text-white p-0">
                    <div className="bg-black/60 backdrop-blur rounded-lg p-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                      {Object.entries(a.labels).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between">
                          <span className="text-zinc-300 truncate">{key}</span>
                          <span className="font-semibold text-white">{Number(value)}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </>
              )}
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Detail modal */}
      <AnimatePresence>
        {selected && (
          <motion.div
            className="fixed inset-0 bg-black flex items-center justify-center z-50 p-4 pt-14"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelected(null)}
          >
            <motion.div
              className="bg-zinc-950 text-white rounded-2xl max-w-md w-full p-6 relative"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-center mb-16">
                <img
                  src={selected.image_url}
                  alt="Face"
                  className="w-35 h-35 absolute -top-14 rounded-full object-cover"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {Object.entries(selected.labels).map(([key, value]) => (
                  <div key={key} className="space-y-2">
                    <p className="text-zinc-200">{key}</p>
                    <p className="text-lg font-semibold text-white">{Number(value)}</p>
                    <Progress
                      value={Number(value)}
                      className={`h-2 ${
                        Number(value) <= 30
                          ? "[&>div]:bg-gradient-to-r [&>div]:from-red-600 [&>div]:to-red-400"
                          : Number(value) <= 79
                          ? "[&>div]:bg-gradient-to-r [&>div]:from-yellow-600 [&>div]:to-yellow-400"
                          : "[&>div]:bg-gradient-to-r [&>div]:from-green-600 [&>div]:to-green-400"
                      }`}
                    />
                  </div>
                ))}
              </div>

              <div className="flex justify-center mt-8">
                <img src="/logo.png" alt="Brand Logo" className="h-6" />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Page;