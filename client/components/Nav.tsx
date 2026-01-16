'use client';

import React from 'react';
import Link from 'next/link';
import {
  SignInButton,
  SignUpButton,
  SignedOut,
  SignedIn,
} from '@clerk/nextjs';
import { Button } from '@/components/ui/button'; 
import { motion } from 'framer-motion';
import Image from 'next/image';

const Nav = () => {
  // Common teal glow class
  const tealGlowClass = "bg-[#2dd4bf] text-black hover:bg-[#26bba8] shadow-[0_0_15px_rgba(45,212,191,0.4)] border-none transition-all duration-300";
  const outlineGlowClass = "border-[#2dd4bf] text-[#2dd4bf] hover:bg-[#2dd4bf]/10 shadow-[0_0_10px_rgba(45,212,191,0.2)] transition-all duration-300";

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="w-full px-9 md:px-6 py-4 flex justify-between items-center border-b border-white/5 shadow-sm bg-[#0a0a0a]"
    >
      <Link href="/" className="text-2xl font-semibold tracking-tight">
        <Image src="/logo.png" alt="Logo" width={45} height={45}/>
      </Link>

      <div className="flex items-center gap-4">
        <SignedOut>
          <SignInButton mode="modal">
            <Button className={tealGlowClass}>Sign In</Button>
          </SignInButton>
          <SignUpButton mode="modal">
            <Button variant="outline" className={outlineGlowClass}>Sign Up</Button>
          </SignUpButton>
        </SignedOut>

        <SignedIn>
          <Link href="/admin/dashboard">
            <Button className={tealGlowClass}>Dashboard</Button>
          </Link>
        </SignedIn>
      </div>
    </motion.nav>
  );
};

export default Nav;