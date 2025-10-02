"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles, Camera, Video, Users, TrendingUp, DollarSign } from "lucide-react";

// shadcn/ui imports (adjust paths if your project uses different locations)
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const steps = [
  {
    id: 1,
    title: "Create Persona",
    desc: "Create a consistent AI persona: 10–20 curated reference images.",
    icon: <Sparkles className="w-6 h-6" />,
  },
  {
    id: 2,
    title: "Generate Consistent Images",
    desc: "Use your persona to create a steady stream of high-fidelity, identity-consistent images for posts and reels.",
    icon: <Camera className="w-6 h-6" />,
  },
  {
    id: 3,
    title: "Create Exclusive Videos (OPUS)",
    desc: "Produce premium short-form and long-form videos using OPUS engines: Veo3, Wan, Hailou, Kling.",
    icon: <Video className="w-6 h-6" />,
  },
  {
    id: 4,
    title: "Monetize Exclusive Content",
    desc: "Sell content on Fanvue / OnlyFans. Offer tiered subscriptions ($9.99/m), bundles, Tips and limited drops.",
    icon: <Users className="w-6 h-6" />,
  },
  {
    id: 5,
    title: "Grow Organic Reach",
    desc: "Build Instagram presence with reels, cross-promos, and storytelling. Use micro-influencer collabs and CTA-driven bios.",
    icon: <TrendingUp className="w-6 h-6" />,
  },
  {
    id: 6,
    title: "Scale to 6–7 Figures MRR",
    desc: "Optimize funnels, convert free followers to paid fans, run paid acquisition and scale operations — repeat profitable offers.",
    icon: <DollarSign className="w-6 h-6" />,
  },
];

export default function PlaybookPage(): JSX.Element {
  return (
    <main className="min-h-screen text-surface-1 relative overflow-hidden bg-[#060606] text-zinc-100 p-8">
      {/* prime glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-40"
        style={{
          background: 'radial-gradient(600px 300px at 10% 10%, rgba(176,141,87,0.12), transparent), radial-gradient(500px 250px at 90% 80%, rgba(176,141,87,0.08), transparent)'
        }}
      />

      <section className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-semibold leading-tight">Mellvitta AI Creator Playbook</h1>
            <p className="mt-2 text-muted-foreground max-w-2xl">Turn one consistent AI persona into a premium, revenue-driving creator brand.</p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/admin/pricing" className="inline-flex items-center gap-2">
                  <span>Claim 50% — code</span>
                  <strong className="ml-2">MELL50</strong>
                </Link>
              </Button>

            </div>
          </div>

          <div className="hidden md:block">
            <Card className="w-[360px] backdrop-blur border border-neutral-800/30">
              <CardHeader>
                <CardTitle>LIMITED TIME OFFER</CardTitle>
                <CardDescription>50% off first 100 Creators — use <strong>MELL50</strong></CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm">Persona 4+</div>
                  <div className="text-sm">Images 200+</div>
                  <div className="text-sm">videos 10+</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* steps */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
          {steps.map((s, idx) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.06 }}
              className="rounded-2xl p-4 border border-zinc-800 backdrop-blur"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-black/30 to-black/10">
                  {s.icon}
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{s.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground max-w-xl">{s.desc}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* PEU quick how-to */}
        <section className="mt-10">
          <Card className="p-6 border border-neutral-800/40 backdrop-blur">
            <CardHeader>
              <CardTitle>Quick Guide</CardTitle>
              <CardDescription>Simple, repeatable offer structure that converts.</CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal list-inside mt-3 space-y-2 text-sm text-muted-foreground">
                <li>Step 1: Create Persona (Consistency)</li>
                <li>Step 2: Grow Organic Reach (Instagram)</li>
                <li>Step 3: Monetize Exclusive Content (Fanvue / OnlyFans)</li>
                <li>Step 4: Track LTV & CAC to scale to 6–7 figures</li>
                <li>Step 5: Repeat</li>
              </ol>

              <div className="mt-4 flex flex-wrap gap-3">
              <Button variant="outline" className="bg-gradient-to-r from-[#E5C88C] via-[#B08D57] to-[#A47A3E] text-black px-8 py-4 rounded-2xl font-medium text-lg shadow-2xl shadow-amber-500/25 hover:shadow-amber-500/40 transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 border border-amber-400/20">
                <Link href="/admin/pricing">Redeem MELL50 — 50% OFF</Link>
              </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        <footer className="mt-12 mb-20 text-sm text-muted-foreground">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="font-medium">Need help?</div>
            </div>

            <div className="flex gap-3">
              <Button asChild>
                <Link href="mailto:mellvitta.ai@gmail.com">Contact Us</Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link href="/terms">Terms of Service</Link>
              </Button>
            </div>
          </div>
        </footer>
      </section>
    </main>
  );
}
