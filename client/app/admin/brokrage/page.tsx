"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";

export default function Home() {
  const { user } = useUser();
  const email = user?.emailAddresses?.[0]?.emailAddress || "";
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [loading, setLoading] = useState(false);


  const handleConnect = async () => {
    if (!email) {
      toast("You must be logged in.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("https://cravio-ai.onrender.com/api/binance/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey, apiSecret, email }),
      });

      const data = await res.json();
      toast(data.message);
    } catch (err) {
      console.error(err);
      toast("Something went wrong");
    } finally {
        setLoading(true);
        setApiKey("")
        setApiSecret("")
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen w-full bg-black flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="md:w-[400px] bg-black border-0">
          <CardHeader>
            <CardTitle className="text-center text-zinc-100 text-xl tracking-wide">
              Binance Brokerage
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <Input
              placeholder="API Key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="text-zinc-200 placeholder:text-zinc-500"
            />

            <Input
              placeholder="API Secret"
              value={apiSecret}
              onChange={(e) => setApiSecret(e.target.value)}
              type="password"
              className="text-zinc-200 placeholder:text-zinc-500"
            />

            <Button
              className="w-full bg-zinc-200 text-black font-semibold rounded-xl hover:bg-white transition"
              onClick={handleConnect}
              disabled={loading}
            >
              {loading ? "Connecting..." : "Connect"}
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
