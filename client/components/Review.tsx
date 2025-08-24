'use client'

import React, { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'

const testimonials = [
  {
    name: 'Sarah Mitchell',
    role: 'Content Creator',
    quote: "The AI handles all the subscriber chats while I work on my main job. Great passive income setup - way better than my previous attempts at content creation.",
    avatar: '/review/ash-allen.jpeg',
  },
  {
    name: 'Jake Thompson',
    role: 'AI Influencer Manager',
    quote: "Just started using this last week to create my first AI influencer. Pretty cool seeing people actually chat with my AI and subscribe to the content. The automated interactions give me more time to plan out the growth strategy.",
    avatar: '/review/alex-george.webp',
  },
  {
    name: 'Maria Garcia',
    role: 'Multi-Niche Creator',
    quote: "Started with a gaming AI influencer, now managing three different niches. Each has its own community, and the platform handles all the interactions automatically.",
    avatar: '/review/Laurence Vincent.jpg',
  },
  {
    name: 'Alex Chen',
    role: 'Fitness Content Creator',
    quote: "Created a fitness influencer that connects well with the audience. The AI keeps conversations natural and my subscribers seem to enjoy the personalized workout tips.",
    avatar: '/review/Ishan Sharma.jpg',
  },
  {
    name: 'David Wilson',
    role: 'Tech Reviewer',
    quote: "Running my tech review AI account is pretty straightforward. Subscribers get quick responses about gadget recommendations, and I'm seeing steady growth in followers.",
    avatar: '/review/Louis Dershal.png',
  },
  {
    name: 'Emma Rodriguez',
    role: 'Digital Entrepreneur',
    quote: "The automated chat system is a game-changer. My AI influencer maintains consistent engagement while I focus on content strategy and growing my other business ventures.",
    avatar: '/review/Rose Delvard..png',
  },
]

const Review = () => {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.3 })

  return (
    <section ref={ref} className="px-6 py-24 bg-gradient-to-b from-background to-background/50">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="max-w-7xl mx-auto space-y-16"
      >
        <div className="text-center space-y-6">
        
          <h2 className="text-5xl md:text-6xl font-bold">
            
Creators Love{' '}
            <span
              className="underline decoration-2 underline-offset-8"
              style={{ textDecorationColor: '#B08D57' }}
            >
              Mellvitta.ai
            </span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
              <Card className="h-full rounded-3xl border border-border/50 p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-[#B08D57]/30 bg-card/80 backdrop-blur-sm">
                <CardContent className="p-0 space-y-6 h-full flex flex-col">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <img
                        src={t.avatar}
                        alt={t.name}
                        className="w-16 h-16 rounded-2xl object-cover ring-2 ring-[#B08D57]/20"
                      />
                      <div
                        className="absolute -top-1 -right-1 w-5 h-5 rounded-full border-2 border-background"
                        style={{ backgroundColor: '#B08D57' }}
                      ></div>
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-foreground text-lg">{t.name}</p>
                      <p className="text-muted-foreground">{t.role}</p>
                    </div>
                  </div>
                  <div className="relative flex-1">
                    <div
                      className="absolute left-0 top-0 w-1 h-full rounded-full opacity-60"
                      style={{ backgroundColor: '#B08D57' }}
                    ></div>
                    <p className="text-muted-foreground leading-relaxed pl-6 text-lg">
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