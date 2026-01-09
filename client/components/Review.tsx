'use client'

import React, { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import Image from 'next/image'

const testimonials = [
  {
    name: 'ishowspeed',
    role: 'No.1 Streamer in the world',
    quote:
      "I clipped myself at begining at my prime, man. Seriously Mellvitta is the tool I wish I had when I started.",
    avatar: '/review/ishowspeed.webp',
    subscribers: '47.5M',
  },
  {
    name: 'MrBeast',
    role: 'No.1 Youtuber in the world',
    quote:
      'After running multiple channels with over 100+ million subscribers, I can Scale more viral content using Mellvitta.',
    avatar: '/review/beast.jpg',
    subscribers: '459M',
  },
  {
    name: 'Iman Gadzhi',
    role: 'No.1 Personal Brand in the world',
    quote:
      "Mellvitta actually feels like a cheat code. I can legitimately make more clips in less time.",
    avatar: '/review/iman.jpg',
    subscribers: '5.87M',
  }
]

const Review = () => {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.3 })

  return (
    <section ref={ref} className="px-6 py-20 ">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="max-w-6xl mx-auto space-y-12"
      >
        <div className="text-center space-y-4">
          <h2 className="text-4xl font-bold">See why creators love <span className='underline'>Mellvitta</span></h2>
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
                    className="rounded-full object-cover w-10 h-10"
                    width={40}
                    height={40}
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
                <p className="text-sm text-gray-500 leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.div>
    </section>
  )
}

export default Review
