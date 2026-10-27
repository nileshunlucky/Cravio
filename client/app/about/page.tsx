'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Video, Zap, Scissors, Sparkles } from 'lucide-react'

const AboutPage = () => {
  const handleBack = () => {
    if (typeof window !== 'undefined') {
      window.history.back()
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-20">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full max-w-3xl"
      >
        <Card className="border border-muted shadow-md rounded-xl">
          <CardContent className="px-8 py-10 space-y-6">
            {/* Back Button */}
            <Button variant="outline" onClick={handleBack}>
              &larr; Back
            </Button>

            <h1 className="text-3xl font-bold">About Mellvitta</h1>
            <p className="text-muted-foreground text-lg">
              Mellvitta is an AI-powered video editing and clipping software engineered to transform hours of long-form video content into engaging, short-form viral clips in just minutes.
            </p>

            <h2 className="text-xl font-semibold">Our Mission</h2>
            <p className="text-muted-foreground text-lg">
              We empower creators, podcasters, educators, and marketers to scale their content effortlessly. Editing long videos manually takes hours—Mellvitta automates the tedious work so you can focus on building your audience.
            </p>

            <h2 className="text-xl font-semibold">Why Choose Mellvitta?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 border rounded-lg space-y-2">
                <div className="flex items-center space-x-2 font-semibold text-lg">
                  <Scissors className="h-5 w-5 text-muted-foreground" />
                  <span>Smart Clipping</span>
                </div>
                <p className="text-muted-foreground text-sm">
                  Automatically detects key moments, highlights, and engaging hooks from long-form media.
                </p>
              </div>

              <div className="p-4 border rounded-lg space-y-2">
                <div className="flex items-center space-x-2 font-semibold text-lg">
                  <Zap className="h-5 w-5 text-muted-foreground" />
                  <span>Fast Processing</span>
                </div>
                <p className="text-muted-foreground text-sm">
                  Turn hours of raw footage into ready-to-post short clips within a matter of minutes.
                </p>
              </div>

              <div className="p-4 border rounded-lg space-y-2">
                <div className="flex items-center space-x-2 font-semibold text-lg">
                  <Sparkles className="h-5 w-5 text-muted-foreground" />
                  <span>AI Optimization</span>
                </div>
                <p className="text-muted-foreground text-sm">
                  Optimized framing, captions, and layout tailored for TikTok, Reels, and Shorts.
                </p>
              </div>

              <div className="p-4 border rounded-lg space-y-2">
                <div className="flex items-center space-x-2 font-semibold text-lg">
                  <Video className="h-5 w-5 text-muted-foreground" />
                  <span>Built for Scale</span>
                </div>
                <p className="text-muted-foreground text-sm">
                  Maximize your reach across channels without spending countless hours in traditional editors.
                </p>
              </div>
            </div>

            <footer className="mt-8 text-center text-sm text-muted-foreground">
              <p>&copy; {new Date().getFullYear()} Mellvitta. All rights reserved.</p>
            </footer>
          </CardContent>
        </Card>
      </motion.div>
    </main>
  )
}

export default AboutPage