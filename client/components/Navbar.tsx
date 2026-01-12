'use client'

import React from 'react'
import { UserButton } from '@clerk/nextjs'
import Image from 'next/image'
import Link from 'next/link'

const Navbar = () => {

  return (
    <nav className="w-full  border-b shadow-sm py-2 px-4 flex items-center justify-between">
      {/* Left: Logo */}
      <Link href="/admin/dashboard"><Image src='/logo.png' alt="Logo" width={50} height={50} /></Link>

      <div className="flex items-center gap-5">

        <UserButton afterSignOutUrl="/" />
      </div>
    </nav>
  )
}

export default Navbar
