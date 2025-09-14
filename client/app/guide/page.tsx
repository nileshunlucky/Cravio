"use client";

import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Step = {
  id: number;
  title: string;
  description: string;
  tips?: string[];
};

const PRIMARY = "#B08D57";
const PRIMARY_LIGHT = "#D6BFA3";

const steps: Step[] = [
  {
    id: 1,
    title: "Sign up free",
    description:
      "Create your Mellvitta account. This unlocks the studio where you create and manage AI personas.",
    tips: ["Use your creator email", "Verify for faster withdrawals"],
  },
  {
    id: 2,
    title: "Create your persona (Face Model)",
    description:
      "Upload 10–20 high-quality, well-lit images of the face you want the persona to use. Aim for consistent angles, neutral expressions, and clear eyes.",
    tips: [
      "Mix close-ups and half-body shots",
      "Avoid heavy filters — clean, natural images work best",
    ],
  },
  {
    id: 3,
    title: "Pick poses on Explore",
    description:
      "Choose a pose template from Explore. Each pose has an exact prompt you can reuse so generated images match the pose precisely.",
    tips: [
      "Select 'Exclusive' to reserve a pose for paid drops",
      "Copy the prompt to guarantee pose consistency across images",
    ],
  },
  {
    id: 4,
    title: "Generate videos",
    description:
      "Produce short videos using integrated engines (veo3, kling, wan, hailou). Use your persona to create clips for reels, stories and ads.",
    tips: ["Start with Text to Video, Image to Video", "Use hook in first 3 seconds"],
  },
  {
    id: 5,
    title: "Grow the AI influencer",
    description:
      "Post consistently on Instagram & TikTok. Use the persona across posts, reels, and collaborations to build a recognizable brand.",
    tips: ["Batch-produce content", "Engage via comments and DMs"],
  },
  {
    id: 6,
    title: "Monetize exclusive content",
    description:
      "Sell exclusive images and videos on creator platforms like OnlyFans or Fanvue. Offer tiers (monthly, per-drop) and exclusive pose drops.",
    tips: [
      "Offer early-access for subscribers",
      "Bundle image packs + behind-the-scenes video",
    ],
  },
];

