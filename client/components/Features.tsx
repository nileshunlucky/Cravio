'use client';

import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';

const Hero = () => {
  // In useEffect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) {
      localStorage.setItem('referrer', ref); // Store it temporarily
    }
  }, []);

  return (
    <section className="w-full px-6 py-24 flex flex-col md:flex-row items-center justify-between gap-10 ">
      {/* TEXT */}
      <motion.div
        className="max-w-xl"
        initial={{ x: -30, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-4">
          Create Faceless Content Clips in Just a Few Clicks ✨
        </h1>
        <p className="text-gray-600 text-lg mb-6">
          <strong>Cravio.ai</strong> helps you generate engaging stories, AI voiceovers, background gameplay, and captions — all automatically.
        </p>

        <Link href="/admin/dashboard">
          <Button size="lg">Start Creating</Button>
        </Link>
      </motion.div>

      {/* IMAGE or VIDEO PLACEHOLDER */}
      <motion.div
        className="w-full md:w-1/2 rounded-xl shadow-xl overflow-hidden"
        initial={{ x: 30, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <div className="aspect-video flex items-center justify-center text-gray-500 text-xl">
          <Image src="/reddit-story.png" alt="Reddit style story" className='w-full h-full object-contain' width={500} height={500} />
        </div>
      </motion.div>
    </section>
  );
};

export default Hero;
