'use client'

import React from 'react'
import { UserButton } from '@clerk/nextjs'
import Image from 'next/image'
import Link from 'next/link'

const Navbar = ({ credits = 0 }: { credits: number }) => {

  return (
    <nav className="w-full bg-white border-b shadow-sm py-4 px-6 flex items-center justify-between">
      {/* Left: Logo */}
     <Link href="/admin/dashboard"><Image src='/logo.png' alt="Logo"  width={50} height={50}/></Link> 

      {/* Right: Credits + Clerk User Button */}
      <div className="flex items-center gap-4">
        <div className="text-sm text-gray-600">
          Credits: <span className="font-semibold text-black">{credits}</span>
        </div>
        <UserButton afterSignOutUrl="/" />
      </div>
    </nav>
  )
}

export default Navbar
