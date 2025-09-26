'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  SignInButton,
  SignUpButton,
  SignedOut,
  SignedIn,
  UserButton,
  useUser,
} from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Home, Search, Play } from 'lucide-react'

const Nav = () => {
  const [aura, setAura] = useState<number | null>(null)
  const { user } = useUser()
  const pathname = usePathname()

  const StarGlyph: React.FC<{ size?: number }> = ({ size = 25 }) => (
    <span className={
                pathname.startsWith('/mells')
                  ? 'text-zinc-100'
                  : 'text-zinc-500'
              } style={{ fontSize: size, lineHeight: 1 }}>✦</span>
  )

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

  // Top-nav links for desktop
  const dashLinks = [
    { href: '/', label: 'Home' },
    { href: '/explore', label: 'Explore' },
    { href: '/create', label: 'Create' },
    { href: '/mells', label: 'Mells' },
  ]

  return (
    <>
      {/* ===== Top Nav (desktop) ===== */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full px-6 py-4 flex justify-between items-center border-b shadow-sm bg-black"
      >
        {/* Left side: logo + desktop links */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center">
            <Image src="/logo.png" alt="Logo" width={45} height={45} />
          </Link>

          <SignedIn>
            <div className="hidden md:flex items-center gap-5">
              {dashLinks.map((link) => (
                <Link key={link.href} href={link.href}>
                  <span className="text-zinc-300 hover:text-zinc-100 text-lg">
                    {link.label}
                  </span>
                </Link>
              ))}
            </div>
          </SignedIn>
        </div>

        {/* Right side: pricing + user */}
        <div className="flex items-center gap-4">
          <SignedIn>
            <Link href="/admin/pricing">
              <span className="text-zinc-300 hover:text-zinc-100 text-lg">
                Pricing
              </span>
            </Link>

            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center">
                <svg width="30" height="30" viewBox="0 0 400 400">
                  <defs>
                    <linearGradient id="gold" cx="50%" cy="50%" r="60%">
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
                    fill="url(#gold)"
                  />
                </svg>
                <span className="font-bold bg-gradient-to-br from-[#C9A96E] via-[#B08D57] to-[#ad8544] text-transparent bg-clip-text">
                  {aura}
                </span>
              </div>
              <span className="md:flex hidden">  <UserButton  afterSignOutUrl="/" /></span>
            
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

      {/* ===== Mobile Bottom Bar ===== */}
      <SignedIn>
        <div
          className="fixed bottom-0 left-0 z-40 md:hidden
                     flex justify-around items-center
                     w-full px-3 py-3 rounded-t-2xl
                     bg-black/80 backdrop-blur-md"
        >
          {/* 1. Home */}
          <Link href="/" className="flex items-center">
            <Home
              size={24}
              className={pathname === '/' ? 'text-zinc-100' : 'text-zinc-500'}
            />
          </Link>

          {/* 2. Explore */}
          <Link href="/explore" className="flex items-center">
            <Search
              size={24}
              className={
                pathname.startsWith('/explore')
                  ? 'text-zinc-100'
                  : 'text-zinc-500'
              }
            />
          </Link>

          {/* 3. Create */}
          <Link href="/create" className="flex items-center">
            <StarGlyph
  size={25}
/>

          </Link>

          {/* 4. Mells */}
          <Link href="/mells" className="flex items-center">
            <Play
              size={24}
              className={
                pathname.startsWith('/mells')
                  ? 'text-zinc-100'
                  : 'text-zinc-500'
              }
            />
          </Link>

          {/* 5. User profile */}
          <UserButton />

{user && (
  <Link href={`/${user.username || user.id}`} className="flex items-center hidden">
    {user ? (
    <img
      src={user.imageUrl}
      alt={user.username || 'Profile'}
      className="w-6 h-6 rounded-full object-cover"
    />
  ) : (
    <UserIcon size={24} className="text-zinc-500" />
  )}
  </Link>
)}

        </div>
      </SignedIn>
    </>
  )
}

export default Nav
