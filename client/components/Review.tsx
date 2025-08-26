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
    quote: "Just started using this last week to create my first AI influencer. Pretty cool seeing people actually chat with my AI and subscribe to the content.",
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
  const isInView = useInView(ref, { once: true, amount: 0.2 })

  return (
    <section ref={ref} className="w-full overflow-hidden px-4 sm:px-6 py-16 sm:py-24 bg-gradient-to-b from-background to-background/50">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="max-w-7xl mx-auto"
      >
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
            Creators Love{' '}
            <span className="underline decoration-2 underline-offset-4 sm:underline-offset-8 decoration-[#B08D57]">
              Mellvitta.ai
            </span>
          </h2>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{
                duration: 0.5,
                delay: index * 0.1,
                ease: 'easeOut'
              }}
              className="w-full"
            >
              <Card className="h-full rounded-2xl sm:rounded-3xl border border-border/50 p-6 sm:p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-[#B08D57]/30 bg-card/80 backdrop-blur-sm">
                <CardContent className="p-0 h-full flex flex-col gap-4 sm:gap-6">
                  {/* User Info */}
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="relative flex-shrink-0">
                      <img
                        src={testimonial.avatar}
                        alt={`${testimonial.name} avatar`}
                        className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl object-cover ring-2 ring-[#B08D57]/20"
                      />
                      <div className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-[#B08D57] rounded-full border-2 border-background"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-foreground text-base sm:text-lg truncate">
                        {testimonial.name}
                      </p>
                      <p className="text-muted-foreground text-sm sm:text-base truncate">
                        {testimonial.role}
                      </p>
                    </div>
                  </div>

                  {/* Quote */}
                  <div className="relative flex-1">
                    <div className="absolute left-0 top-0 w-1 h-full bg-[#B08D57]/60 rounded-full"></div>
                    <blockquote className="text-muted-foreground leading-relaxed pl-4 sm:pl-6 text-sm sm:text-base lg:text-lg">
                      "{testimonial.quote}"
                    </blockquote>
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