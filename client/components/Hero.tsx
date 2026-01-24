"use client";

import React, { useState, useMemo } from "react";
import { Camera, Sparkles, Zap, ArrowRight } from "lucide-react";
import Link from "next/link";

import { ReactNode, MouseEventHandler } from "react";

type ButtonVariant = "primary" | "secondary";

interface ButtonProps {
  children: ReactNode;
  className?: string;
  variant?: ButtonVariant;
  onClick?: MouseEventHandler<HTMLButtonElement>;
}

// Optimized Button Component
const Button = ({
  children,
  className = "",
  variant = "primary",
  onClick,
}: ButtonProps) => {
  const baseStyles =
    "px-10 py-5 text-lg font-bold backdrop-blur-sm transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-white/30 relative overflow-hidden group rounded-full";

  const variantStyles: Record<ButtonVariant, string> = {
    primary:
      "bg-gradient-to-r from-white to-neutral-100 text-black hover:shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:scale-105",
    secondary:
      "bg-white/5 backdrop-blur-md text-white border border-white/20 hover:bg-white/10 hover:border-white/40 hover:scale-105",
  };

  return (
    <button
      onClick={onClick}
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
    >
      <span className="relative z-10 flex items-center gap-2">
        {children}
      </span>
    </button>
  );
};


interface CardProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

// Optimized Card Component
const Card = ({ children, className = "", delay = 0 }: CardProps) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div
      className={`bg-gradient-to-br from-neutral-900/50 to-neutral-950/50 backdrop-blur-xl border border-neutral-800/50 p-8 rounded-3xl shadow-2xl transition-all duration-500 group relative overflow-hidden ${className}`}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0)" : "translateY(20px)",
        transition: `all 0.6s ease-out ${delay}s`,
      }}
      ref={(el) => {
        if (el && !isVisible) {
          const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
              setIsVisible(true);
              observer.disconnect();
            }
          });
          observer.observe(el);
        }
      }}
    >
      <div className="relative z-10">{children}</div>
    </div>
  );
};


