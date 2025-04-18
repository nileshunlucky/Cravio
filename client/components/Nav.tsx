'use client';

import React from 'react';
import Link from 'next/link';
import {
  SignInButton,
  SignUpButton,
  SignedOut,
  SignedIn,
  UserButton,
} from '@clerk/nextjs';
import { Button } from '@/components/ui/button'; // From ShadCN UI
import { motion } from 'framer-motion';

const Nav = () => {
  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="w-full px-6 py-4 flex justify-between items-center border-b border-gray-200 bg-white shadow-sm"
    >
      <Link href="/" className="text-2xl font-semibold tracking-tight">
        Cravio AI
      </Link>

      <div className="flex items-center gap-4">
        <SignedOut>
          <SignInButton mode="modal">
            <Button variant="default">Sign In</Button>
          </SignInButton>
          <SignUpButton mode="modal">
            <Button variant="outline">Sign Up</Button>
          </SignUpButton>
        </SignedOut>

        <SignedIn>
          {/* Dashboard button */}
          <Link href="/admin/dashboard">
            <Button variant="default">Dashboard</Button>
          </Link>
        </SignedIn>
      </div>
    </motion.nav>
  );
};

export default Nav;
