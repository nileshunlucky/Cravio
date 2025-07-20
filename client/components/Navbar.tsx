'use client'

import React from 'react'
import { UserButton } from '@clerk/nextjs'
import Image from 'next/image'
import Link from 'next/link'

const Navbar = ({ credits = 0 }: { credits: number }) => {

  return (
    <nav className="w-full  border-b shadow-sm py-2 px-4 flex items-center justify-between">
      {/* Left: Logo */}
      <Link href="/admin/dashboard"><Image src='/logo.png' alt="Logo" width={50} height={50} /></Link>

      {/* Right: Credits + Clerk User Button */}
      <div className="flex items-center gap-5">
        <div className="text-sm flex items-center">
          {/* 
          <svg width="30" height="30" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="minimalistGold" cx="50%" cy="50%" r="60%">
                <stop offset="0%" style={{ stopColor: "#F4E4BC", stopOpacity: 1 }} />
                <stop offset="50%" style={{ stopColor: "#E6C878", stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: "#C9A96E", stopOpacity: 1 }} />
              </linearGradient>
            </defs>
            <path d="M 200 40 
         Q 220 160 240 180 
         Q 290 190 340 200 
         Q 290 210 240 220 
         Q 220 240 200 360 
         Q 180 240 160 220 
         Q 110 210 60 200 
         Q 110 190 160 180 
         Q 180 160 200 40 
         Z"
              fill="url(#minimalistGold)"
              stroke="none" />
          </svg> */}

          <svg width="30" height="30" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="minimalistGold" cx="50%" cy="50%" r="60%">
                <stop offset="0%" style={{ stopColor: "#F4E4BC", stopOpacity: 1 }} />
                <stop offset="50%" style={{ stopColor: "#E6C878", stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: "#C9A96E", stopOpacity: 1 }} />
              </linearGradient>
            </defs>

            <path d="M 200 40 
         Q 225 155 250 175 
         Q 295 185 340 200 
         Q 295 215 250 225 
         Q 225 245 200 360 
         Q 175 245 150 225 
         Q 105 215 60 200 
         Q 105 185 150 175 
         Q 175 155 200 40 
         Z"
              fill="url(#minimalistGold)"
              stroke="none" />
          </svg>

          <span className="font-bold">{credits}</span>
        </div>

        <UserButton afterSignOutUrl="/" />
      </div>
    </nav>
  )
}

export default Navbar