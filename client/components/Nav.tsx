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
import {
  Home,
  Play,
  Star,
  Folder,
  User as UserIcon,
} from 'lucide-react'

const Nav = () => {
  const [aura, setAura] = useState<number | null>(null)
  const { user } = useUser()
  const pathname = usePathname()

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

  const dashLinks = [
    { href: '/', label: 'Explore' },
    { href: '/admin/canvas', label: 'Canvas' },
    { href: '/admin/opus', label: 'Opus' },
    { href: '/admin/personas', label: "Persona's" },
    { href: '/admin/portfolio', label: 'Portfolio' },
  ]

  const bottomLinks = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/admin/canvas', label: 'Canvas', icon: Star  },
    { href: '/admin/opus', label: 'Opus', icon: Play },
    { href: '/admin/personas', label: 'Personas', icon: UserIcon },
    { href: '/admin/portfolio', label: 'Portfolio', icon: Folder  },
  ]

  return (
    <>
      {/* top nav */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full px-6 py-4 flex justify-between items-center border-b shadow-sm bg-black"
      >
        {/* left side */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center">
            <Image src="/logo.png" alt="Logo" width={45} height={45} />
          </Link>
          <SignedIn>
            <div className="hidden md:flex items-center gap-5">
              {dashLinks.map((link) => (
                <Link key={link.href} href={link.href}>
                  <span className="text-zinc-300 hover:text-[#B08D57] text-lg">
                    {link.label}
                  </span>
                </Link>
              ))}
            </div>
          </SignedIn>
        </div>

        {/* right side */}
        <div className="flex items-center gap-4">
          <SignedIn>
            <Link href="/admin/pricing">
              <span className="text-zinc-300 hover:text-[#B08D57] text-lg">
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
              <UserButton afterSignOutUrl="/" />
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

      {/* mobile bottom bar */}
      <div className="fixed bottom-2 left-1/2 -translate-x-1/2 z-40 md:hidden
            flex justify-around w-[90%] max-w-sm px-3 py-1.5
            rounded-2xl bg-black/50 backdrop-blur-md ">
  {bottomLinks.map(({ href, label, icon: Icon }) => {
    const active = pathname === href
    return (
      <Link
        key={href}
        href={href}
        className="flex flex-col items-center text-[10px]"
      >
        <div
          className={`p-1.5 rounded-lg flex items-center justify-center
                      ${active ? 'bg-[#b08d57] text-black' : 'text-zinc-300'}`}
        >
          <Icon size={18} />
        </div>
        <span className={active ? 'text-[#b08d57]' : 'text-zinc-400'}>
          {label}
        </span>
      </Link>
    )
  })}
</div>

    </>
  )
}

export default Nav
