'use client'

import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import Link from 'next/link';

const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: 'easeOut',
      delay,
    },
  }),
};

const Caption = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' }); // triggers when slightly visible

  return (
    <motion.div
      ref={ref}
      className="min-h-screen w-full flex items-center justify-center"
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={{
        hidden: {},
        visible: {},
      }}
    >
      <div className="w-full max-w-6xl mx-auto px-8">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          
          {/* Left Content */}
          <div className="space-y-12">
            <motion.div variants={fadeInUp} custom={0.1}>
              <div className="mb-8">
                <div className="w-12 h-px bg-[#B08D57] mb-6"></div>
                <motion.h1
                  className="text-6xl lg:text-7xl font-extralight text-white/95 leading-[0.9] mb-4"
                  variants={fadeInUp}
                  custom={0.2}
                >
                  Curated
                </motion.h1>
                <motion.h2
                  className="text-6xl lg:text-7xl font-extralight text-[#B08D57] leading-[0.9] mb-8"
                  variants={fadeInUp}
                  custom={0.3}
                >
                  Excellence
                </motion.h2>
                <motion.p
                  className="text-xl font-extralight text-white/70 leading-relaxed"
                  variants={fadeInUp}
                  custom={0.4}
                >
                  meticulously refined within every caption we curate for distinguished brands.
                </motion.p>
              </div>
            </motion.div>

            <motion.div variants={fadeInUp} custom={0.5}>
              <Link href="/admin/explore">
                <button
                  className="group relative px-12 py-4 border border-[#B08D57] hover:bg-[#B08D57]/5 transition-all duration-500 disabled:opacity-50 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  <span className="relative text-[#B08D57] font-light tracking-[0.25em] text-sm uppercase">
                    CREATE EXCLUSIVE CAPTIONS
                  </span>
                </button>
              </Link>
            </motion.div>
          </div>

          {/* Right Visual */}
          <motion.div
            className="relative"
            variants={fadeInUp}
            custom={0.6}
          >
            <div className="aspect-[4/5] bg-gradient-to-br from-white/5 to-transparent border border-white/10 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-[#B08D57]/10 via-transparent to-transparent"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <img src="/posts/post8.jpeg" alt="model" />
              </div>
            </div>

            {/* Floating metrics */}
            <motion.div
              className="absolute -right-8 bottom-16 bg-black/80 backdrop-blur border border-white/10 p-4"
              variants={fadeInUp}
              custom={0.8}
            >
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-[#B08D57]"></div>
                <div>
                  <div className="text-white/90 font-light text-2xl">Curated by Mellvitta</div>
                  <div className="text-white/50 font-light text-xs tracking-wider">#giorgio #model #fyp</div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default Caption;
