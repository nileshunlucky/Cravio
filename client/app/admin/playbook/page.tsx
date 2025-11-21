"use client";

import React from "react";
import Link from "next/link";

// shadcn/ui imports (adjust paths if your project uses different locations)
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";


export default function PlaybookPage() {
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
            <h1 className="text-4xl md:text-5xl font-semibold leading-tight">Mellvitta AI Influencer Playbook</h1>
            <p className="mt-2 text-muted-foreground max-w-2xl">Turn one consistent AI Influencer into a premium, $10,000 MRR revenue by exclusive content without showing your face.</p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild>
                <a href="/Mellvitta AI Playbook.pdf" className="inline-flex items-center gap-2">
                  <span>Claim Playbook</span>
                </a>
              </Button>

            </div>
          </div>
        </div>

        {/* PEU quick how-to */}
        <section className="mt-10">
          <Card className="p-2 py-5 md:p-6 border border-neutral-800/40 backdrop-blur">
            <CardHeader>
              <CardTitle>Quick Guide</CardTitle>
              <CardDescription>Simple, repeatable offer structure that converts.</CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal list-inside mt-3 space-y-2 text-sm text-muted-foreground">
                <li>Step 1: Create AI Influencer (Consistency)</li>
                <li>Step 2: Grow Organic Reach (Instagram)</li>
                <li>Step 3: Monetize Exclusive Content (Fanvue)</li>
                <li>Step 4: Track LTV & CAC to scale to 6–7 figures</li>
                <li>Step 5: Repeat</li>
              </ol>

              <div className="mt-4 flex flex-wrap gap-3">
              <Button variant="outline" className="bg-gradient-to-r from-[#E5C88C] via-[#B08D57] to-[#A47A3E] text-black p-4 rounded-xl font-medium text-lg shadow-2xl shadow-amber-500/25 hover:shadow-amber-500/40 transform transition-all duration-300 border border-amber-400/20">
                <a href="/Mellvitta AI Playbook.pdf">FREE Playbook + 50% Discount</a>
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
