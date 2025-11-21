"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check} from 'lucide-react';
import { useUser } from '@clerk/nextjs';

interface FeatureItem {
    name: string;
    included: boolean;
}

interface Features {
    aura: {
        monthly: number;
        yearly: number;
    };
    list: FeatureItem[];
}

interface PricingCardProps {
    plan: string;
    price: {
        monthly: number;
        yearly: number;
    };
    features: Features;
    isPopular: boolean;
    buttonText: string;
    urls: {
        monthly: string;
        yearly: string;
    };
    delay: number;
    isYearly: boolean;
}

const PricingCard: React.FC<PricingCardProps> = ({
    plan,
    price,
    features,
    isPopular,
    buttonText,
    urls,
    delay,
    isYearly
}) => {
    const currentPrice = isYearly ? price.yearly : price.monthly;
    const monthlyPrice = isYearly ? Math.round(price.yearly / 12) : price.monthly;
    const originalYearlyPrice = price.monthly * 12;
    const currentAura = isYearly ? features.aura.yearly : features.aura.monthly;
    const currentUrl = isYearly ? urls.yearly : urls.monthly;

    const cardVariants = {
        hidden: { opacity: 0, y: 50 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.8,
                delay: delay,
                ease: "easeOut"
            }
        }
    };

    const glowVariants = {
        initial: {
            boxShadow: "0 0 0 rgba(176, 141, 87, 0)",
            backgroundColor: "rgba(30, 30, 30, 0.8)"
        },
        animate: {
            boxShadow: isPopular
                ? [
                    "0 10px 30px rgba(176, 141, 87, 0.3)",
                    "0 0 0 rgba(176, 141, 87, 0)",
                    "0 10px 30px rgba(176, 141, 87, 0.3)"
                ]
                : "0 0 0 rgba(71, 255, 231, 0)",
            backgroundColor: isPopular
                ? "rgba(0, 0, 0, 0.9)"
                : "rgba(30, 30, 30, 0.8)",
            transition: {
                duration: 2,
                repeat: Infinity,
                repeatType: "reverse" as const,
                ease: "easeInOut"
            }
        }
    };

    return (
        <motion.div
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            className="relative h-full "
            style={{ pointerEvents: 'auto' }}
        >
            {/* Most Popular Badge */}
            {isPopular && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{
                        delay: delay + 0.3,
                        duration: 0.8,
                        ease: [0.23, 1, 0.32, 1] // Custom luxury easing
                    }}
                    className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-30 border"
                    style={{ pointerEvents: 'none' }}
                >
                    <div className="relative group">
                        {/* Subtle glow effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-white/30 to-white/20 rounded-full blur-xl opacity-60 group-hover:opacity-80 transition-opacity duration-700"></div>

                        {/* Subtle accent line */}
<<<<<<< HEAD
                        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-12 h-px bg-gradient-to-br from-transparent via-[#3B82F6]/50 to-transparent"></div>
=======
                        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-12 h-px bg-gradient-to-br from-transparent via-white/50 to-transparent"></div>
>>>>>>> b78e91e0cc939734ae08fa872a4de2265290df28
                    </div>
                </motion.div>
            )}


            <motion.div
                variants={glowVariants}
                initial="initial"
                animate="animate"
                className={`relative rounded-2xl p-6 sm:p-8 h-full backdrop-blur-sm border-2 overflow-hidden ${isPopular
<<<<<<< HEAD
                    ? 'border-[#3B82F6] bg-black/80'
=======
                    ? 'border-white/20 bg-black/80'
>>>>>>> b78e91e0cc939734ae08fa872a4de2265290df28
                    : 'border-zinc-700 bg-zinc-900/80'
                    }`}
                style={{ pointerEvents: 'auto' }}
            >
                {/* Background Pattern */}
                <div
                    className="absolute inset-0 opacity-5"
                    style={{ pointerEvents: 'none' }}
                >
<<<<<<< HEAD
                    <div className="absolute inset-0 bg-gradient-to-br from-[#3B82F6] via-transparent to-transparent"></div>
=======
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent"></div>
>>>>>>> b78e91e0cc939734ae08fa872a4de2265290df28
                </div>

                {/* Plan Name and Discount */}
                <div className={` flex justify-start items-center gap-3 mb-6 relative z-10 ${isPopular ? 'mt-6' : 'mt-4'}`}>
                    <motion.h3
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: delay + 0.3, duration: 0.6 }}
                        className={`text-2xl font-bold mb-2 text-white`}
                        style={{
                            filter: isPopular
                                ? '0 0 30px rgba(71, 255, 231, 0.1)'
                                : '0 0 30px rgba(255, 255, 255, 0.1)',
                            pointerEvents: 'auto'
                        }}

                    >
                        {plan}
                    </motion.h3>

                    {isYearly && (
                        // #5C0A14, #BC2120, #9B111E
                        <motion.span
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: delay + 0.4, duration: 0.6 }}
                            className="text-blue-500 font-semibold text-xl sm:text-2xl select-text drop-shadow-[0_0_6px_blue]"
                            style={{ pointerEvents: 'auto' }}
                        >
                            -40%
                        </motion.span>
                    )}
                </div>

                {/* Pricing */}
                <div className="text-left mb-6 relative z-10">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: delay + 0.5, duration: 0.8, ease: "backOut" }}
                        className="flex items-baseline gap-2 mb-2"
                        style={{ pointerEvents: 'auto' }}
                    >
                        <AnimatePresence mode="wait">
                            {isYearly && (
                                <motion.span
                                    key="yearly-original"
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    className="text-zinc-500 text-lg line-through select-text"
                                >
                                    ${Math.round(originalYearlyPrice / 12)}
                                </motion.span>
                            )}
                        </AnimatePresence>
                        <motion.span
                            key={`price-${isYearly}`}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5 }}
<<<<<<< HEAD
                            className={`text-4xl sm:text-5xl font-bold ${isPopular ? 'bg-gradient-to-r from-[#1E3A8A] via-[#3B82F6] to-[#1E40AF]  text-transparent bg-clip-text' : 'text-white'
                                }`}
=======
                className={`text-4xl sm:text-5xl font-bold ${isPopular ? 'text-white' : 'text-white'
                    }`}
