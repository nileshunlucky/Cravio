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
            <Button >Sign In</Button>
          </SignInButton>
          <SignUpButton mode="modal">
            <Button variant="outline">Sign Up</Button>
          </SignUpButton>
        </SignedOut>

        <SignedIn>
          <Link href="/admin/dashboard">
            <Button >Dashboard</Button>
          </Link>
        </SignedIn>
      </div>
    </motion.nav>
  );
};

export default Nav;