export default function GlowUpLanding() {

  // Memoized static data to prevent re-renders
  const features = useMemo(() => [
    {
      icon: Camera,
      title: "Upload & Analyze",
      description: "Upload your photo and let our advanced AI analyze your facial features, structure, and overall aesthetic appeal with precision.",
      step: "STEP ONE",
    },
    {
      icon: Sparkles,
      title: "Get Your Rating",
      description: "Receive a comprehensive attractiveness score with detailed insights on diet, skincare routine, and daily habits to maximize your glow-up potential.",
      step: "STEP TWO",
    },
    {
      icon: Zap,
      title: "Mog Arena",
      description: "Compare two faces side-by-side. See who has model-tier features and discover the winner and mogged based on attrative model looks.",
      step: "STEP THREE",
    },
  ], []);


  const trustIndicators = useMemo(() => [
    "AI-powered analysis",
    "Privacy protected",
    "Model ratings",
  ], []);

  return (
    <div className="min-h-screen bg-black text-white font-sans overflow-hidden relative">
      {/* Optimized background - premium black & white */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-neutral-900 via-black to-black"></div>
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-br from-neutral-800/20 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-neutral-700/20 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:100px_100px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_80%)]"></div>
      </div>

      {/* HERO SECTION */}
      <section className="min-h-screen flex items-center justify-center px-4 py-32 relative z-10">
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <h1 className="text-5xl md:text-8xl lg:text-9xl font-black mb-8 leading-[0.9] tracking-tighter">
            <span className="bg-gradient-to-r from-white via-neutral-200 to-neutral-400 bg-clip-text text-transparent animate-gradient">
              Upload Your Face.
            </span>
            <br />
            <span className="text-white">Get Rated by AI.</span>
            <br />
            <span className="bg-gradient-to-r from-neutral-200 to-neutral-400 bg-clip-text text-transparent">
              Maximize Your Looks.
            </span>
          </h1>

          <p className="text-xs md:text-2xl text-neutral-400 mb-12 max-w-3xl mx-auto font-light leading-relaxed">
            Get an <span className="text-white font-semibold">AI-powered attractiveness rating</span> with personalized glow-up advice.
            <br className="hidden md:block" />
            Discover your true potential with model analysis.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
           <Link href="/admin/dashboard"> <Button className="shadow-2xl shadow-white/10">
              Start Your Glow-Up
              <ArrowRight className="w-5 h-5" />
            </Button></Link>
          </div>

          <div className="flex flex-wrap justify-center gap-6 text-xs text-neutral-500">
            {trustIndicators.map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-neutral-600 rounded-full"></div>
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section className="py-32 px-4 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-7xl lg:text-8xl font-black tracking-tighter mb-6">
              <span className="bg-gradient-to-r from-white via-neutral-300 to-neutral-500 bg-clip-text text-transparent">
                Your Complete
              </span>
              <br />
              <span className="text-white">Glow-Up Journey</span>
            </h2>
            <p className="text-neutral-500 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
              Three simple steps to unlock your maximum aesthetic potential
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {features.map((feature, i) => (
              <Card key={i} delay={i * 0.15} className="h-full">
                <div className="flex items-start justify-between mb-8">
                  <div className="p-4 bg-gradient-to-br from-white/10 to-white/5 rounded-2xl backdrop-blur-sm border border-white/10 hover:scale-110 transition-transform">
                    <feature.icon className="w-8 h-8 stroke-[1.5]" />
                  </div>
                  <div className="text-7xl font-black text-white/10">
                    {i + 1}
                  </div>
                </div>

                <div className="text-xs font-bold mb-4 uppercase tracking-[0.2em] text-neutral-500">
                  {feature.step}
                </div>

                <h3 className="text-2xl md:text-3xl font-bold mb-4 tracking-tight text-white leading-tight">
                  {feature.title}
                </h3>

                <p className="text-neutral-400 text-base md:text-lg leading-relaxed">
                  {feature.description}
                </p>

                <div className="h-1 bg-gradient-to-r from-white/50 to-transparent mt-6 rounded-full w-0 group-hover:w-full transition-all duration-800"></div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* MOG FEATURE HIGHLIGHT */}
      <section className="py-24 px-4 relative z-10">
        <div className="max-w-5xl mx-auto">
          <Card className="bg-gradient-to-br from-neutral-900/60 to-black/80 p-12 md:p-16 text-center border-white/10">
<div className="flex items-center justify-center gap-6 mt-6">
  {/* WINNER */}
  <div className="relative">
    <img
      className="h-30 w-30 rounded-xl object-cover border border-white/20 shadow-lg"
      src="https://i.pinimg.com/736x/cb/74/5b/cb745bf46057d615a7ddfa48532344a0.jpg"
      alt="mog"
    />
    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white text-black text-xs font-black px-3 py-1 rounded-full tracking-wide">
      MOGS
    </span>
  </div>

  {/* VS */}
  <div className="text-neutral-500 font-black text-xl select-none">VS</div>

  {/* MOGGED */}
  <div className="relative">
    <img
      className="h-30 w-30 rounded-xl object-cover border border-red-600/40 shadow-lg grayscale"
      src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQqcAIfnL4KkCGZPVP7qIwXb96sVpCGO-j76Q&s"
      alt="mogged"
    />

    {/* MOGGED LABEL */}
    <div className="absolute top-8 left-0 right-0 bg-black/90 py-1">
      <p className="text-center text-red-500 text-xs font-black tracking-widest">
        MOGGED
      </p>
    </div>
  </div>
</div>
            <h3 className="text-4xl md:text-5xl font-black mb-6 text-white">
              Mog Arena
            </h3>
            <p className="text-neutral-400 text-xs md:text-xl mb-8 max-w-2xl mx-auto">
              Upload two faces and let AI determine who has superior genetics. Compare facial harmony, symmetry, and model-tier features. See who mogs who.
            </p>
           <Link href="/admin/mog"> <Button className="mx-auto">
              GET MOG
            </Button></Link>
          </Card>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-32 px-4 relative z-10">
        <div className="max-w-5xl mx-auto text-center">
          <div className="absolute inset-0 bg-gradient-to-r from-white/5 via-white/10 to-white/5 blur-3xl rounded-full scale-150 -z-10"></div>

          <h2 className="text-4xl md:text-7xl lg:text-8xl font-black mb-8 tracking-tighter leading-[0.95]">
            <span className="bg-gradient-to-r from-white via-neutral-200 to-neutral-400 bg-clip-text text-transparent">
              Unlock Your Potential,
            </span>
            <br />
            <span className="text-white">Start Your Glow-Up.</span>
          </h2>

          <p className="text-xs md:text-2xl text-neutral-400 mb-12 max-w-2xl mx-auto font-light leading-relaxed">
            Join the AI revolution in self-improvement.
            <br className="hidden md:block" />
            Your transformation begins today.
          </p>

         <Link href="/admin/glowup"> <Button className="p-2 text-xl font-bold shadow-[0_0_80px_rgba(255,255,255,0.15)]">
            Glow Up Summary
            <ArrowRight className="w-6 h-6" />
          </Button></Link>

          <p className="mt-8 text-xs text-neutral-600">
            Join 10,000+ people already on their glow-up journey
          </p>
        </div>
      </section>

      <style jsx>{`
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 8s ease infinite;
        }
      `}</style>
    </div>
  );
}