>>>>>>> b78e91e0cc939734ae08fa872a4de2265290df28
                            style={isPopular ? { filter: '0 0 30px rgba(71, 255, 231, 0.1)' } : { filter: '0 0 30px rgba(255, 255, 255, 0.1)' }}
                        >
                            ${monthlyPrice}
                        </motion.span>
                        <span className=" text-base select-text">/mo</span>
                    </motion.div>
                    <AnimatePresence>
                        {isYearly && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="text-zinc-400 text-sm select-text"
                            >
                                Billed annually ${currentPrice}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Aura Info */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: delay + 0.7, duration: 0.6 }}
                    className="mb-6 relative z-10"
                >
                    <div className="text-zinc-300 text-sm mb-4 select-text flex items-center gap-1" style={{ pointerEvents: 'auto' }}>
                        Curate {' '}
                        <motion.span
                            key={`aura-${isYearly}`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
<<<<<<< HEAD
                            className="bg-gradient-to-r from-[#1E3A8A] via-[#3B82F6] to-[#1E40AF]  text-transparent bg-clip-text font-bold flex items-center"
=======
                            className="text-white font-bold flex items-center"
>>>>>>> b78e91e0cc939734ae08fa872a4de2265290df28
                        >
                                                <svg
    width="32"
    height="32"
    viewBox="0 0 400 400"
    className="w-8 h-8 flex-shrink-0"
    style={{ minWidth: '32px', minHeight: '32px' }}
>
<<<<<<< HEAD
  <defs>
    <linearGradient id="redGradient-mobile" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stopColor="#1E3A8A" />
      <stop offset="50%" stopColor="#3B82F6" />
      <stop offset="100%" stopColor="#1E40AF" />
    </linearGradient>
  </defs>
  <path
    d="M200 40 Q220 160 240 180 Q290 190 340 200 
       Q290 210 240 220 Q220 240 200 360 
       Q180 240 160 220 Q110 210 60 200 
       Q110 190 160 180 Q180 160 200 40 Z"
    fill="url(#redGradient-mobile)"
    stroke="#3B82F6"
    strokeWidth="2"
  />
=======
    <path
        d="M200 40 Q220 160 240 180 Q290 190 340 200 
             Q290 210 240 220 Q220 240 200 360 
             Q180 240 160 220 Q110 210 60 200 
             Q110 190 160 180 Q180 160 200 40 Z"
        fill="#FFFFFF"
        stroke="#FFFFFF"
        strokeWidth="2"
    />
>>>>>>> b78e91e0cc939734ae08fa872a4de2265290df28
</svg>

                            {currentAura.toLocaleString()} Credit
                        </motion.span>{' '}
                        per {isYearly ? 'year' : 'month'}.
                    </div>

                    {/* CTA Button */}
                    <a href={currentUrl}>
                            <motion.button
                            whileHover={{
                                scale: 1.02,
                                y: -2,
                                boxShadow: isPopular
                                    ? "0 10px 30px rgba(176, 141, 87, 0.3)"
                                    : "0 10px 30px rgba(176, 141, 87, 0.3)"
                            }}
                            whileTap={{ scale: 0.98 }}
<<<<<<< HEAD
                            className={`group relative inline-flex items-center justify-center z-20 w-full py-3 sm:py-4 px-4 sm:px-6 rounded-xl font-bold text-center transition-all duration-300 cursor-pointer text-white ${isPopular
                                ? 'bg-gradient-to-r from-[#1E3A8A] via-[#3B82F6] to-[#1E40AF]    hover:bg-[#3B82F6]/80 shadow-lg'
=======
                            className={`group relative inline-flex items-center justify-center z-20 w-full py-3 sm:py-4 px-4 sm:px-6 rounded-xl font-bold text-center transition-all duration-300 cursor-pointer ${isPopular
                                ? 'bg-white text-black hover:bg-white/90 shadow-lg'
>>>>>>> b78e91e0cc939734ae08fa872a4de2265290df28
                                : 'bg-zinc-800 text-white   hover:bg-zinc-800 '
                                }`}
                            type="button"
                            role="button"
                            aria-label={`${buttonText} for ${plan} plan`}
                            style={{ pointerEvents: 'auto' }}
                        >
                            {/* Button Background */}
<<<<<<< HEAD
                            {isPopular && <div className="absolute inset-0 bg-gradient-to-r from-[#1E3A8A] via-[#3B82F6] to-[#1E40AF]  rounded-2xl blur-xl opacity-60 group-hover:opacity-80 transition-opacity duration-500" />}
=======
                            {isPopular && <div className="absolute inset-0 bg-white/20 rounded-2xl blur-xl opacity-60 group-hover:opacity-80 transition-opacity duration-500" />}
>>>>>>> b78e91e0cc939734ae08fa872a4de2265290df28
                            {buttonText}
                        </motion.button>
                    </a>
                </motion.div>

                {/* Features List */}
                <div className="space-y-3 relative z-10">
                    {features.list.map((feature, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{
                                delay: delay + 0.8 + (index * 0.08),
                                duration: 0.6,
                                ease: "easeOut"
                            }}
                            className="flex items-center gap-3"
                            style={{ pointerEvents: 'auto' }}
                        >
                            <div className="flex-shrink-0">
                                {feature.included ? (
<<<<<<< HEAD
                                    <div className="w-5 h-5 rounded-full bg-gradient-to-r from-[#1E3A8A] via-[#3B82F6] to-[#1E40AF] flex items-center justify-center">
                                        <Check className="w-3 h-3 text-white" />
=======
                                    <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center">
                                        <Check className="w-3 h-3 text-black" />
>>>>>>> b78e91e0cc939734ae08fa872a4de2265290df28
                                    </div>
                                ) : (
                                    <div className="w-5 h-5 rounded-full bg-zinc-700 flex items-center justify-center">
                                       <Check className="w-3 h-3 text-white" />
                                    </div>
                                )}
                            </div>
                            <span className={`text-sm flex-1 select-text ${feature.included ? 'text-zinc-200' : 'text-zinc-500'
                                }`}>
                                {feature.name}
                            </span>
                        </motion.div>
                    ))}
                </div>

                {/* Glow Effect Overlay for Popular Card */}
                {isPopular && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0, 0.3, 0] }}
                        transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
<<<<<<< HEAD
                        className="absolute inset-0 bg-gradient-to-br from-[#3B82F6]/10 via-transparent to-[#3B82F6]/10 rounded-2xl"
=======
                        className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-white/10 rounded-2xl"
>>>>>>> b78e91e0cc939734ae08fa872a4de2265290df28
                        style={{ pointerEvents: 'none' }}
                    />
                )}
            </motion.div>
        </motion.div>
    );
};

const Page = () => {
    const [isClient, setIsClient] = useState(false);
    const [isYearly, setIsYearly] = useState(true);

    const { user } = useUser();
    const email = user?.emailAddresses[0]?.emailAddress || '';

    useEffect(() => {
        setIsClient(true);
    }, []);

    const plans = [
        {
            plan: "Premium",
            price: {
                monthly: 25,
                yearly: 180
            },
            urls: {
                monthly: `https://mellvitta.lemonsqueezy.com/buy/1e69aebb-1eaf-4c10-be06-ff479ab4137f?checkout[email]=${encodeURIComponent(email)}`,
                yearly: `https://mellvitta.lemonsqueezy.com/buy/7a5edd94-7fef-4006-ad70-33bbb7ee26ee?checkout[email]=${encodeURIComponent(email)}`
            },
            isPopular: true,
            buttonText: "Subscribe",
            features: {
                aura: {
                    monthly: 250,
                    yearly: 3000
                },
                    list: [
                    { name: "Upload Chart", included: true },
                    { name: "Winning Probability", included: true },
                    { name: "Predicts P&L (BUY/SELL, Stop Loss, Target)", included: true },
                    { name: "Risk Management", included: true },
                    { name: "Data Analysis", included: true },
                    { name: "Real-time market insights", included: true },
                ]
            }
        },
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                duration: 1,
                staggerChildren: 0.15
            }
        }
    };

    const titleVariants = {
        hidden: { opacity: 0, y: -40 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 1,
                ease: "easeOut"
            }
        }
    };

    const toggleVariants = {
        hidden: { opacity: 0, scale: 0.9 },
        visible: {
            opacity: 1,
            scale: 1,
            transition: {
                delay: 0.5,
                duration: 0.8,
                ease: "backOut"
            }
        }
    };

    // Pre-defined particle positions to avoid hydration mismatch
    const particlePositions = [
        { left: 7.17, top: 11.71 },
        { left: 83.17, top: 27.67 },
        { left: 17.48, top: 7.38 },
        { left: 33.40, top: 57.26 },
        { left: 87.97, top: 94.13 },
        { left: 44.38, top: 71.92 }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black relative overflow-hidden">
            {/* Background Pattern */}
            <div
                className="absolute inset-0 opacity-30"
                style={{ pointerEvents: 'none' }}
            >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(176,141,87,0.15),transparent_50%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(176,141,87,0.15),transparent_50%)]" />
            </div>

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="relative z-10 container mx-auto px-4 py-8 sm:py-16"
                style={{ pointerEvents: 'auto' }}
            >
                <motion.div
                    variants={titleVariants}
                    className="text-center mb-8 sm:mb-12"
                >
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 text-white drop-shadow-lg select-text">
                        Select Your Plan
                    </h1>
                </motion.div>

                {/* Premium Toggle */}
                <motion.div variants={toggleVariants} className="flex justify-center mb-12">
