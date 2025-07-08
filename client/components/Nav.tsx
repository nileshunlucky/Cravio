'use client';

import React from 'react';
import Link from 'next/link';
import {
  SignInButton,
  SignUpButton,
  SignedOut,
  SignedIn,
} from '@clerk/nextjs';
import { Button } from '@/components/ui/button'; // From ShadCN UI
import { motion } from 'framer-motion';
import Image from 'next/image';

const Nav = () => {
  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="w-full px-9 md:px-6 py-4 flex justify-between items-center border-b shadow-sm"
    >
      <Link href="/" className="text-2xl font-semibold tracking-tight">
        <Image src="/logo.png" alt="Logo" width={45} height={45}/>
      </Link>

      <div className="flex items-center gap-4">
        <SignedOut>
          <SignInButton mode="modal">
            <Button className='bg-[#B08D57] text-black hover:bg-[#B08D57]/80' style={{ boxShadow: '0 0 15px rgba(255, 215, 100, 0.5)' }} variant="default">Sign In</Button>
          </SignInButton>
          <SignUpButton mode="modal">
            <Button className='bg-[#B08D57] text-black hover:bg-[#B08D57]/80' style={{ boxShadow: '0 0 15px rgba(255, 215, 100, 0.5)' }} variant="default">Sign Up</Button>
          </SignUpButton>
        </SignedOut>

        <SignedIn>
          {/* Dashboard button */}
          <Link href="/admin/dashboard">
            <Button className='bg-[#B08D57] text-black hover:bg-[#B08D57]/80' style={{ boxShadow: '0 0 15px rgba(255, 215, 100, 0.5)' }} variant="default">Dashboard</Button>
          </Link>
        </SignedIn>
      </div>
    </motion.nav>
  );
};

export default Nav;
