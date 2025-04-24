'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'

const Footer = () => {
  return (
    <footer className="bg-white border-t py-10 px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Social Section */}
        <div className="space-y-3">
          <h4 className="text-lg font-semibold">Follow us across the web</h4>
          <p className="text-muted-foreground">Join our fast-growing community!</p>
          <div className="flex gap-4 mt-2">
            <Link href="https://www.tiktok.com/@cravio.ai" target="_blank">
              <Image
                src="/icons/tiktok.webp"
                alt="TikTok"
                width={34}
                height={34}
                className="hover:opacity-80 transition"
              />
            </Link>
            <Link href="https://www.instagram.com/cravio.ai" target="_blank">
              <Image
                src="/icons/Instagram.png"
                alt="Instagram"
                width={34}
                height={34}
                className="hover:opacity-80 transition"
              />
            </Link>
            <Link href="https://www.youtube.com/@cravio-ai" target="_blank">
              <Image
                src="/icons/youtube.png"
                alt="YouTube"
                width={34}
                height={34}
                className="hover:opacity-80 transition"
              />
            </Link>
            <Link href="https://discord.gg/ZxC6svsH" target="_blank">
              <Image
                src="/icons/discord.png"
                alt="Discord"
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
          <ul className="space-y-1 text-muted-foreground text-sm">
            <li><Link href="/refund-policy" className="hover:text-black transition">Refund Policy</Link></li>
            <li><Link href="/terms" className="hover:text-black transition">Terms of Service</Link></li>
            <li><Link href="/privacy" className="hover:text-black transition">Privacy Policy</Link></li>
            <li><Link href="/admin/affiliate" className="hover:text-black transition">Affiliate</Link></li>
          </ul>
        </div>

        {/* Logo + Copyright */}
        <div className="flex flex-col items-start md:items-end justify-between gap-4">
          <Image src="/logo.png" alt="Cravio Logo" width={60} height={60} />
          <p className="text-sm text-muted-foreground">© 2025 Cravio, Inc.</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
