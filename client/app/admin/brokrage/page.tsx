"use client";

import React, { useState , useEffect } from "react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";

export default function BinanceBrokeragePage() {
  const [brokerId, setBrokerId] = useState("");
  const [apiKey, setApiKey] = useState("");
  const { user } = useUser();
  const email = user?.emailAddresses[0]?.emailAddress || "";

    useEffect(() => {
    const fetchUserData = async () => {
      if (!email) return;
      try {
        const res = await fetch(`https://cravio-ai.onrender.com/user/${email}`);
        const data = await res.json();

        if (res.ok) {
            if (data.brokerId) setBrokerId(data.brokerId);
            if (data.apiKey) setApiKey(data.apiKey);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let response = await fetch("https://cravio-ai.onrender.com/api/save-brokerage", {
        method: "POST",
        body: JSON.stringify({
          brokerId,
          apiKey,
          email,
        }),
      });

      if (response.ok) {
        toast.success("Brokerage information submitted successfully!");
      } else {
        toast.error("Failed to submit brokerage information. Please try again.");
      }
    } catch (error) {
      console.error("Error submitting brokerage information:", error);
      toast.error("Failed to submit brokerage information. Please try again.");
    } 
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-black px-4">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-3xl p-8 shadow-2xl"
      >
        <div className="text-white text-3xl font-semibold mb-8 text-center tracking-tight">
        <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Binance_Logo.svg/768px-Binance_Logo.svg.png" alt="Binance Logo" className="w-16 h-16 mx-auto mb-4" />
          <h1> Brokerage </h1>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <Label htmlFor="brokerId" className="text-zinc-400 text-sm">
               Broker ID
            </Label>
            <Input
              id="brokerId"
              value={brokerId}
              onChange={(e) => setBrokerId(e.target.value)}
              placeholder="Enter Binance broker ID"
              className="bg-zinc-900 border-zinc-800 text-white rounded-xl px-4 py-3 focus-visible:ring-zinc-300"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="apiKey" className="text-zinc-400 text-sm">
              API Key
            </Label>
            <Input
              id="apiKey"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter Binance API key"
              className="bg-zinc-900 border-zinc-800 text-white rounded-xl px-4 py-3 focus-visible:ring-zinc-300"
                required
            />
          </div>

          <Button
            type="submit"
            className="w-full mt-2 bg-white text-black font-medium rounded-xl py-3 hover:bg-zinc-200 transition-all"
          >
            Continue
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
