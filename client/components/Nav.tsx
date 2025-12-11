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
import { Home } from "lucide-react"
import { Menu , X, Goal} from 'lucide-react'

const Nav = () => {
  const [credit, setcredit] = useState<number | null>(null)
    const { user } = useUser();
  const email = user?.emailAddresses?.[0]?.emailAddress || '';
   const [menuOpen, setMenuOpen] = useState(false)
  const pathname = usePathname()

  // Fetch user aura value
  useEffect(() => {
    const fetchUserData = async () => {
      if (!email) return;
      try {
        const res = await fetch(
          `https://cravio-ai.onrender.com/user/${email}`
        )
        if (!res.ok) return
        const data = await res.json()
        setcredit(data?.credit)
      } catch (err) {
        console.error("Failed to fetch user data:", err)
      }
    }
    fetchUserData()
  }, [user])

  const dashLinks = [
    { href: "/admin/dashboard", label: "Dashboard", icon: Home },
    { href: "/admin/brokrage", label: "Acievement", icon: Goal  },
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
            <UserButton afterSignOutUrl="/" />
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
      

                <span className="font-bold">
                  {credit}
                </span>
              </div>
            </div>
          </SignedIn>

          <SignedOut>
            <SignInButton mode="modal">
              <Button>
                Sign In
              </Button>
            </SignInButton>
            <SignUpButton mode="modal">
              <Button>
                Sign Up
              </Button>
            </SignUpButton>
          </SignedOut>
        </div>
      </motion.nav>

      {/* ===== Mobile Bottom Bar ===== */}
        <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="w-full px-6 py-2 flex justify-between items-center border-b shadow-sm md:hidden relative z-50"
    >
      {/* Left side */}
      <div className="flex items-center gap-6">
        <SignedOut>
          <Link href="/" className="flex items-center">
            <Image src="/logo.png" alt="Logo" width={45} height={45} />
          </Link>
        </SignedOut>

        <SignedIn>
          <button
            onClick={() => setMenuOpen(prev => !prev)}
            className="p-2 rounded-md hover:bg-zinc-800 transition"
          >
          {menuOpen ? (<X className="w-6 h-6 text-zinc-300"/>) : ( <Menu className="w-6 h-6 text-zinc-300" />)}
           
          </button>

          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-14 left-4 w-48 bg-zinc-950 border border-zinc-900 rounded-xl shadow-lg flex flex-col z-50 px-4 py-2 text-zinc-300 gap-3"
            >
              <Link
                href="/admin/dashboard"
                onClick={() => setMenuOpen(false)}
              >
                Dashboard
              </Link>
              <Link
                href="/admin/brokrage"
                onClick={() => setMenuOpen(false)}
              >
               Brokrage
              </Link>
              <UserButton />
            </motion.div>
          )}
        </SignedIn>
      </div>

      {/* Right side */}
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


              </div>
              <span className="font-bold">
                {credit}
              </span>
            </div>
          </div>
        </SignedIn>

        <SignedOut>
          <SignInButton mode="modal">
            <Button >
              Sign In
            </Button>
          </SignInButton>
          <SignUpButton mode="modal">
            <Button >
              Sign Up
            </Button>
          </SignUpButton>
        </SignedOut>
      </div>
    </motion.nav>
    </>
  )
}

export default Nav
