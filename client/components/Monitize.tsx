'use client'

import { useRef , useEffect, useState} from 'react'
import { motion, useInView } from 'framer-motion'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { useUser } from "@clerk/nextjs"

const Monitize = () => {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.4 })
  const { user } = useUser()
  const [users, setUsers] = useState([])

  useEffect(() => {
    const fetchVideos = async () => {
      if (!user?.primaryEmailAddress?.emailAddress) return
      const email = user.primaryEmailAddress.emailAddress
  
        try {
          const res = await fetch(`https://cravio-ai.onrender.com/user/${email}`)
          const data = await res.json()
          setUsers(data.email)
        } catch (error) {
          console.error('Error fetching videos:', error)
        } 
      }
      
      if (user) {
        fetchVideos()
      }
    }, [user])

  return (
    <section ref={ref} className="h-screen flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="max-w-3xl text-center space-y-10"
      >
        {/* Text Content */}
        <div>
          <h2 className="text-4xl md:text-5xl font-semibold tracking-tight">
            {users.length > 0 && `${users}+ Creators Trust Cravio Ai`}
          </h2>
          <p className="mt-4 text-muted-foreground text-lg md:text-xl">
            Creators are making <span className=" font-semibold">$10,000+/month</span> using our AI-powered faceless content clip generator.
            All you need is an idea — we handle the rest.
          </p>
        </div>

        {/* TikTok Balance Image in Card */}
        <Card className="max-w-3xl mx-auto  rounded-2xl ">
          <CardContent >
            <Image
              src="/tiktok-sample.jpg" // Make sure this image exists in your public folder
              alt="TikTok Balance Screenshot"
              width={600}
              height={300}
              className="rounded-2xl w-full object-cover"
            />
          </CardContent>
        </Card>
      </motion.div>
    </section>
  )
}

export default Monitize
