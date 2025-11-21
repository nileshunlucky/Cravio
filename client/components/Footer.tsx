'use client'

import React from 'react'
import Link from 'next/link'
import { Instagram } from 'lucide-react'
import { motion } from 'framer-motion' // Import Framer Motion

const Footer = () => {
    
    const year = new Date().getFullYear();

  return (
    <footer className="w-full">

      {/* --- Bottom Footer --- */}
      <motion.div
        className="border-t py-10 px-6 bg-black text-white"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, ease: 'easeInOut', delay: 0.3 }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-8">
          {/* Social Section */}
          <div className="space-y-3">
            <h4 className="text-lg font-semibold">Follow Us</h4>
            <Link href="https://www.instagram.com/mellvitta.ai" target="_blank">
              <Instagram className="text-zinc-300"/>
            </Link>
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
        </div>
        {/* Copyright */}
        <div className="flex items-center justify-center py-3">
          <p className="text-sm text-zinc-400">© {year} Mellvitta, All rights reserved.</p>
        </div>
      </motion.div>
    </footer>
  )
}

export default Footer
