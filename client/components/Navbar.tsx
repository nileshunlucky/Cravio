'use client'

import React, { useEffect } from 'react'
import { UserButton } from '@clerk/nextjs'
import Image from 'next/image'
import Link from 'next/link'
import { useUser } from '@clerk/nextjs';

const Navbar = ({ credits = 0 }: { credits: number }) => {

  return (
    <nav className="w-full  border-b shadow-sm py-2 px-4 flex items-center justify-between">
      {/* Left: Logo */}
      <Link href="/admin/dashboard"><Image src='/logo.png' alt="Logo" width={50} height={50} /></Link>

      {/* Right: Credits + Clerk User Button */}
      <div className="flex items-center gap-5">
        <div className="text-sm flex items-center">
          <svg width="16" height="16" viewBox="0 0 24 24" strokeWidth="1.5" fill="none" xmlns="http://www.w3.org/2000/svg" color="currentColor"><path fillRule="evenodd" clipRule="evenodd" d="M13.2319 2.28681C13.5409 2.38727 13.75 2.6752 13.75 3.00005V9.25005H19C19.2821 9.25005 19.5403 9.40834 19.6683 9.65972C19.7963 9.9111 19.7725 10.213 19.6066 10.4412L11.6066 21.4412C11.4155 21.7039 11.077 21.8137 10.7681 21.7133C10.4591 21.6128 10.25 21.3249 10.25 21.0001V14.7501H5C4.71791 14.7501 4.45967 14.5918 4.33167 14.3404C4.20366 14.089 4.22753 13.7871 4.39345 13.5589L12.3935 2.55892C12.5845 2.2962 12.923 2.18635 13.2319 2.28681Z" fill="url(&quot;#linearGradient&quot;)"></path><defs><linearGradient gradientTransform="rotate(90)" id="linearGradient"><stop offset="0%" stopColor="#FFE629"></stop><stop offset="100%" stopColor="#FFA057"></stop></linearGradient></defs></svg>
          <span className="font-bold ">{credits}</span>
        </div>
        <UserButton afterSignOutUrl="/" />
      </div>
    </nav>
  )
}

export default Navbar
