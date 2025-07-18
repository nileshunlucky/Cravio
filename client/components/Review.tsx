'use client'

import React, { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import Image from 'next/image'

const testimonials = [
  {
    name: 'Sarah Chen',
    role: 'Fashion Muse & Digital Tastemaker',
    quote:
      "Cravio.AI became my secret to visual consistency. Every post feels editorial — my Instagram feed has never looked more polished.",
    avatar: '/review/ash-allen.jpeg',
    subscribers: '2.3M',
  },
  {
    name: 'Marcus Rodriguez',
    role: 'Luxury Lifestyle Influencer',
    quote:
      "From concept to curation — Cravio understands the nuance of high-end visuals. It elevated my personal brand instantly.",
    avatar: '/review/alex-george.webp',
    subscribers: '1.8M',
  },
  {
    name: 'Emma Thompson',
    role: 'Runway Model & Content Aesthete',
    quote:
      "Consistency is everything. Cravio crafts flawless, on-brand images that mirror the elegance I demand from every shoot.",
    avatar: '/review/Laurence Vincent.jpg',
    subscribers: '950K',
  },
  {
    name: 'David Park',
    role: 'Visual Curator & Creator',
    quote:
      "Cravio feels like having an elite creative director on demand. Every image aligns with my vision — seamlessly and fast.",
    avatar: '/review/Ishan Sharma.jpg',
    subscribers: '1.4M',
  },
  {
    name: 'Jessica Williams',
    role: 'High Fashion Content Creator',
    quote:
      "Scroll-stopping visuals with couture-level quality. Cravio turned my content into a luxury experience.",
    avatar: '/review/Louis Dershal.png',
    subscribers: '3.2M',
  },
  {
    name: 'Taylor Brooks',
    role: 'Beauty Model & Aesthetic Strategist',
    quote:
      "Cravio makes my content feel intentional, elevated, and visually iconic — without needing a production team.",
    avatar: '/review/Rose Delvard..png',
    subscribers: '680K',
  },
]


const Review = () => {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.3 })

  return (
    <section ref={ref} className="px-6 py-20 bg-gradient-to-b from-background to-background/50">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="max-w-6xl mx-auto space-y-12"
      >
        <div className="text-center space-y-4">
  <h2 className="text-4xl font-bold">
    Experience the Artistry of{' '}
    <span
      className="underline decoration-2 underline-offset-4"
      style={{ textDecorationColor: '#B08D57' }}
    >
      Cravio.AI
    </span>
  </h2>
  <p className="text-lg text-[#B08D57]">
    Where refined expression meets curated intelligence. Designed for the aesthetically astute.
  </p>
</div>


        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((t, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{
                duration: 0.5,
                delay: idx * 0.1,
                ease: 'easeOut'
              }}
            >
              <Card className="rounded-2xl border border-border/50 p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-[#B08D57]/30 bg-card/80 backdrop-blur-sm">
                <CardContent className="p-0 space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Image
                        src={t.avatar}
                        alt={t.name}
                        width={48}
                        height={48}
                        className="rounded-full object-cover ring-2 ring-[#B08D57]/20"
                      />
                      <div
                        className="absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-background"
                        style={{ backgroundColor: '#B08D57' }}
                      ></div>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">{t.name}</p>
                      <p className="text-sm text-muted-foreground">{t.role}</p>
                    </div>
                    {t.subscribers && (
                      <span
                        className="text-xs px-3 py-1 rounded-full font-medium border"
                        style={{
                          backgroundColor: '#B08D57/10',
                          borderColor: '#B08D57/30',
                          color: '#B08D57'
                        }}
                      >
                        {t.subscribers}
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <div
                      className="absolute left-0 top-0 w-1 h-full rounded-full opacity-60"
                      style={{ backgroundColor: '#B08D57' }}
                    ></div>
                    <p className="text-sm text-muted-foreground leading-relaxed pl-4">
                      &ldquo;{t.quote}&rdquo;
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  )
}

export default Review