<<<<<<< HEAD
                    <div className="relative bg-[#0f0f0f] border-2 border-[#3B82F6]/50 p-2 rounded-xl">
                        <motion.div
                            className="absolute inset-y-2 bg-gradient-to-r from-[#1E3A8A] via-[#3B82F6] to-[#1E40AF]  text-white rounded-lg"
=======
                    <div className="relative bg-[#0f0f0f] border-2 border-white/10 p-2 rounded-xl">
                        <motion.div
                            className="absolute inset-y-2 bg-white/20 text-black rounded-lg"
>>>>>>> b78e91e0cc939734ae08fa872a4de2265290df28
                            animate={{
                                x: isYearly ? "calc(100% - 8px)" : "8px",
                                width: "calc(50% - 8px)"
                            }}
                            transition={{ type: "spring", stiffness: 450, damping: 32 }}
                        />
                        <div className="relative flex">
                            <button
                                onClick={() => setIsYearly(false)}
                                className={`relative z-10 px-12 py-4 font-light tracking-[0.08em] transition-all duration-400 uppercase text-xs text-white`}
                            >
                                Monthly
                            </button>
                            <button
                                onClick={() => setIsYearly(true)}
                                className={`relative z-10 px-12 py-4 font-light tracking-[0.08em] transition-all duration-400 uppercase text-xs text-white`}
                            >
                                Yearly
                            </button>
                        </div>
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-7xl mx-auto">
                    <AnimatePresence mode="wait">
                        {plans.map((plan, index) => (
                            <PricingCard
                                key={`${plan.plan}-${isYearly ? 'yearly' : 'monthly'}`}
                                {...plan}
                                isYearly={isYearly}
                                delay={index * 0.2}
                            />
                        ))}
                    </AnimatePresence>
                </div>
            </motion.div>

            {/* Floating Particles Effect */}
            {isClient && (
                <div
                    className="absolute inset-0"
                    style={{ pointerEvents: 'none' }}
                >
                    {particlePositions.map((position, i) => (
                        <motion.div
                            key={i}
<<<<<<< HEAD
                            className="absolute w-1 h-1 bg-[#3B82F6] rounded-full opacity-60"
=======
                            className="absolute w-1 h-1 bg-white/60 rounded-full opacity-60"
>>>>>>> b78e91e0cc939734ae08fa872a4de2265290df28
                            style={{
                                left: `${position.left}%`,
                                top: `${position.top}%`,
                                pointerEvents: 'none'
                            }}
                            animate={{
                                y: [0, -20, 0],
                                opacity: [0.3, 0.8, 0.3],
                            }}
                            transition={{
                                duration: 3 + (i * 0.2),
                                repeat: Infinity,
                                delay: i * 0.3,
                            }}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default Page;