export default function Page() {
  return (
    <div className="min-h-screen w-full overflow-x-hidden my-5">
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-12">
        {/* ===== HERO ===== */}
        <div className="mb-8 sm:mb-12">
          {/* Mobile layout */}
          <div className="block lg:hidden">
            <motion.h1
              initial={{ y: -6, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.45 }}
              className="text-2xl font-semibold leading-tight tracking-tight sm:text-3xl"
            >
              Build & Monetize Your <span className="bg-gradient-to-r from-[#B08D57] to-[#D6BFA3] bg-clip-text text-transparent">AI Influencer</span>
            </motion.h1>

            <motion.p
              initial={{ y: -4, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.05 }}
              className="mt-3 text-sm opacity-80 sm:text-base"
            >
              Use Mellvitta AI to create a consistent, premium AI persona that
              posts images & videos, grows an audience and sells exclusive
              content.
            </motion.p>

            <div className="mt-6 space-y-3">
              <a
                href="https://mellvitta.com/admin/explore"
                target="_blank"
                rel="noreferrer"
                className="block"
              >
                <Button
                  className="w-full rounded-2xl px-5 py-3 shadow-md"
                  style={{
                    background: `linear-gradient(90deg, ${PRIMARY} 0%, ${PRIMARY_LIGHT} 100%)`,
                    border: "1px solid rgba(255,255,255,0.04)",
                  }}
                >
                  Start Mellvitta
                </Button>
              </a>
              <div className="text-center">
                <a
                  href="#learn-more"
                  className="text-sm underline opacity-80"
                >
                  Learn how it works
                </a>
              </div>
            </div>

            {/* --- Video preview card (mobile) --- */}
            <motion.div
              initial={{ scale: 0.98, opacity: 0.6 }}
              animate={{ scale: 1, opacity: 1 }}
              className="mt-8"
            >
              <Card className="rounded-2xl border border-white/6 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Demo Video</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative w-full overflow-hidden rounded-xl border border-white/10">
                    <video
                      src="https://res.cloudinary.com/dxpydoteo/video/upload/v1757766084/Mellvitta_UGC_dn5dfb.mp4"
                      controls
                      className="w-full h-auto"
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Desktop layout */}
          <div className="hidden lg:flex lg:items-start lg:justify-between lg:gap-8">
            <div className="flex-1">
              <motion.h1
                initial={{ y: -6, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.45 }}
                className="text-4xl font-semibold leading-tight tracking-tight"
              >
                Build & Monetize Your AI Influencer
              </motion.h1>

              <motion.p
                initial={{ y: -4, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.05 }}
                className="mt-3 max-w-lg text-base opacity-80"
              >
                Use Mellvitta AI to create a consistent, premium AI persona that
                posts images & videos, grows an audience and sells exclusive
                content.
              </motion.p>

              <div className="mt-6 flex items-center gap-4">
                <a
                  href="https://mellvitta.com/admin/explore"
                  target="_blank"
                  rel="noreferrer"
                >
                  <Button
                    className="rounded-2xl px-5 py-3 shadow-md"
                    style={{
                      background: `linear-gradient(90deg, ${PRIMARY} 0%, ${PRIMARY_LIGHT} 100%)`,
                      border: "1px solid rgba(255,255,255,0.04)",
                    }}
                  >
                    Start Mellvitta — Free
                  </Button>
                </a>
                <a
                  href="#learn-more"
                  className="text-sm underline opacity-80"
                >
                  Learn how it works
                </a>
              </div>
            </div>

            {/* --- Video preview card (desktop) --- */}
            <motion.div
              initial={{ scale: 0.98, opacity: 0.6 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-72 flex-shrink-0"
            >
              <Card className="rounded-2xl border border-white/6 backdrop-blur-sm p-4">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Demo Video</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative w-full overflow-hidden rounded-xl border border-white/10">
                    <video
                      src="https://res.cloudinary.com/dxpydoteo/video/upload/v1757766084/Mellvitta_UGC_dn5dfb.mp4"
                      controls
                      className="w-full h-auto"
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>

        {/* ===== STEPS ===== */}
        <div id="learn-more" className="space-y-4 sm:space-y-6">
          {steps.map((step) => (
            <motion.div
              key={step.id}
              initial={{ y: 8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: step.id * 0.03 }}
              className="rounded-2xl border border-white/6 p-4 sm:p-6"
            >
              <div className="flex gap-4">
                <div
                  className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl"
                  style={{
                    background: `linear-gradient(135deg, ${PRIMARY}22 0%, ${PRIMARY_LIGHT}11 100%)`,
                    border: "1px solid rgba(255,255,255,0.03)",
                  }}
                >
                  <span className="text-sm font-semibold">{step.id}</span>
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="text-lg font-medium">{step.title}</h3>
                  <p className="mt-2 text-sm opacity-85">{step.description}</p>

                  {step.tips && (
                    <ul className="mt-3 ml-3 list-disc space-y-1 text-xs opacity-80">
                      {step.tips.map((tip, i) => (
                        <li key={i}>{tip}</li>
                      ))}
                    </ul>
                  )}

                  {step.id === 3 && (
                    <div className="mt-4 text-xs">
                      <div className="mb-2 font-medium">Exact pose prompt (example):</div>
                      <div className="overflow-x-auto rounded-md border border-white/4 bg-white/3 p-3">
                        <pre className="whitespace-pre-wrap text-xs">
{`"a blonde woman with long wavy hair cooking in a luxury kitchen, wearing a black bikini, visible thigh tattoo, confident pose, natural daylight, white cabinetry, marble countertops, stainless steel appliances..."`}
                        </pre>
                      </div>
                    </div>
                  )}

                  {step.id === 4 && (
                    <div className="mt-4 text-xs">
                      <div className="mb-2 font-medium">Video engines we recommend:</div>
                      <div className="flex flex-wrap gap-2">
                        {["veo3", "kling", "wan", "hailou"].map((engine) => (
                          <span
                            key={engine}
                            className="rounded-full border border-white/6 px-2 py-1 text-xs opacity-90"
                          >
                            {engine}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}

          {/* Best Practices */}
          <Card className="rounded-2xl border border-white/6 p-4 sm:p-6">
            <CardHeader className="pb-3 sm:pb-4">
              <CardTitle className="text-base">Best practices</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="ml-4 list-disc space-y-2 text-sm opacity-85">
                <li>Keep persona identity consistent — reuse the same persona for all drops.</li>
                <li>Batch-generate content: create 10–20 images and 3–5 short clips weekly.</li>
                <li>Reserve exclusive poses for paid subscribers to increase conversions.</li>
                <li>Use clear CTAs on Instagram/TikTok: link to a landing page that funnels to your subscription platform.</li>
              </ul>
            </CardContent>
          </Card>

          {/* Footer CTA */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1">
              <h4 className="text-lg font-medium">
                Ready to build your AI influencer?
              </h4>
              <p className="text-sm opacity-80">
                Sign up, create a persona, and start monetizing with Mellvitta
                today.
              </p>
            </div>
            <div className="flex-shrink-0">
              <a
                href="https://mellvitta.com/admin/explore"
                target="_blank"
                rel="noreferrer"
                className="block"
              >
                <Button
                  className="w-full rounded-2xl px-6 py-3 shadow-lg sm:w-auto"
                  style={{
                    background: `linear-gradient(90deg, ${PRIMARY} 0%, ${PRIMARY_LIGHT} 100%)`,
                    border: "1px solid rgba(255,255,255,0.04)",
                  }}
                >
                  Create Mellvitta
                </Button>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
