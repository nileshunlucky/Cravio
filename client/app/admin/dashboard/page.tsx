"use client";

import React, { useState, useRef, ChangeEvent, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

interface TradeAnalysis {
  image_url: string;
  title: string;
  note: string;
  labels: Record<string, number | string>;
  created_at: string;
  _loading?: boolean;
}

const Page = () => {
  const { user } = useUser();
  const email = user?.emailAddresses?.[0]?.emailAddress || "";
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [analyses, setAnalyses] = useState<TradeAnalysis[]>([]);
  const [selected, setSelected] = useState<TradeAnalysis | null>(null);
  const router = useRouter();

  const handleChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fakeCard: TradeAnalysis = {
      image_url: "",
      title: "Analyzing Trade...",
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
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        onChange={handleChange}
        className="hidden"
      />

      <button
        onClick={() => fileInputRef.current?.click()}
        className="fixed bottom-6 right-6 bg-white text-black rounded-full w-14 h-14 flex items-center justify-center text-3xl shadow-lg hover:scale-105 transition z-50"
      >
        +
      </button>

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
                    alt={a.title}
                    className="w-full h-full object-cover absolute inset-0"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
                  <CardContent className="absolute bottom-4 left-4 right-4 text-white space-y-2 p-0">
                    <CardTitle className="text-xl font-bold">{a.title}</CardTitle>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {Object.entries(a.labels).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span>{key.toLowerCase().includes("probability") ? 'Winning Probability' : key}</span>
                          <span>{key.toLowerCase().includes("probability") ? `${value}%` : value}</span>
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

      <AnimatePresence>
        {selected && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-3 md:p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelected(null)}
          >
            <motion.div
              className="bg-zinc-900 text-white rounded-xl max-w-xl w-full p-4 md:p-6 overflow-y-auto"
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

              <div className="grid grid-cols-1 gap-4">
  {Object.entries(selected.labels)
    .filter(([key]) => 
      !["Stop Loss", "Profit Trade 1", "Profit Trade 2"].includes(key)
    )
          .map(([key, value]) => (
      <div key={key}>
        <div className="flex justify-between mb-1">
          <span>{key.toLowerCase().includes("probability") ? 'Winning Probability' : key}</span>
          <span
            className={
              key.toLowerCase().includes("prediction")
                ? value.toString().toLowerCase() === "buy"
                  ? "text-green-500 font-semibold"
                  : value.toString().toLowerCase() === "sell"
                  ? "text-red-500 font-semibold"
                  : ""
                : ""
            }
          >
            {key.toLowerCase().includes("probability")
              ? `${value}%`
              : value}
          </span>
        </div>
        {key.toLowerCase().includes("probability") && (
          <Progress  value={Number(value)} />
        )}
      </div>
    ))}
</div>



        <div className="grid grid-cols-3 gap-4 text-center text-sm md:text-base mb-6">
          <div className="bg-gradient-to-t from-red-600 via-red-900 to-zinc-900 p-3 rounded-lg">
            <p className="text-red-400">Stop Loss</p>
            <p className="font-semibold">
              {selected.labels["Stop Loss"] || "-"}
            </p>
          </div>
          <div className="bg-gradient-to-t from-green-600 via-green-900 to-zinc-900 p-3 rounded-lg">
            <p className="text-green-400 whitespace-nowrap">Profit Trade 1</p>
            <p className="font-semibold">
              {selected.labels["Profit Trade 1"] || "-"}
            </p>
          </div>
          <div className="bg-gradient-to-t from-green-600 via-green-900 to-zinc-900 p-3 rounded-lg">
            <p className="text-green-400 whitespace-nowrap">Profit Trade 2</p>
            <p className="font-semibold">
              {selected.labels["Profit Trade 2"] || "-"}
            </p>
          </div>
        </div>

              <p className="mt-3 text-zinc-500 text-xs md:text-lg">
                <span className="text-zinc-100">Analysis:</span> {selected.note}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Page;
