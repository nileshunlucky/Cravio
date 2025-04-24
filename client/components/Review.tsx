'use client'

import React, { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import Image from 'next/image'

const testimonials = [
  {
    name: 'Ash Allen',
    role: 'Video Editor for Top Creators',
    quote:
      "I've clipped for some of the biggest creators on the internet. Cravio is the tool I wish I had when I started.",
    avatar: '/review/ash-allen.jpeg',
    subscribers: '2B',
  },
  {
    name: 'Alex george',
    role: 'Channel Automation Expert',
    quote:
      'After running channels with over 1 million subscribers, I built Cravio to solve my own scaling problems.',
    avatar: '/review/alex-george.webp',
    subscribers: '2B',
  },
  {
    name: 'Laurence Vincent',
    role: 'YT Clipping Strategist',
    quote:
      "Cravio actually feels like a cheat code. I can legitimately make more videos in less time. You gotta try it.",
    avatar: '/review/Laurence Vincent.jpg',
    subscribers: '700K',
  },
  {
    name: 'Ishan Sharma.',
    role: 'Faceless Channel Creator',
    quote:
      "I was skeptical at first, but wow—this really works. Fast results, easy UI, and super reliable. Highly recommend!",
    avatar: '/review/Ishan Sharma.jpg',
    subscribers: '1.4M',
  },
  {
    name: 'Louis Dershal.',
    role: 'Online Business Couch',
    quote:
      "I'm honestly impressed! Cravio is probably the best investment I've made for growing my channels.",
    avatar: '/review/Louis Dershal.png',
    subscribers: '5.6M',
  },
  {
    name: 'Rose Delvard.',
    role: 'Content Repurposer',
    quote:
      'For real, Cravio made clipping so much easier. Now I feel like I could go viral every time I post.',
    avatar: '/review/Rose Delvard..png',
    subscribers: '850K',
  },
]

const Review = () => {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.3 })

  return (
    <section ref={ref} className="px-6 py-20 bg-white">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="max-w-6xl mx-auto space-y-12"
      >
        <div className="text-center space-y-4">
          <h2 className="text-4xl font-bold">See why creators love <span className='underline'>Cravio</span></h2>
          <p className="text-muted-foreground text-lg">
            Built by creators, for creators. Real stories from real users.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((t, idx) => (
            <Card key={idx} className="rounded-2xl border p-6 shadow-sm">
              <CardContent className="p-0 space-y-4">
                <div className="flex items-center gap-4">
                  <Image
                    src={t.avatar}
                    alt={t.name}
                    width={48}
                    height={48}
                    className="rounded-full object-cover"
                  />
                  <div>
                    <p className="font-semibold">{t.name}</p>
                    <p className="text-sm text-muted-foreground">{t.role}</p>
                  </div>
                  {t.subscribers && (
                    <span className="ml-auto text-xs bg-muted px-2 py-1 rounded-full text-muted-foreground font-medium">
                      {t.subscribers}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.div>
    </section>
  )
}

export default Review
