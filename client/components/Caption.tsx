'use client';

import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { UtensilsCrossed } from 'lucide-react';

// Subtle, staggered fade-in-up animation
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.8,
      ease: 'easeOut',
    },
  },
};

const imageVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 1.2,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

const Caption = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <div
      ref={ref}
      className="bg-[#111111] min-h-screen w-full flex items-center justify-center font-sans p-4"
    >
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center"
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          variants={containerVariants}
        >
          {/* Left Content */}
          <div className="space-y-8">
            <motion.div variants={itemVariants}>
              <div className="w-16 h-1 bg-[#B08D57] mb-6 rounded-full"></div>
              <h1 className="text-5xl md:text-6xl font-light text-white/90 leading-tight">
                Curated
                <br />
                <span className="text-[#B08D57]">Excellence.</span>
              </h1>
            </motion.div>

            <motion.p
              className="text-lg font-light text-white/60 leading-relaxed max-w-md"
              variants={itemVariants}
            >
              Simple, beautiful captions that make your posts stand out. Upload your photo and get three ready-to-use captions with matching hashtags.
            </motion.p>

            <motion.div variants={itemVariants}>
              <a href="/admin/explore">
                <button className="group text-sm font-medium tracking-wider uppercase px-8 py-4 bg-[#B08D57]/10 text-[#B08D57] border border-[#B08D57]/40 rounded-lg transition-all duration-300 ease-out hover:bg-[#B08D57]/20 hover:shadow-lg hover:shadow-[#B08D57]/10 hover:scale-105">
                  Create Exclusive Captions
                </button>
              </a>
            </motion.div>
          </div>

          {/* Right Image + Caption Card */}
          <motion.div className="relative" variants={imageVariants}>
            <div className="aspect-[4/5] relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl shadow-black/50">
              <img
                src="https://res.cloudinary.com/deoxpvjjg/image/upload/v1754926789/8da7c3ed-de6c-410d-b38b-09bfa033ed65_unqxsa.png"
                alt="AI generated fashion model"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src =
                    'https://placehold.co/600x750/111111/B08D57?text=Image+Not+Found';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10"></div>
            </div>

            <motion.div
              className="absolute -right-4 sm:-right-8 -bottom-8 w-[90%] sm:w-auto bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-lg"
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={
                isInView
                  ? { opacity: 1, y: 0, scale: 1 }
                  : {}
              }
              transition={{
                duration: 0.8,
                delay: 0.8,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              <div className="flex items-start gap-4">
                <UtensilsCrossed />
                <div>
                  <p className="text-white/80 text-sm mt-1">
                    Sweet mornings, fluffy pancakes, fresh berries… and that smile. 🍓🥞
                  </p>
                  <p className="text-[#B08D57] text-xs font-medium tracking-wide mt-2">
                    #morningvibes #berrydelight #cozybed #breakfastinbed
                  </p>

                </div>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default Caption;
