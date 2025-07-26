import React from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { Palette } from 'lucide-react';
import Link from 'next/link';

const Features = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 1,
        ease: "easeOut"
      },
    },
  };

  // Premium prompt examples
  const prompts = [
    "Elegant minimalist workspace with golden accents",
    "Luxury lifestyle content with sophisticated lighting",
    "Premium brand aesthetic with cinematic depth"
  ];

  const [currentPrompt, setCurrentPrompt] = React.useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPrompt((prev) => (prev + 1) % prompts.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Animated connection path
  const pathRef = React.useRef<SVGPathElement | null>(null);
  const progress = useMotionValue(0);

  React.useEffect(() => {
    const path = pathRef.current as SVGPathElement | null;
    if (path) {
      const length = path.getTotalLength();
      const animation = animate(progress, length, {
        delay: 1.5,
        duration: 3,
        ease: "easeInOut",
        repeat: Infinity,
        repeatType: "loop",
        repeatDelay: 2,
      });
      return () => animation.stop();
    }
  }, [pathRef, progress]);

  const x = useTransform(progress, (val) => pathRef.current?.getPointAtLength(val).x);
  const y = useTransform(progress, (val) => pathRef.current?.getPointAtLength(val).y);

  return (
    <div className="text-white py-32 px-6 overflow-hidden relative">
      {/* Subtle background elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-20 w-40 h-40 rounded-full bg-[#B08D57] blur-3xl" />
        <div className="absolute bottom-20 right-20 w-60 h-60 rounded-full bg-[#B08D57] blur-3xl" />
      </div>

      <div className="container mx-auto max-w-7xl">
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-2 gap-20 lg:gap-16 items-center"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={containerVariants}
        >
          {/* Left Column: Premium Content */}
          <motion.div className="flex flex-col gap-10 text-center lg:text-left" variants={containerVariants}>

            {/* Premium Headline */}
            <motion.h2
              className="text-5xl md:text-6xl lg:text-7xl font-extralight leading-[0.95] tracking-tight"
              variants={itemVariants}
            >
              Craft Your{' '}
              <span className="text-[#B08D57] font-light relative">
                Signature
                <motion.div
                  className="absolute -bottom-2 left-0 w-full h-0.5 bg-[#B08D57]"
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  transition={{ delay: 1.5, duration: 0.8 }}
                />
              </span>
              <br />
              with <span className="text-[#B08D57] font-light">Precision</span>
            </motion.h2>

            {/* Refined Description */}
            <motion.p
              className="text-xl md:text-2xl text-zinc-300 font-light leading-relaxed max-w-2xl mx-auto lg:mx-0"
              variants={itemVariants}
            >
              Select your distinguished persona and articulate your vision through
              <span className="text-[#B08D57]"> meticulously crafted prompts</span>.
              Our AI atelier transforms your concepts into
              <span className="text-[#B08D57]"> extraordinary visual narratives</span>.
            </motion.p>

            {/* Premium Prompt Display */}
            <motion.div
              variants={itemVariants}
              className="relative p-6 rounded-2xl bg-zinc-900/50 backdrop-blur-sm border border-[#B08D57]/20 mx-auto lg:mx-0 max-w-2xl"
            >
              <div className="flex items-center gap-3 mb-4">
                <Palette className="w-5 h-5 text-[#B08D57]" />
                <span className="text-sm font-light text-zinc-400 tracking-wide">PROMPT EXCELLENCE</span>
              </div>

              <motion.p
                key={currentPrompt}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 1.2, ease: 'easeInOut' }}
                className="text-lg font-light text-white leading-relaxed"
              >
                &quot;{prompts[currentPrompt]}&quot;
              </motion.p>

              <div className="flex gap-2 mt-4">
                {prompts.map((_, idx) => (
                  <div
                    key={idx}
                    className={`w-2 h-2 rounded-full transition-colors duration-500 ${idx === currentPrompt ? 'bg-[#B08D57]' : 'bg-zinc-600'
                      }`}
                  />
                ))}
              </div>
            </motion.div>

            {/* Premium CTA */}
            <motion.div variants={itemVariants} className="pt-8">
              <Link href="/admin/canvas">
                <motion.button
                  className="group inline-flex items-center px-12 py-5 bg-[#B08D57] text-black font-medium text-lg tracking-wide relative overflow-hidden"
                  whileHover={{
                    scale: 1.02,
                    boxShadow: "0 15px 50px rgba(176, 141, 87, 0.4)"
                  }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.3 }}
                >
                  <span className="relative z-10 mr-3">BEGIN CREATING</span>
                  <div className="absolute inset-0  opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </motion.button>
              </Link>
            </motion.div>
          </motion.div>

          {/* Right Column: Visual Demonstration */}
          <motion.div className="relative h-[600px] sm:h-[700px] flex flex-col justify-between items-center" variants={itemVariants}>

            {/* Animated Connection Line */}
            <svg
              className="absolute top-0 left-0 w-full h-full z-0"
              viewBox="0 0 400 700"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <motion.path
                ref={pathRef}
                d="M200 140 C 100 250, 300 350, 200 460 C 100 570, 300 650, 200 730"
                stroke="url(#premium-gradient)"
                strokeWidth="3"
                strokeDasharray="12 12"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 2.5, ease: "easeInOut", delay: 1 }}
              />

              {/* Animated Luxury Dot */}
              <motion.circle
                cx={x}
                cy={y}
                r="8"
                fill="#B08D57"
                style={{
                  filter: 'drop-shadow(0 0 15px rgba(176, 141, 87, 0.8))',
                }}
              />

              <defs>
                <linearGradient id="premium-gradient" x1="50%" y1="0%" x2="50%" y2="100%">
                  <stop offset="0%" stopColor="#B08D57" stopOpacity="0.2" />
                  <stop offset="30%" stopColor="#B08D57" stopOpacity="0.8" />
                  <stop offset="70%" stopColor="#B08D57" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#B08D57" stopOpacity="0.2" />
                </linearGradient>
              </defs>
            </svg>

            {/* Top: Persona Selection */}
            <motion.div
              className="relative z-10 text-center"
              initial={{ opacity: 0, y: -40 }}
              whileInView={{ opacity: 1, y: 0, transition: { delay: 0.5, duration: 1 } }}
              viewport={{ once: true }}
            >
              <div className="mb-4">
                <span className="text-sm font-light text-zinc-400 tracking-wider">LISA PERSONA</span>
              </div>

              <motion.div
                className="relative w-32 h-32 mx-auto rounded-full overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, rgba(176, 141, 87, 0.3), rgba(176, 141, 87, 0.1))',
                  padding: '3px'
                }}
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.3 }}
              >
                <div className="w-full h-full rounded-full overflow-hidden relative">
                  <img
                    src="/persona/LisaPersona.png"
                    alt="Lisa Persona"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-br from-[#B08D57]/20 to-transparent" />
                </div>

                {/* Glow effect */}
                <div className="absolute inset-0 rounded-full opacity-70" style={{
                  boxShadow: '0 0 30px rgba(176, 141, 87, 0.5), inset 0 0 30px rgba(176, 141, 87, 0.2)'
                }} />
              </motion.div>

              <p className="mt-4 text-lg font-light text-[#B08D57]">Lisa - Luxury Lifestyle</p>
            </motion.div>



            {/* Bottom: Generated Content */}
            <motion.div
              className="relative z-10 text-center"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0, transition: { delay: 0.8, duration: 1 } }}
              viewport={{ once: true }}
            >
              <div className="mb-4">
                <span className="text-sm font-light text-zinc-400 tracking-wider">CURATED RESULT</span>
              </div>

              <motion.div
                className="relative w-64 h-80 mx-auto rounded-2xl overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, rgba(176, 141, 87, 0.2), rgba(176, 141, 87, 0.05))',
                  padding: '4px'
                }}
                whileHover={{ scale: 1.02, y: -5 }}
                transition={{ duration: 0.4 }}
              >
                <div className="w-full h-full rounded-xl overflow-hidden relative">
                  <img
                    src="/persona/LisaPost.png"
                    alt="Generated luxury post"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />

                </div>

                {/* Luxury glow */}
                <div className="absolute inset-0 rounded-2xl opacity-80" style={{
                  boxShadow: '0 0 40px rgba(176, 141, 87, 0.4), inset 0 0 40px rgba(176, 141, 87, 0.1)'
                }} />
              </motion.div>

              <p className="mt-4 text-lg font-light text-[#B08D57]">Artisanal Excellence</p>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default Features;