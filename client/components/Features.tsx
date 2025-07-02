import React from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { SmilePlus } from 'lucide-react';
import Link from 'next/link';

const Features = () => {
  // Animation variants for Framer Motion
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut"
      },
    },
  };

  const glowStyle = {
    boxShadow: '0 0 30px rgba(71, 255, 231, 0.4), 0 0 15px rgba(71, 255, 231, 0.3)',
  };

  const textGlowStyle = {
    filter: 'drop-shadow(0 0 10px rgba(71, 255, 231, 0.5))',
  };

  // For the animated dot along the path
  const pathRef = React.useRef<SVGPathElement | null>(null);
  const progress = useMotionValue(0);

  React.useEffect(() => {
    const path = pathRef.current as SVGPathElement | null;
    if (path) {
      const length = path.getTotalLength();
      const animation = animate(progress, length, {
        delay: 1,
        duration: 2,
        ease: "easeInOut",
        repeat: Infinity,
        repeatType: "loop",
        repeatDelay: 1,
      });
      return () => animation.stop();
    }
  }, [pathRef, progress]);

  const x = useTransform(progress, (val) => pathRef.current?.getPointAtLength(val).x);
  const y = useTransform(progress, (val) => pathRef.current?.getPointAtLength(val).y);


  return (
    <div className="bg-black text-white py-24 sm:py-32 px-4 overflow-hidden">
      <div className="container mx-auto">
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-2 gap-20 lg:gap-12 items-center"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={containerVariants}
        >
          {/* Left Column: Text Content */}
          <motion.div className="flex flex-col gap-8 text-center lg:text-left" variants={containerVariants}>
            <motion.h2
              className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight"
              variants={itemVariants}
            >
              Enhance Your Thumbnails With{' '}
              <span className="text-[#47FFE7]" style={textGlowStyle}>
                FaceSwap
              </span>
            </motion.h2>
            <motion.p
              className="text-lg md:text-xl text-gray-300 max-w-lg mx-auto lg:mx-0"
              variants={itemVariants}
            >
              Select your persona & watch our AI thumbnail maker
              smoothly swap out the original face with yours, ensuring
              your audience instantly recognizes you.
            </motion.p>
            <motion.div variants={itemVariants} className="pt-4">
              <Link href="/admin/dashboard">
                <motion.button
                  className="px-10 py-5 bg-[#47FFE7] text-black font-bold rounded-full text-lg"
                  style={glowStyle}
                  whileHover={{ scale: 1.05, ...glowStyle }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  Get Started Now
                </motion.button>
              </Link>
            </motion.div>
          </motion.div>

          {/* Right Column: Visual Demonstration */}
          <motion.div className="relative h-[500px] sm:h-[600px] flex flex-col justify-between items-center" variants={itemVariants}>
            {/* Connecting SVG Line */}
            <svg
              className="absolute top-0 left-0 w-full h-full z-0"
              viewBox="0 0 400 600"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <motion.path
                ref={pathRef}
                d="M200 100 C 400 225, 0 375, 200 500"
                stroke="url(#line-gradient)"
                strokeWidth="2.5"
                strokeDasharray="8 8"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 2, ease: "easeInOut", delay: 0.5 }}
              />
              {/* Animated Glowing Dot */}
              <motion.circle
                cx={x}
                cy={y}
                r="6"
                fill="#47FFE7"
                style={{
                  filter: 'drop-shadow(0 0 10px rgba(71, 255, 231, 1))'
                }}
              />
              <defs>
                <linearGradient id="line-gradient" x1="50%" y1="0%" x2="50%" y2="100%">
                  <stop offset="0%" stopColor="#47FFE7" stopOpacity="0" />
                  <stop offset="20%" stopColor="#47FFE7" stopOpacity="0.7" />
                  <stop offset="80%" stopColor="#47FFE7" stopOpacity="0.7" />
                  <stop offset="100%" stopColor="#47FFE7" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>

            {/* Top Image (Original) */}
            <motion.div
              className="w-56 sm:w-80 rounded-2xl p-1.5 z-10"
              style={{ background: 'rgba(71, 255, 231, 0.1)' }}
              initial={{ opacity: 0, y: -30 }}
              whileInView={{ opacity: 1, y: 0, transition: { delay: 0.4, duration: 0.8 } }}
              viewport={{ once: true }}
            >
              <div className="rounded-xl" style={glowStyle}>
                <img
                  src="https://res.cloudinary.com/db17zxsjc/image/upload/v1751448348/maxresdefault_l2ccby.jpg"
                  alt="Original Thumbnail"
                  className="w-full h-full object-cover rounded-xl"
                />
              </div>
            </motion.div>

            {/* Swap Icon in the middle */}
            <motion.div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20"
              initial={{ scale: 0 }}
              whileInView={{ scale: 1, transition: { delay: 1, type: 'spring', stiffness: 250, damping: 15 } }}
              viewport={{ once: true }}
            >
              <motion.div
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#47FFE7] border-2 border-[#47FFE7]/50 flex items-center justify-center z-20"
                style={glowStyle}
                animate={{
                  boxShadow: [
                    '0 0 30px rgba(71, 255, 231, 0.4)',
                    '0 0 50px rgba(71, 255, 231, 0.7)',
                    '0 0 30px rgba(71, 255, 231, 0.4)',
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              >
                <SmilePlus className="w-10 h-10 sm:w-12 sm:h-12 text-black" />
                <motion.div className="absolute -right-10 top-1/2 -translate-y-1/2 w-20 h-20 rounded-full border-2 border-[#47FFE7] overflow-hidden bg-white z-10">
                  <img
                    src="https://res.cloudinary.com/db17zxsjc/image/upload/v1751448711/mesii_airmbm.png"
                    alt="User Face"
                    className="w-full h-full object-cover"
                  />
                </motion.div>
              </motion.div>
            </motion.div>

            {/* Bottom Image (Swapped) */}
            <motion.div
              className="w-56 sm:w-80 rounded-2xl p-1.5 z-10"
              style={{ background: 'rgba(71, 255, 231, 0.1)' }}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0, transition: { delay: 0.6, duration: 0.8 } }}
              viewport={{ once: true }}
            >
              <div className="rounded-xl" style={glowStyle}>
                <img
                  src="https://res.cloudinary.com/db17zxsjc/image/upload/v1751443919/718b53fb4b884bafa139275c46a88841_faceswap_output_hiyqeu.webp"
                  alt="Faceswapped Thumbnail"
                  className="w-full h-full object-cover rounded-xl"
                />
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default Features;