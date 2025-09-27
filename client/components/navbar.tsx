'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  SignInButton,
  SignUpButton,
  SignedOut,
  SignedIn,
  useUser,
} from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import Image from 'next/image'


const Navbar = () => {
  const [aura, setAura] = useState<number | null>(null)
  const { user } = useUser()

  // Fetch user aura value
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user?.emailAddresses?.[0]?.emailAddress) return
      try {
        const res = await fetch(
          `https://cravio-ai.onrender.com/user/${user.emailAddresses[0].emailAddress}`
        )
        if (!res.ok) return
        const data = await res.json()
        setAura(data.aura)
      } catch (err) {
        console.error('Failed to fetch user data:', err)
      }
    }
    fetchUserData()
  }, [user])

  return (
    <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full px-6 py-2 flex justify-between items-center border-b shadow-sm  md:hidden"
      >
        {/* Left side: logo + desktop links */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center">
            <Image src="/logo.png" alt="Logo" width={45} height={45} />
          </Link>
        </div>

        {/* Right side: pricing + user */}
        <div className="flex items-center gap-4">
          <SignedIn>
            <Link href="/admin/pricing">
              <span className="text-zinc-300 hover:text-zinc-100 text-lg">
                Pricing
              </span>
            </Link>

            <div className="flex items-center gap-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <svg 
                    width="32" 
                    height="32" 
                    viewBox="0 0 400 400" 
                    className="w-8 h-8 flex-shrink-0"
                    style={{ minWidth: '32px', minHeight: '32px' }}
                  >
                    <defs>
                      <linearGradient id="gold-mobile" cx="50%" cy="50%" r="60%">
                        <stop offset="0%" stopColor="#F4E4BC" />
                        <stop offset="50%" stopColor="#E6C878" />
                        <stop offset="100%" stopColor="#C9A96E" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M200 40 Q220 160 240 180 Q290 190 340 200 
                         Q290 210 240 220 Q220 240 200 360 
                         Q180 240 160 220 Q110 210 60 200 
                         Q110 190 160 180 Q180 160 200 40 Z"
                      fill="url(#gold-mobile)"
                      stroke="#C9A96E"
                      strokeWidth="2"
                    />
                  </svg>
                </div>
                <span className="font-bold text-[#C9A96E] text-base">
                  {aura}
                </span>
              </div>
            
            </div>
          </SignedIn>

          <SignedOut>
            <SignInButton mode="modal">
              <Button className="bg-gradient-to-r from-[#C9A96E] via-[#B08D57] to-[#ad8544] text-black">
                Sign In
              </Button>
            </SignInButton>
            <SignUpButton mode="modal">
              <Button className="bg-gradient-to-r from-[#C9A96E] via-[#B08D57] to-[#ad8544] text-black">
                Sign Up
              </Button>
            </SignUpButton>
          </SignedOut>
        </div>
      </motion.nav>
  )
}

export default Navbar
