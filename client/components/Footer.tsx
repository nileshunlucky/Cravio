'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Instagram } from 'lucide-react'
import { motion } from 'framer-motion' // Import Framer Motion
import {
UserButton
} from '@clerk/nextjs'

const Footer = () => {
  const [creators, setCreators] = useState<number | null>(null)

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const res = await fetch(`https://cravio-ai.onrender.com/users-emails`)
        if (!res.ok) return
        const data = await res.json()
        setCreators(data.length)
      } catch (err) {
        console.error('Failed to fetch user data:', err)
      }
    }
    fetchUserData()
  }, [])

  // Framer Motion variants for smooth fade-in
  const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: 'easeOut' } },
  }

  return (
    <footer className="w-full">
      {/* --- Top Banner --- */}
      <motion.div
        className="w-full py-16 px-6 text-black flex items-start"
        style={{
          background: 'linear-gradient(135deg, #b08D57 0%, #d6bfa3 100%)',
        }}
        initial="hidden"
        animate="visible"
        variants={fadeUp}
      >
        <div className="max-w-7xl mx-auto space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold leading-snug max-w-4xl">
            ELEVATING AI CREATIVITY <br /> FOR MODERN INFLUENCER
          </h2>
          <p className="text-lg">
            Inspiration for {creators}+ visionary Influencer's <br /> and tastemakers
          </p>
        </div>
        <div className="flex md:hidden">
            <UserButton />
        </div>
      </motion.div>

      {/* --- Bottom Footer --- */}
      <motion.div
        className="border-t py-10 px-6 bg-black text-white"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, ease: 'easeInOut', delay: 0.3 }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-8">
          {/* Social Section */}
          <div className="space-y-3">
            <h4 className="text-lg font-semibold">Follow Us</h4>
            <Link href="https://www.instagram.com/mellvitta.ai" target="_blank">
              <Instagram className="text-zinc-300"/>
            </Link>
          </div>

          {/* Legal Section */}
          <div className="space-y-3">
            <h4 className="text-lg font-semibold">Legal</h4>
            <ul className="space-y-1 text-zinc-400 text-sm">
              <li><Link href="/refund-policy" className="hover:text-white transition">Refund Policy</Link></li>
              <li><Link href="/terms" className="hover:text-white transition">Terms of Service</Link></li>
              <li><Link href="/privacy" className="hover:text-white transition">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>
        {/* Copyright */}
        <div className="flex items-center justify-center py-3">
          <p className="text-sm text-zinc-400">© 2025 Mellvitta, All rights reserved.</p>
        </div>
      </motion.div>
    </footer>
  )
}

export default Footer
