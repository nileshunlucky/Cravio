"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

const TestimonialsSection = () => {
  const testimonials = [
    {
      name: "MrBeast",
      handle: "@MrBeast",
      text: "The quality of these clips is actually insane. Mellvitta has completely streamlined how we turn long videos into viral shorts. It's the first AI that truly understands pacing and hook potential.",
      rating: 5,
      image: "https://www.tvline.com/tvline/news/beast-games-mrbeast-series-order-prime-video-1235189479/mrbeast-amazon-prime.jpg" 
    },
    {
      name: "IShowSpeed",
      handle: "@ishowspeed",
      text: "YO THIS IS CRAZY! It finds the funniest moments from my 4-hour streams and makes them into clips instantly. I don't even have to hire an editor anymore. Mellvitta is a W!",
      rating: 5,
      image: "https://static.wikia.nocookie.net/caseoh/images/e/ef/IShowSpeed.jpg" 
    },
    {
      name: "Iman Gadzhi",
      handle: "@ImanGadzhi",
      text: "Efficiency is the bedrock of a high-performance brand. Mellvitta allows us to scale our short-form output by converting our long-form assets into premium clips effortlessly.",
      rating: 5,
      image: "https://tvovermind.com/wp-content/uploads/2025/08/iman.jpg" 
    },
  ];

  return (
    <div className="min-h-screen bg-black text-white font-sans py-24 px-6 relative overflow-hidden">
      {/* Background Teal Glow Removed */}

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-bold mb-4 tracking-tight">
            Don&apos;t <span className="text-white underline decoration-white/20">Just</span> Take <br /> Our Word for It
          </h2>
          <p className="text-zinc-500 text-lg font-medium">Here&apos;s what our users say:</p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1, duration: 0.5 }}
              className="bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] p-8 flex flex-col h-full hover:border-white/40 transition-all duration-300 group shadow-none"
            >
              {/* Stars - Modern White/zinc style */}
              <div className="flex gap-1 mb-6">
                {[...Array(item.rating)].map((_, i) => (
                  <Star
                    key={i}
                    size={18}
                    className="fill-white text-white"
                  />
                ))}
              </div>

              {/* Content */}
              <div className="flex-grow">
                <h4 className="text-xl font-bold mb-4 leading-tight text-white">
                  {idx === 0 ? "Game changing quality" : 
                   idx === 1 ? "Absolutely Insane Speed" : 
                   "Premium Brand Consistency"}
                </h4>
                <p className="text-zinc-300 text-[15px] mb-8 leading-relaxed">
                  {item.text}
                </p>
              </div>

              {/* Footer / User Info */}
              <div className="flex items-center gap-4 mt-auto pt-6 border-t border-white/10">
                <div className="relative">
                  <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 p-1">
                    <img 
                      src={item.image} 
                      alt={item.name}
                      className="w-full h-full rounded-full object-cover transition-all duration-500"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${item.name}&background=333&color=fff`;
                      }}
                    />
                  </div>
                </div>
                <div>
                  <p className="font-bold text-base text-white">
                    {item.name}
                  </p>
                  <p className="text-xs text-zinc-500 lowercase">
                    {item.handle}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TestimonialsSection;