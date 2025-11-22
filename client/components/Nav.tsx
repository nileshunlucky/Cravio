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
import { Home, Menu, X, Goal } from "lucide-react"

const Nav = () => {
  const [aura, setAura] = useState<number | null>(null)
  const { user } = useUser()
  const email = user?.emailAddresses?.[0]?.emailAddress || ""
  const [menuOpen, setMenuOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    if (!email) return
    const fetchUserData = async () => {
      try {
        const res = await fetch(`https://cravio-ai.onrender.com/user/${email}`)
        if (!res.ok) return
        const data = await res.json()
        setAura(data.aura)
      } catch {}
    }
    fetchUserData()
  }, [user])

  const dashLinks = [
    { href: "/admin/dashboard", label: "Dashboard", icon: Home },
    { href: "/admin/insights", label: "Acievement", icon: Goal },
  ]

  return (
    <>
      <motion.nav
        initial={{ x: -50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="hidden md:flex fixed top-0 left-0 h-screen w-20 flex-col justify-between border-r bg-black px-2 py-6 shadow-lg z-50"
      >
        <Link href="/" className="mb-10 flex justify-center">
          <Image src="/logo.png" alt="Logo" width={45} height={45} />
        </Link>

        <div className="flex flex-col items-center gap-8">
          <SignedIn>
            {dashLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <link.icon
                  size={24}
                  className={
                    pathname === link.href
                      ? "text-zinc-100"
                      : "text-zinc-500 hover:text-zinc-100"
                  }
                />
              </Link>
            ))}
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </div>

        <div className="flex flex-col items-center gap-6">
          <SignedIn>
            <Link href="/admin/pricing">
              <span className="text-zinc-300 hover:text-zinc-100 text-sm">
                Pricing
              </span>
            </Link>

            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-1">
                <svg width="30" height="30" viewBox="0 0 400 400" className="w-8 h-8 flex-shrink-0">
                  <path
                    d="M200 40 Q220 160 240 180 Q290 190 340 200 
                    Q290 210 240 220 Q220 240 200 360 
                    Q180 240 160 220 Q110 210 60 200 
                    Q110 190 160 180 Q180 160 200 40 Z"
                    fill="#FFFFFF"
                  />
                </svg>
                <span className="font-bold">{aura}</span>
              </div>
            </div>
          </SignedIn>

          <SignedOut>
            <SignInButton mode="modal">
              <Button>Sign In</Button>
            </SignInButton>
            <SignUpButton mode="modal">
              <Button>Sign Up</Button>
            </SignUpButton>
          </SignedOut>
        </div>
      </motion.nav>

      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full px-6 py-2 flex justify-between items-center border-b shadow-sm md:hidden relative"
      >
        <div className="flex items-center gap-6">
          <SignedOut>
            <Link href="/" className="flex items-center">
              <Image src="/logo.png" alt="Logo" width={45} height={45} />
            </Link>
          </SignedOut>

          <SignedIn>
            <button
              onClick={() => setMenuOpen((prev) => !prev)}
              className="p-2 rounded-md hover:bg-zinc-800 transition"
            >
              {menuOpen ? (
                <X className="w-6 h-6 text-zinc-300" />
              ) : (
                <Menu className="w-6 h-6 text-zinc-300" />
              )}
            </button>

            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute top-14 left-4 w-48 bg-zinc-950 border border-zinc-900 rounded-xl shadow-lg flex flex-col z-50 px-4 py-2 text-zinc-300 gap-3"
              >
                <Link href="/admin/dashboard" onClick={() => setMenuOpen(false)}>
                  Dashboard
                </Link>
                <Link href="/admin/insights" onClick={() => setMenuOpen(false)}>
                  Insights
                </Link>
                <UserButton />
              </motion.div>
            )}
          </SignedIn>
        </div>

        <div className="flex items-center gap-4">
          <SignedIn>
            <Link href="/admin/pricing">
              <span className="text-zinc-300 hover:text-zinc-100 text-lg">
                Pricing
              </span>
            </Link>

            <div className="flex items-center gap-2 text-sm">
              <svg
                width="32"
                height="32"
                viewBox="0 0 400 400"
                className="w-8 h-8 flex-shrink-0"
                style={{ minWidth: "32px", minHeight: "32px" }}
              >
                <path
                  d="M200 40 Q220 160 240 180 Q290 190 340 200 
                  Q290 210 240 220 Q220 240 200 360 
                  Q180 240 160 220 Q110 210 60 200 
                  Q110 190 160 180 Q180 160 200 40 Z"
                  fill="#FFFFFF"
                  stroke="#FFFFFF"
                  strokeWidth="2"
                />
              </svg>
              <span className="font-bold">{aura}</span>
            </div>
          </SignedIn>

          <SignedOut>
            <SignInButton mode="modal">
              <Button>Sign In</Button>
            </SignInButton>
            <SignUpButton mode="modal">
              <Button>Sign Up</Button>
            </SignUpButton>
          </SignedOut>
        </div>
      </motion.nav>
    </>
  )
}

export default Nav
