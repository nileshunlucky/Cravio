"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { Lock, Key, ShieldCheck, LoaderCircle } from "lucide-react";

export default function Home() {
  const { user } = useUser();
  const email = user?.emailAddresses?.[0]?.emailAddress || "";

  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!email) return;
    fetch(`https://cravio-ai.onrender.com/user/${email}`)
      .then((res) => res.ok && res.json())
      .then((data) => {
        if (!data) return;
        setApiKey(data?.binance_api_key ?? "");
        setApiSecret(data?.binance_api_secret ?? "");
      })
      .catch(console.error);
  }, [email]);

  const handleConnect = async () => {

    setLoading(true);
    try {
    if (!email) {
      toast.error("Login required");
      return;
    }

    if (!apiKey || !apiSecret) {
      if (!apiKey && !apiSecret) {
        toast.error("API Key and Secret are required");
      } else if (!apiKey) {
        toast.error("API Key is missing");
      } else {
        toast.error("API Secret is missing");
      }
      return;
    }
      const form = new FormData();
      form.append("apiKey", apiKey);
      form.append("apiSecret", apiSecret);
      form.append("email", email);

      const res = await fetch(
        "https://cravio-ai.onrender.com/api/binance/connect",
        { method: "POST", body: form }
      );

      const data = await res.json();
      toast(data.message);
    } catch {
      toast.error("Connection failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh flex items-center justify-center bg-black px-4 sm:px-6 relative overflow-hidden">
      {/* background glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 via-transparent to-amber-500/5" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="relative z-10 w-full flex justify-center"
      >
        <Card className="w-full max-w-[420px] bg-zinc-950/85 backdrop-blur-xl border border-zinc-800 rounded-2xl shadow-2xl">
          <CardHeader className="space-y-3 px-5 sm:px-6 pt-6">
            <div className="flex items-center justify-center gap-2 text-yellow-400">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/5/57/Binance_Logo.png"
                alt="Binance"
                className="w-6 h-6 object-contain"
              />
              <h1 className="text-lg sm:text-xl font-semibold">
                Binance Secure Connect
              </h1>
            </div>

            <p className="text-center text-xs sm:text-sm text-zinc-400 leading-relaxed">
              Securely connect your Binance account.
              <br className="hidden sm:block" />
              We never withdraw funds.
            </p>
          </CardHeader>

          <CardContent className="px-5 sm:px-6 pb-6 space-y-4">
            {/* API KEY */}
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <Input
                placeholder="Binance API Key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="h-11 sm:h-12 pl-10 bg-zinc-900 border-zinc-800 text-zinc-200 rounded-xl"
              />
            </div>

            {/* API SECRET */}
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <Input
                placeholder="Binance API Secret"
                type="password"
                value={apiSecret}
                onChange={(e) => setApiSecret(e.target.value)}
                className="h-11 sm:h-12 pl-10 bg-zinc-900 border-zinc-800 text-zinc-200 rounded-xl"
              />
            </div>

            {/* BUTTON */}
            <Button
              onClick={handleConnect}
              disabled={loading}
              className="w-full h-11 sm:h-12 rounded-xl font-semibold text-black bg-gradient-to-r from-yellow-400 to-amber-400 hover:opacity-90 active:scale-[0.99] transition"
            >
              {loading ? (
                <LoaderCircle className="w-4 h-4 animate-spin" />
              ) : (
                "Connect Binance"
              )}
            </Button>

            {/* FOOTER */}
            <div className="flex items-center justify-center gap-2 pt-1 text-xs text-zinc-500">
              <ShieldCheck className="w-4 h-4" />
              Encrypted & Read-Only Access
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
