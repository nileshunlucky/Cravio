'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'

const Footer = () => {
    const [creators, setCreators] = useState<number | null>(null)

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const res = await fetch(
          `https://cravio-ai.onrender.com/users-emails`
        )
        if (!res.ok) return
        const data = await res.json()
        setCreators(data.length)
        
      } catch (err) {
        console.error('Failed to fetch user data:', err)
      }
    }
    fetchUserData()
  }, [])

  return (
    <footer className="w-full">
      {/* --- Top Banner --- */}
      <div
        className="w-full py-16 px-6 text-black"
        style={{
          background: 'linear-gradient(135deg, #b08D57 0%, #d6bfa3 100%)',
        }}
      >
        <div className="max-w-7xl mx-auto space-y-6">
  <h2 className="text-3xl md:text-4xl font-bold leading-snug max-w-4xl">
    ELEVATING AI CREATIVITY <br /> FOR MODERN INFLUENCERS
  </h2>
  <p className="text-lg">
    Inspiration for {creators}+ visionary creators <br /> and tastemakers
  </p>
</div>

      </div>

      {/* --- Bottom Footer --- */}
      <div className="border-t py-10 px-6 bg-black text-white">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Social Section */}
          <div className="space-y-3">
            <h4 className="text-lg font-semibold">Follow us across the web</h4>
            <p className="text-zinc-400">Join our fast-growing community!</p>
            <div className="flex gap-4 mt-2">
              <Link href="https://www.instagram.com/mellvitta.ai" target="_blank">
                <Image
                  src="/icons/Instagram.png"
                  alt="Instagram"
                  width={34}
                  height={34}
                  className="hover:opacity-80 transition"
                />
              </Link>
              <Link href="https://www.youtube.com/@mellvittaai" target="_blank">
                <Image
                  src="/icons/youtube.png"
                  alt="YouTube"
                  width={34}
                  height={34}
                  className="hover:opacity-80 transition"
                />
              </Link>
            </div>
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

          {/* Logo + Copyright */}
          <div className="flex flex-col items-start md:items-end justify-between gap-4">
            <Image src="/logo.png" alt="Mellvitta Logo" width={60} height={60} />
            <p className="text-sm text-zinc-400">© 2025 Mellvitta, All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
