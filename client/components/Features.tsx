import React, { useState, useRef, useEffect } from 'react';
import { motion, useScroll, useTransform, useInView, AnimatePresence } from 'framer-motion';
import { ArrowRight, Play, Sparkles, TrendingUp, Share2, BarChart3 } from 'lucide-react';

const HowItWorks = () => {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const steps = [
    {
      id: 1,
      title: "Design Your Character",
      subtitle: "Upload photos of yourself, friends, or fictional characters to create a unique digital persona. Complete with a bio that sets the stage for meaningful interactions.",
      buttonText: "Start Creating Now",
      image: "https://res.cloudinary.com/deoxpvjjg/image/upload/v1756033329/herox_xq8x8r.png",
      features: ["Upload multiple photos", "AI-powered training", "Custom personality", "Bio generation"]
    },
    {
      id: 2,
      title: "Generate Content",
      subtitle: "Utilize our user-friendly tools to effortlessly craft posts, images, and videos. Now with our new Subject Swap workflow, you can replace people in your videos with your AI influencer for even more creative possibilities.",
      buttonText: "Try Content Tools",
      image: "https://res.cloudinary.com/deoxpvjjg/image/upload/v1756033329/herox_xq8x8r.png",
      features: [
        { name: "Subject Swap", desc: "Replace people in videos with your AI influencer using our advanced subject swap technology. Create engaging videos with just a few clicks." },
        { name: "Ultra Realistic Videos (Ver. 2)", desc: "Generate ultra-realistic videos with Google's latest Ver 2 model, supporting both image-to-video and text-to-video generation." },
        { name: "Virtual Wardrobe", desc: "Try different outfits without physical clothes" },
        { name: "Face Swap", desc: "Seamlessly swap faces in photos and videos" }
      ]
    },
    {
      id: 3,
      title: "Make Profit",
      subtitle: "Your influencer will do it by themselves while you're not around - chatting and selling exclusive content, so you don't have to.",
      buttonText: "View Earning Potential",
      image: "https://res.cloudinary.com/deoxpvjjg/image/upload/v1756033329/herox_xq8x8r.png",
      features: ["Automated interactions", "Content monetization", "24/7 availability", "Revenue tracking"]
    },
    {
      id: 4,
      title: "Spread the Word",
      subtitle: "Share your digital persona across social media platforms, online communities, or wherever potential fans hang out.",
      buttonText: "Start Creating",
      image: "https://res.cloudinary.com/deoxpvjjg/image/upload/v1756033329/herox_xq8x8r.png",
      platforms: ["Instagram", "YouTube", "Snapchat", "TikTok"]
    },
    {
      id: 5,
      title: "Watch Your Earnings Climb",
      subtitle: "Monitor your financial progress with our straightforward dashboard, featuring real-time analytics and multiple cash-out options.",
      buttonText: "Get Started Now",
      features: ["Real-time analytics", "Multiple payout methods", "Revenue optimization", "Performance insights"]
    }
  ];

  return (
    <div ref={containerRef} className="min-h-screen bg-black text-white overflow-hidden">
      {/* Header Section */}
      <motion.div 
        className="text-center py-20 px-6"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: "easeOut" }}
      >

        <motion.h1 
          className="text-5xl md:text-7xl font-bold mb-6 tracking-tight"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, delay: 0.2 }}
        >
          How It Works
        </motion.h1>

        <motion.p 
          className="text-xl text-zinc-400 max-w-2xl mx-auto font-light mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.4 }}
        >
          Everything you'll need to create a unique AI influencer
        </motion.p>
      </motion.div>

      {/* Steps Section */}
      <div className="max-w-7xl mx-auto px-6">
        {steps.map((step, index) => (
          <StepSection key={step.id} step={step} index={index} />
        ))}
      </div>
    </div>
  );
};

