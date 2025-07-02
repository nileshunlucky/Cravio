'use client'

import React, { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import Image from 'next/image'

const testimonials = [
  {
    name: 'Sarah Chen',
    role: 'YouTube Creator & Designer',
    quote:
      "Cravio AI completely transformed my thumbnail game. I went from spending hours in Photoshop to generating stunning thumbnails in seconds.",
    avatar: '/review/ash-allen.jpeg',
    subscribers: '2.3M',
  },
  {
    name: 'Marcus Rodriguez',
    role: 'Content Strategy Consultant',
    quote:
      'As someone who manages 15+ YouTube channels, Cravio AI is a lifesaver. The AI understands what makes thumbnails click-worthy.',
    avatar: '/review/alex-george.webp',
    subscribers: '1.8M',
  },
  {
    name: 'Emma Thompson',
    role: 'Thumbnail Design Specialist',
    quote:
      "The AI generates thumbnails that actually convert. My clients' CTR improved by 40% on average after switching to Cravio.",
    avatar: '/review/Laurence Vincent.jpg',
    subscribers: '950K',
  },
  {
    name: 'David Park',
    role: 'YouTube Growth Expert',
    quote:
      "I was skeptical about AI thumbnails, but Cravio's results speak for themselves. It's like having a design team in your pocket.",
    avatar: '/review/Ishan Sharma.jpg',
    subscribers: '1.4M',
  },
  {
    name: 'Jessica Williams',
    role: 'Digital Marketing Coach',
    quote:
      "Cravio AI doesn't just make thumbnails—it creates attention-grabbing visuals that stop the scroll. My engagement is through the roof!",
    avatar: '/review/Louis Dershal.png',
    subscribers: '3.2M',
  },
  {
    name: 'Taylor Brooks',
    role: 'Brand Visual Strategist',
    quote:
      'The quality is incredible and the speed is unmatched. Cravio AI helped me scale my thumbnail creation process 10x faster.',
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
            See why creators love{' '}
            <span
              className="underline decoration-2 underline-offset-4"
              style={{ textDecorationColor: '#47FFE7' }}
            >
              Cravio AI
            </span>
          </h2>
          <p className=" text-lg text-[#47FFE&]">
            Revolutionizing thumbnail creation with AI. Real stories from real creators.
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
              <Card className="rounded-2xl border border-border/50 p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-[#47FFE7]/30 bg-card/80 backdrop-blur-sm">
                <CardContent className="p-0 space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Image
                        src={t.avatar}
                        alt={t.name}
                        width={48}
                        height={48}
                        className="rounded-full object-cover ring-2 ring-[#47FFE7]/20"
                      />
                      <div
                        className="absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-background"
                        style={{ backgroundColor: '#47FFE7' }}
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
                          backgroundColor: '#47FFE7/10',
                          borderColor: '#47FFE7/30',
                          color: '#47FFE7'
                        }}
                      >
                        {t.subscribers}
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <div
                      className="absolute left-0 top-0 w-1 h-full rounded-full opacity-60"
                      style={{ backgroundColor: '#47FFE7' }}
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