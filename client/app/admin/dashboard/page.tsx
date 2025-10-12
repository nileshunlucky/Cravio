"use client";

import React, { useState, useRef, ChangeEvent, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

interface ImageAnalysis {
  image_url: string;
  title: string;
  note: string;
  labels: Record<string, number>;
  created_at: string;
  _loading?: boolean; // flag for fake card
}

const Page = () => {
  const { user } = useUser();
  const email = user?.emailAddresses?.[0]?.emailAddress || "";
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [analyses, setAnalyses] = useState<ImageAnalysis[]>([]);
  const [selected, setSelected] = useState<ImageAnalysis | null>(null);
  const router = useRouter();

  const handleClick = () => fileInputRef.current?.click();

  const handleChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fakeCard: ImageAnalysis = {
      image_url: "",
      title: "Analyzing...",
      note: "",
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
        toast.error("Paid feature. Subscribe to continue.", {
          style: {
            background: "linear-gradient(to bottom right, #5C0A14, #BC2120, #9B111E)",
            color: "white",
            border: "0px",
          },
        });
        router.push("/admin/pricing");
        // remove fake card
        setAnalyses(prev => prev.filter(c => c !== fakeCard));
        return;
      }

      const data = await res.json();
      if (res.ok && data?.data?.image_url) {
        // replace fake with real data
        setAnalyses(prev => [data.data, ...prev.filter(c => c !== fakeCard)]);
      } else {
        console.error("Invalid API response:", data);
        toast.error("Something went wrong. Try again.");
        setAnalyses(prev => prev.filter(c => c !== fakeCard));
      }
    } catch (err) {
      console.error("Upload failed:", err);
      toast.error("Upload failed. Try again.");
      setAnalyses(prev => prev.filter(c => c !== fakeCard));
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      if (!email) return;
      try {
        const res = await fetch(`https://cravio-ai.onrender.com/user/${email}`);
        const data = await res.json();
        if (res.ok && Array.isArray(data.image_analysis)) {
           setAnalyses(data.image_analysis.slice().reverse());
        } else {
          toast.error("Failed to load user data");
        }
      } catch {
        toast.error("An error occurred while fetching data.");
      }
    };
    fetchUserData();
  }, [email]);

  return (
    <div className="relative min-h-screen bg-black p-4">
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
        className="fixed bottom-6 right-6 bg-white text-black rounded-full w-14 h-14 flex items-center justify-center text-3xl shadow-lg hover:scale-105 transition z-50"
      >
        +
      </button>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-6">
        {analyses
          .filter(a => a)
          .map((a, idx) => (
                <motion.div
      key={idx}               // use idx or a unique id
      layout
      whileHover={{ scale: 1.02 }}
      onClick={() => setSelected(a)}  // <-- this is where you select for modal
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
                      alt={a.title}
                      className="w-full h-full object-cover absolute inset-0"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
                    <CardContent className="absolute bottom-4 left-4 right-4 text-white space-y-2 p-0">
                      <CardTitle className="text-xl font-bold">{a.title}</CardTitle>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {a.labels &&
                          Object.entries(a.labels)
                            .filter(([key]) => key.toUpperCase() !== "AURA")
                            .map(([key, value]) => (
                              <div key={key} className="flex justify-between">
                                <span>{key}</span>
                                <span>{value}%</span>
                              </div>
                            ))}
                      </div>
                      {a.labels?.AURA !== undefined && (
                        <div className="text-sm mt-1">AURA: {a.labels.AURA}%</div>
                      )}
                    </CardContent>
                  </>
                )}
              </Card>
            </motion.div>
          ))}
      </div>

      <AnimatePresence>
  {selected && (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-3 md:p-4 "
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={() => setSelected(null)}
    >
      <motion.div
        className="bg-zinc-900 text-white rounded-xl max-w-xl w-full p-4 md:p-6  overflow-y-auto"
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.8 }}
        onClick={e => e.stopPropagation()}
      >
        <img
          src={selected.image_url}
          alt={selected.title}
          className="w-full h-64 object-cover rounded-md mb-4"
        />
        <h2 className="text-xl font-semibold mb-4">{selected.title}</h2>

        {/* Labels */}
        <div className="grid grid-cols-1 gap-4">
          {/* AURA full width */}
          {selected.labels.AURA !== undefined && (
            <div>
              <div className="flex justify-between mb-1">
                <span>AURA</span>
                <span>{selected.labels.AURA}%</span>
              </div>
              <Progress value={selected.labels.AURA} />
            </div>
          )}

          {/* 4 body-part labels in 2x2 grid */}
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(selected.labels)
              .filter(([key]) => key !== "AURA")
              .map(([key, value]) => (
                <div key={key}>
                  <div className="flex justify-between mb-1">
                    <span>{key}</span>
                    <span>{value}%</span>
                  </div>
                  <Progress value={value} />
                </div>
              ))}
          </div>
        </div>

        {/* Note */}
        <p className="mt-6 text-zinc-500 text-xs md:text-lg text-start">{selected.note}</p>
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>
    </div>
  );
};

export default Page;
