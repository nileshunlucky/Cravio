"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Swords, LoaderCircle } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type FaceStats = {
  Overall: number;
  Position: number;
  Masculinity: number;
  SkinQuality: number;
  Jawline: number;
  Cheekbones: number;
};

type MogResult = {
  Mogs: "LEFT" | "RIGHT";
  Mogged: "LEFT" | "RIGHT";
  LEFT: FaceStats;
  RIGHT: FaceStats;
};

const MogBattlePage = () => {
  const [leftFile, setLeftFile] = useState<File | null>(null);
  const [rightFile, setRightFile] = useState<File | null>(null);
  const [leftImage, setLeftImage] = useState<string | null>(null);
const [rightImage, setRightImage] = useState<string | null>(null);
  const [mogged, setMogged] = useState<"LEFT" | "RIGHT" | null>(null);
  const [result, setResult] = useState<MogResult | null>(null);

  const [loading, setLoading] = useState(false);
    const { user } = useUser();
    const router = useRouter();
  const email = user?.emailAddresses?.[0]?.emailAddress || "";

const FACE_KEYS: (keyof FaceStats)[] = [
  "Overall",
  "Position",
  "Masculinity",
  "SkinQuality",
  "Jawline",
  "Cheekbones",
];


 const handleUpload = (
  
  e: React.ChangeEvent<HTMLInputElement>,
  side: "left" | "right"
) => {
  const file = e.target.files?.[0];
  if (!file) return;

  const preview = URL.createObjectURL(file);

  if (side === "left") {
    setLeftFile(file);
    setLeftImage(preview);
  } else {
    setRightFile(file);
    setRightImage(preview);
  }
  setMogged(null);
};

  const handleMog = async () => {

    try {
      setLoading(true)
      if (!email){
        toast.error("user not found");
        return;
      }
      if (!leftFile || !rightFile) {
  toast.error("Upload both faces first");
  return;
}


    const formData = new FormData();
    formData.append("email", email);
    formData.append("leftImg", leftFile as File);
formData.append("rightImg", rightFile as File);
      const res = await fetch("https://cravio-ai.onrender.com/api/mog", {
        method: "POST",
        body: formData,
      });

      if (res.status === 403) {
        toast.error("Paid feature. Subscribe to continue.");
        router.push("/admin/pricing");
        return;
      }

      const data = await res.json();
      if (res.ok) {
  setResult(data.data);
  setMogged(data.data.Mogged);
} else {
        toast.error("Something went wrong. Try again.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed! Try again.");
    } finally {
      setLoading(false)
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-950 to-black flex items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-6xl w-full"
      >
        {/* Header */}
        <div className="text-center mb-12">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-4xl md:text-6xl font-bold tracking-tight bg-gradient-to-r from-red-600 via-red-500 to-red-800 bg-clip-text text-transparent mb-3"
          >
            MOG ARENA
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-zinc-500 text-sm  flex justify-center items-center"
          >
            <Swords />
          </motion.p>
        </div>

        {/* Arena - Side by Side Faces */}
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 md:gap-6">
            {/* Left Face */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <Card className="bg-gradient-to-br from-zinc-900/50 to-zinc-950/50 backdrop-blur-xl rounded-2xl overflow-hidden shadow-2xl hover:shadow-red-900/20 transition-all duration-300 p-0">
                <CardContent className="p-0">
                  <label className="cursor-pointer group block">
                    <input
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={(e) => handleUpload(e, "left")}
                    />
                    <div className="aspect-square rounded-xl  flex items-center justify-center overflow-hidden  transition-all duration-300 bg-zinc-950/30 relative">
                    {leftImage && mogged === "LEFT" && (
  <div className="absolute top-7 left-0 w-full bg-black/90 py-1 text-center z-50">
    <span className="text-red-600 font-semibold tracking-widest text-sm">
      MOGGED
    </span>
  </div>
)}

                      {leftImage ? (
                        <img
  src={leftImage}
  alt="Left face"
  className={`w-full h-full object-cover transition-all duration-300 ${
    mogged === "LEFT"
      ? "grayscale brightness-75 contrast-110"
      : ""
  }`}
/>

                      ) : (
                        <div className="text-center text-zinc-500">
                          <motion.div
                            whileHover={{ scale: 1.1 }}
                            transition={{ duration: 0.2 }}
                          >
                            <Upload className="mx-auto mb-2 h-6 w-6 md:h-8 md:w-8" />
                          </motion.div>
                          <p className="text-xs md:text-sm font-light">Upload Face</p>
                        </div>
                      )}
                    </div>
                  </label>
                </CardContent>
              </Card>
            </motion.div>

            {/* Right Face */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <Card className="bg-gradient-to-br from-zinc-900/50 to-zinc-950/50 backdrop-blur-xl  rounded-2xl overflow-hidden shadow-2xl hover:shadow-red-900/20 transition-all duration-300 p-0">
                <CardContent className="p-0">
                  <label className="cursor-pointer group block">
                    <input
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={(e) => handleUpload(e, "right")}
                    />
                    <div className="aspect-square rounded-xl flex items-center justify-center overflow-hidden  transition-all duration-300 bg-zinc-950/30 relative">
                    {rightImage && mogged === "RIGHT" && (
  <div className="absolute top-7 left-0 w-full bg-black/90 py-1 text-center z-50">
    <span className="text-red-600 font-semibold tracking-widest text-sm">
      MOGGED
    </span>
  </div>
)}
                      {rightImage ? (
                        <img
  src={rightImage}
  alt="Right face"
  className={`w-full h-full object-cover transition-all duration-300 ${
    mogged === "RIGHT"
      ? "grayscale brightness-75 contrast-110"
      : ""
  }`}
/>

                      ) : (
                        <div className="text-center text-zinc-500">
                          <motion.div
                            whileHover={{ scale: 1.1 }}
                            transition={{ duration: 0.2 }}
                          >
                            <Upload className="mx-auto mb-2 h-6 w-6 md:h-8 md:w-8" />
                          </motion.div>
                          <p className="text-xs md:text-sm font-light">Upload Face</p>
                        </div>
                      )}
                    </div>
                  </label>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {result && (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    className="mt-10 bg-zinc-950/60 border border-zinc-800 rounded-2xl p-6 backdrop-blur-xl"
  >
    <h3 className="text-center text-lg font-semibold tracking-wide text-white mb-6">
      BATTLE BREAKDOWN
    </h3>

    <div className="space-y-4">
      {FACE_KEYS.map((key) => {
        const left = result.LEFT[key];
        const right = result.RIGHT[key];
        const leftWins = left > right;

        return (
          <div
            key={key}
            className="grid grid-cols-3 items-center text-sm md:text-base"
          >
            {/* LEFT SCORE */}
            <div
              className={`text-left font-semibold ${
                leftWins ? "text-white" : "text-zinc-500"
              }`}
            >
              {left}
            </div>

            {/* LABEL */}
            <div className="text-center text-zinc-400 uppercase tracking-wider text-xs">
              {key}
            </div>

            {/* RIGHT SCORE */}
            <div
              className={`text-right font-semibold ${
                !leftWins ? "text-white" : "text-zinc-500"
              }`}
            >
              {right}
            </div>
          </div>
        );
      })}
    </div>
  </motion.div>
)}


          {/* CTA Button */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="flex justify-center pt-4"
          >
            <Button
              size="lg"
              className="w-full md:w-auto rounded-full px-12 py-6 text-base md:text-lg font-semibold shadow-xl  transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
              disabled={!leftFile || !rightFile || loading}
               onClick={handleMog}
            >
             {loading ? (
                <LoaderCircle className="w-4 h-4 animate-spin" />
              ) : (
                "MOG"
              )}
            </Button>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default MogBattlePage;