const StepSection = ({ step, index }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, amount: 0.3 });
  const isEven = index % 2 === 0;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.8,
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { 
      opacity: 0, 
      y: 50,
      x: isEven ? -50 : 50
    },
    visible: {
      opacity: 1,
      y: 0,
      x: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut"
      }
    }
  };

  const imageVariants = {
    hidden: { 
      opacity: 0, 
      scale: 0.8,
      x: isEven ? 50 : -50
    },
    visible: {
      opacity: 1,
      scale: 1,
      x: 0,
      transition: {
        duration: 1,
        ease: "easeOut"
      }
    }
  };

  return (
    <motion.div
      ref={ref}
      className={`grid lg:grid-cols-2 gap-12 items-center py-20 ${!isEven ? 'lg:flex-row-reverse' : ''}`}
      variants={containerVariants}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
    >
      {/* Content */}
      <motion.div 
        className={`${!isEven ? 'lg:order-2' : ''} space-y-8`}
        variants={itemVariants}
      >
        <motion.div
          className="inline-flex items-center gap-2 bg-[#B08D57]/10 border border-[#B08D57]/20 rounded-full px-4 py-2"
          whileHover={{ scale: 1.05 }}
        >
          <span className="text-sm font-medium text-[#B08D57]">Step {step.id}</span>
        </motion.div>

        <motion.h2 
          className="text-4xl md:text-5xl font-bold tracking-tight"
          variants={itemVariants}
        >
          {step.title}
        </motion.h2>

        <motion.p 
          className="text-xl text-zinc-400 leading-relaxed"
          variants={itemVariants}
        >
          {step.subtitle}
        </motion.p>

        {/* Features List */}
        {step.features && (
          <motion.div className="space-y-4" variants={itemVariants}>
            {step.features.map((feature, idx) => (
              <motion.div
                key={idx}
                className="flex items-start gap-3"
                initial={{ opacity: 0, x: -20 }}
                animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                transition={{ delay: idx * 0.1 + 0.5 }}
              >
                <div className="w-2 h-2 rounded-full bg-[#B08D57] mt-3 flex-shrink-0" />
                <div>
                  {typeof feature === 'object' ? (
                    <>
                      <div className="font-semibold text-white">{feature.name}</div>
                      <div className="text-zinc-400 text-sm">{feature.desc}</div>
                    </>
                  ) : (
                    <div className="text-zinc-300">{feature}</div>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        <motion.button
          className="group bg-[#B08D57] text-black px-8 py-4 rounded-full font-semibold hover:bg-[#B08D57]/90 transition-all duration-300 flex items-center gap-2"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          variants={itemVariants}
        >
          {step.buttonText}
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </motion.button>
      </motion.div>

      {/* Visual */}
      <motion.div className={`${!isEven ? 'lg:order-1' : ''} relative`} variants={imageVariants}>
  {step.id === 1 && <Step1Visual image={step.image} />}
  {step.id === 2 && <Step2Visual image={step.image} />}
  {step.id === 3 && <Step3Visual image={step.image} />}
  {step.id === 4 && <Step4Visual image={step.image} />}
  {step.id === 5 && <Step5Visual />}
</motion.div>
    </motion.div>
  );
};

const Step1Visual = ({ image }: { image: string }) => (
  <motion.div 
    className="relative bg-gradient-to-br from-zinc-900 to-black rounded-3xl border border-zinc-800 max-w-lg mx-auto"
    whileHover={{ rotateY: 5, rotateX: 5 }}
    style={{ transformStyle: 'preserve-3d' }}
  >
    <motion.img 
      src={image}
      alt="Step 1 visual"
      className="rounded-2xl shadow-lg w-full object-cover"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8 }}
    />
  </motion.div>
);

const Step2Visual = ({ image }: { image: string }) => (
  <motion.div 
    className="relative bg-gradient-to-br from-zinc-900 to-black rounded-3xl border border-zinc-800 max-w-lg mx-auto"
    whileHover={{ rotateY: -5, rotateX: 5 }}
    style={{ transformStyle: 'preserve-3d' }}
  >
    <motion.img 
      src={image}
      alt="Step 2 visual"
      className="rounded-2xl shadow-lg w-full object-cover"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8 }}
    />
  </motion.div>
);

const Step3Visual = ({ image }: { image: string }) => (
  <motion.div 
    className="relative bg-gradient-to-br from-zinc-900 to-black rounded-3xl  border border-zinc-800 max-w-lg mx-auto"
    whileHover={{ rotateY: 5, rotateX: -5 }}
    style={{ transformStyle: 'preserve-3d' }}
  >
    <motion.img 
      src={image}
      alt="Step 3 visual"
      className="rounded-2xl shadow-lg w-full object-cover"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8 }}
    />
  </motion.div>
);

const Step4Visual = ({ image }: { image: string }) => (
  <motion.div 
    className="relative bg-gradient-to-br from-zinc-900 to-black rounded-3xl  border border-zinc-800 max-w-lg mx-auto"
    whileHover={{ rotateY: 5, rotateX: -5 }}
    style={{ transformStyle: 'preserve-3d' }}
  >
    <motion.img 
      src={image}
      alt="Step 4 visual"
      className="rounded-2xl shadow-lg w-full object-cover"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8 }}
    />
  </motion.div>
);


const Step5Visual = () => (
  <motion.div 
    className="relative bg-gradient-to-br from-zinc-900 to-black rounded-3xl p-5 border border-zinc-800 max-w-lg mx-auto"
    whileHover={{ rotateY: -5, rotateX: 5 }}
    style={{ transformStyle: 'preserve-3d' }}
  >
    <div className="relative z-10">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Analytics Dashboard</h3>
        <BarChart3 className="w-6 h-6 text-[#B08D57]" />
      </div>
      <div className="flex items-end gap-2 h-24 mb-4">
        {[1,2,3,4,5,6,7,8].map((i) => (
          <motion.div
            key={i}
            className="flex-1 bg-gradient-to-t from-[#B08D57] to-[#B08D57]/50 rounded-t"
            initial={{ height: 0 }}
            animate={{ height: `${Math.random() * 80 + 20}%` }}
            transition={{ delay: i * 0.1, type: "spring" }}
          />
        ))}
      </div>
      <div className="text-2xl font-bold text-[#B08D57]">$72,847</div>
      <div className="text-sm text-zinc-400">Total Earnings</div>
    </div>
  </motion.div>
);

export default HowItWorks;