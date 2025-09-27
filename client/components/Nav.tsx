"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import {
  SignInButton,
  SignUpButton,
  SignedOut,
  SignedIn,
  UserButton,
  useUser,
} from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Home, Search, Play } from "lucide-react"

const Nav = () => {
  const [aura, setAura] = useState<number | null>(null)
  const { user } = useUser()
  const pathname = usePathname()

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
        console.error("Failed to fetch user data:", err)
      }
    }
    fetchUserData()
  }, [user])

  const dashLinks = [
    { href: "/", label: "Home", icon: Home },
    { href: "/explore", label: "Explore", icon: Search },
    { href: "/create", label: "Create", icon: null },
    { href: "/mells", label: "Mells", icon: Play },
  ]

  return (
    <>
      {/* ===== Sidebar (desktop) ===== */}
      <motion.nav
        initial={{ x: -50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="hidden md:flex fixed top-0 left-0 h-screen w-20 flex-col justify-between border-r bg-black px-2 py-6 shadow-lg z-50"
      >
        {/* Top: Logo */}
        <Link href="/" className="mb-10 flex justify-center">
          <Image src="/logo.png" alt="Logo" width={45} height={45} />
        </Link>

        {/* Middle: Navigation links */}
        <div className="flex flex-col items-center gap-8">
          <SignedIn>
            {dashLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                {link.icon ? (
                  <link.icon
                    size={24}
                    className={
                      pathname === link.href
                        ? "text-zinc-100"
                        : "text-zinc-500 hover:text-zinc-100"
                    }
                  />
                ) : (
                  <span
                    className={
                      pathname === link.href
                        ? "text-zinc-100 text-2xl"
                        : "text-zinc-500 hover:text-zinc-100 text-2xl"
                    }
                  >
                    ✦
                  </span>
                )}
              </Link>
            ))}
          </SignedIn>
        </div>

        {/* Bottom: User + aura + pricing */}
        <div className="flex flex-col items-center gap-6">
          <SignedIn>
            <Link href="/admin/pricing">
              <span className="text-zinc-300 hover:text-zinc-100 text-sm">
                Pricing
              </span>
            </Link>

            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-1">
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

      {/* ===== Mobile Bottom Bar (unchanged) ===== */}
      <SignedIn>
        <div
          className="fixed bottom-0 left-0 z-50 md:hidden
                     flex justify-around items-center
                     w-full px-3 py-3 rounded-t-2xl
                     bg-black/80 backdrop-blur-md"
        >
          <Link href="/" className="flex items-center">
            <Home
              size={24}
              className={pathname === "/" ? "text-zinc-100" : "text-zinc-500"}
            />
          </Link>

          <Link href="/explore" className="flex items-center">
            <Search
              size={24}
              className={
                pathname.startsWith("/explore")
                  ? "text-zinc-100"
                  : "text-zinc-500"
              }
            />
          </Link>

          <Link href="/create" className="flex items-center">
            <h1
              className={
                (pathname.startsWith("/create") ? "text-zinc-100" : "text-zinc-500") +
                " text-2xl"
              }
            >
              ✦
            </h1>
          </Link>

          <Link href="/mells" className="flex items-center">
            <Play
              size={24}
              className={
                pathname.startsWith("/mells") ? "text-zinc-100" : "text-zinc-500"
              }
            />
          </Link>

          <UserButton />
        </div>
      </SignedIn>
    </>
  )
}

export default Nav
