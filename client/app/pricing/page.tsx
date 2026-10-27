"use client";

import React, { useState } from "react";
import Script from "next/script";
import { motion, useReducedMotion } from "framer-motion";
import { CircleCheck } from "lucide-react";
import { Button } from "@/components/ui/button";


type RazorpayInstance = {
  open: () => void;
  on: (event: string, callback: () => void) => void;
};

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => RazorpayInstance;
  }
}

const API_URL = "https://richacle.onrender.com/api/subscription/create-razorpay";

const features = [
  "Real time research",
  "Claude, GPT, Gemini, Grok, Deepseek usage",
  "Priority access to new feature",
  "Exclusive support",
];

const gradient = [
  "radial-gradient(60% 55% at 60% 0%, #ff8d88 0%, rgba(255,141,136,0) 70%)",
  "radial-gradient(42% 50% at 100% 0%, #c785f8 0%, rgba(199,133,248,0) 75%)",
  "radial-gradient(48% 38% at 100% 100%, #ff9993 0%, rgba(255,153,147,0) 70%)",
  "linear-gradient(180deg, #fde5e5 0%, #fbdcdc 100%)",
].join(", ");

type Status = "idle" | "loading" | "success";

const Page = () => {
  const reduce = useReducedMotion();
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  const handleSubscribe = async () => {
    // Read email (and optional name) from the URL: ?email=nilesh@gmail.com
    const params = new URLSearchParams(window.location.search);
    const email = params.get("email")?.trim();
    const name = params.get("name")?.trim() || undefined;

    if (!email) {
      setError("Email missing in the URL. Use ?email=you@example.com");
      return;
    }

    setError(null);
    setStatus("loading");

    try {
      // 1. Create the subscription on the backend
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail ?? "Could not start checkout.");

      // 2. Open Razorpay Checkout with the subscription
      const rzp = new window.Razorpay({
        key: data.keyId,
        subscription_id: data.subscriptionId,
        name: "Richacle",
        description: "Starter Plan - Monthly",
        prefill: { name: data.userName ?? "", email: data.userEmail },
        theme: { color: "#171717" },
        // Webhook activates the plan and credits; no client-side verify needed
        handler: () => {
  setStatus("success");
  // Give the webhook a few seconds to activate the plan before redirecting
  setTimeout(() => {
    window.location.href = "https://richacle.com/dashboard";
  }, 3000);
},
        modal: {
          ondismiss: () => setStatus((s) => (s === "success" ? s : "idle")),
        },
      });

      rzp.on("payment.failed", () => {
        setError("Payment failed. Please try again.");
        setStatus("idle");
      });

      rzp.open();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setStatus("idle");
    }
  };

  const buttonLabel =
    status === "loading"
      ? "Processing..."
      : status === "success"
        ? " Payment successful"
        : "Get Starter";

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#eceeef] p-4 font-sans antialiased sm:p-6">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      <motion.section
        initial={reduce ? false : { opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        aria-labelledby="plan-starter"
        className="w-full max-w-[300px] rounded-[28px] bg-white p-1.5 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.18)] sm:max-w-[480px] sm:rounded-[40px] sm:p-2.5"
      >
        {/* Gradient header */}
        <div
          className="rounded-[22px] px-5 pb-5 pt-5 sm:rounded-[32px] sm:px-9 sm:pb-9 sm:pt-9"
          style={{ background: gradient }}
        >
          <h2
            id="plan-starter"
            className="text-base font-semibold tracking-tight text-neutral-900 sm:text-[26px]"
          >
            Starter
          </h2>

          <div className="mt-5 flex items-end gap-1.5 sm:mt-9 sm:gap-2">
            <span className="text-[44px] font-extrabold leading-none tracking-tight text-neutral-950 sm:text-[84px]">
              ₹649
            </span>
            <span className="mb-1 text-[11px] font-medium text-neutral-700 sm:mb-2 sm:text-base">
              .99/monthly
            </span>
          </div>

          <p className="mt-3 max-w-[16em] text-[13px] leading-snug text-neutral-800 sm:mt-5 sm:text-[22px]">
            Best for Indian users that need affordable credits.
          </p>

          <motion.div
            className="mt-5 sm:mt-9"
            whileHover={reduce ? undefined : { scale: 1.015 }}
            whileTap={reduce ? undefined : { scale: 0.98 }}
          >
            <Button
              size="lg"
              onClick={handleSubscribe}
              disabled={status !== "idle"}
              className="h-11 w-full rounded-full bg-neutral-900 text-sm font-semibold text-white shadow-[0_10px_24px_-10px_rgba(0,0,0,0.5)] hover:bg-neutral-800 focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 disabled:opacity-70 sm:h-16 sm:text-xl"
            >
              {buttonLabel}
            </Button>
          </motion.div>

          {error && (
            <p role="alert" className="mt-3 text-center text-xs font-medium text-red-700 sm:text-base">
              {error}
            </p>
          )}
          {status === "success" && (
  <p role="status" className="mt-3 text-center text-xs font-medium text-neutral-800 sm:text-base">
    Redirecting to your dashboard...
  </p>
)}
        </div>

        {/* Features */}
        <ul className="space-y-3.5 px-4 pb-5 pt-5 sm:space-y-6 sm:px-9 sm:pb-9 sm:pt-8">
          {features.map((feature) => (
            <li key={feature} className="flex items-center gap-3 sm:gap-4">
              <CircleCheck
                className="size-[18px] shrink-0 text-neutral-600 sm:size-7"
                strokeWidth={1.75}
                aria-hidden="true"
              />
              <span className="text-[13px] leading-tight text-neutral-800 sm:text-xl">
                {feature}
              </span>
            </li>
          ))}
        </ul>
      </motion.section>
    </main>
  );
};

export default Page;