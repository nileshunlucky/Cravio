"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X } from 'lucide-react';
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
            className="relative h-full"
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
                    className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-30"
                    style={{ pointerEvents: 'none' }}
                >
                    <div className="relative group">
                        {/* Subtle glow effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-amber-200/20 via-yellow-100/30 to-amber-200/20 rounded-full blur-xl opacity-60 group-hover:opacity-80 transition-opacity duration-700"></div>

                        {/* Main badge */}
                        <div className="relative bg-gradient-to-r from-[#1a1a1a] via-[#2d2d2d] to-[#1a1a1a] border-3 border-[#B08D57]/30 text-[#B08D57] px-8 py-3 rounded-full font-light tracking-[0.05em] flex items-center gap-3 shadow-2xl backdrop-blur-sm ">

                            {/* Premium typography */}
                            <span className="text-sm font-extralight uppercase tracking-widest whitespace-nowrap">
                                Maison Exclusive
                            </span>
                        </div>

                        {/* Subtle accent line */}
                        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-12 h-px bg-gradient-to-r from-transparent via-[#B08D57]/50 to-transparent"></div>
                    </div>
                </motion.div>
            )}


            <motion.div
                variants={glowVariants}
                initial="initial"
                animate="animate"
                className={`relative rounded-2xl p-6 sm:p-8 h-full backdrop-blur-sm border-2 overflow-hidden ${isPopular
                    ? 'border-[#B08D57] bg-black/80'
                    : 'border-zinc-700 bg-zinc-900/80'
                    }`}
                style={{ pointerEvents: 'auto' }}
            >
                {/* Background Pattern */}
                <div
                    className="absolute inset-0 opacity-5"
                    style={{ pointerEvents: 'none' }}
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-[#B08D57] via-transparent to-transparent"></div>
                </div>

                {/* Plan Name and Discount */}
                <div className={` flex justify-start items-center gap-3 mb-6 relative z-10 ${isPopular ? 'mt-6' : 'mt-4'}`}>
                    <motion.h3
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: delay + 0.3, duration: 0.6 }}
                        className={`text-2xl font-bold mb-2 ${isPopular ? 'text-[#B08D57]' : 'text-white'
                            }`}
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
                        <motion.span
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: delay + 0.4, duration: 0.6 }}
                            className="text-red-500 font-semibold text-xl sm:text-2xl select-text drop-shadow-[0_0_6px_red]"
                            style={{ pointerEvents: 'auto' }}
                        >
                            -30%
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
                            className={`text-4xl sm:text-5xl font-bold ${isPopular ? 'text-[#B08D57]' : 'text-white'
                                }`}
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
                    <p className="text-zinc-300 text-sm mb-4 select-text" style={{ pointerEvents: 'auto' }}>
                        Curate {' '}
                        <motion.span
                            key={`aura-${isYearly}`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-[#B08D57] font-bold"
                        >
                            {currentAura.toLocaleString()} Aura
                        </motion.span>{' '}
                        per {isYearly ? 'year' : 'month'}.
                    </p>

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
                            className={`relative z-20 w-full py-3 sm:py-4 px-4 sm:px-6 rounded-xl font-bold text-center transition-all duration-300 cursor-pointer ${isPopular
                                ? 'bg-[#B08D57] text-black hover:bg-[#B08D57]/80 shadow-lg'
                                : 'bg-zinc-800 text-white hover:text-[#B08D57]  hover:bg-zinc-800 '
                                }`}
                            type="button"
                            role="button"
                            aria-label={`${buttonText} for ${plan} plan`}
                            style={{ pointerEvents: 'auto' }}
                        >
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
                                    <div className="w-5 h-5 rounded-full bg-[#B08D57] flex items-center justify-center">
                                        <Check className="w-3 h-3 text-black" />
                                    </div>
                                ) : (
                                    <div className="w-5 h-5 rounded-full bg-zinc-700 flex items-center justify-center">
                                        <X className="w-3 h-3 text-zinc-400" />
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
                        className="absolute inset-0 bg-gradient-to-r from-[#B08D57]/10 via-transparent to-[#B08D57]/10 rounded-2xl"
                        style={{ pointerEvents: 'none' }}
                    />
                )}
            </motion.div>
        </motion.div>
    );
};

const Page = () => {
    const [isClient, setIsClient] = useState(false);
    const [isYearly, setIsYearly] = useState(false);

    const { user } = useUser();
    const email = user?.emailAddresses[0]?.emailAddress || '';

    useEffect(() => {
        setIsClient(true);
    }, []);

    const plans = [
        {
            plan: "Classic",
            price: {
                monthly: 29,
                yearly: 243
            },
            urls: {
                monthly: `https://cravioai.lemonsqueezy.com/buy/097976f3-ffdf-4693-bab8-3b3bd0be6637?checkout[email]=${encodeURIComponent(email)}`,
                yearly: `https://cravioai.lemonsqueezy.com/buy/f2e8c0e4-39fc-4a40-a490-ea70f85c20f1?checkout[email]=${encodeURIComponent(email)}`
            },
            isPopular: false,
            buttonText: "Start Free Trial",
            features: {
                aura: {
                    monthly: 1000,
                    yearly: 12000
                },
                list: [
                    // if aura is monthly then only show monthly aura, if aura is yearly then only show yearly aura
                    { name: isYearly ? "12000 Aura" : "1000 Aura", included: true },
                    { name: "Persona", included: true },
                    { name: "Caption", included: true },
                    { name: "Upscaller", included: true },
                    { name: "Atelier", included: false },
                    { name: "Exclusive Support", included: false },
                ]
            }
        },
        {
            plan: "Premium",
            price: {
                monthly: 59,
                yearly: 495
            },
            urls: {
                monthly: `https://cravioai.lemonsqueezy.com/buy/68fca232-744c-4083-af99-1bb43bedf430?checkout[email]=${encodeURIComponent(email)}`,
                yearly: `https://cravioai.lemonsqueezy.com/buy/2fbba06d-b1ab-40f2-969c-59a1c08bccb5?checkout[email]=${encodeURIComponent(email)}`
            },
            isPopular: true,
            buttonText: "Start Free Trial",
            features: {
                aura: {
                    monthly: 2400,
                    yearly: 28800
                },
                list: [
                    { name: isYearly ? "28800 Aura" : "2400 Aura", included: true },
                    { name: "Persona", included: true },
                    { name: "Caption", included: true },
                    { name: "Upscaller", included: true },
                    { name: "Atelier", included: true },
                    { name: "Exclusive Support", included: false },
                ]
            }
        },
        {
            plan: "Platinum",
            price: {
                monthly: 99,
                yearly: 831
            },
            urls: {
                monthly: `https://cravioai.lemonsqueezy.com/buy/0e104f00-418e-4f7f-b6ef-9be9be3b2473?checkout[email]=${encodeURIComponent(email)}`,
                yearly: `https://cravioai.lemonsqueezy.com/buy/67dceb1a-e06b-4610-8d9a-36e8fbe1cc24?checkout[email]=${encodeURIComponent(email)}`
            },
            isPopular: false,
            buttonText: "Start Free Trial",
            features: {
                aura: {
                    monthly: 5000,
                    yearly: 60000
                },
                list: [
                    { name: isYearly ? "60000 Aura" : "5000 Aura", included: true },
                    { name: "Persona", included: true },
                    { name: "Caption", included: true },
                    { name: "Upscaller", included: true },
                    { name: "Atelier", included: true },
                    { name: "Exclusive Support", included: true },
                ]
            }
        }
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
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 text-[#B08D57] drop-shadow-lg select-text">
                        Select Your Collection
                    </h1>
                    <p className="text-base sm:text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed select-text">
                        Discover the art of artificial intelligence with our bespoke creations
                    </p>
                </motion.div>

                {/* Premium Toggle */}
                <motion.div variants={toggleVariants} className="flex justify-center mb-12">
                    <div className="relative bg-[#0f0f0f] border border-[#B08D57]/40 p-2 rounded-xl">
                        <motion.div
                            className="absolute inset-y-2 bg-[#B08D57] rounded-lg"
                            animate={{
                                x: isYearly ? "calc(100% - 8px)" : "8px",
                                width: "calc(50% - 8px)"
                            }}
                            transition={{ type: "spring", stiffness: 450, damping: 32 }}
                        />
                        <div className="relative flex">
                            <button
                                onClick={() => setIsYearly(false)}
                                className={`relative z-10 px-12 py-4 font-light tracking-[0.08em] transition-all duration-400 uppercase text-xs ${!isYearly ? 'text-black' : 'text-[#B08D57]/60'
                                    }`}
                            >
                                Mensuel
                            </button>
                            <button
                                onClick={() => setIsYearly(true)}
                                className={`relative z-10 px-12 py-4 font-light tracking-[0.08em] transition-all duration-400 uppercase text-xs ${isYearly ? 'text-black' : 'text-[#B08D57]/60'
                                    }`}
                            >
                                Annuel
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

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.5, duration: 0.8 }}
                    className="text-center mt-12 sm:mt-16"
                >
                    <p className="text-zinc-400 text-sm select-text">
                        All plans include a 7-day free trial • Cancel anytime • No hidden fees
                    </p>
                </motion.div>
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
                            className="absolute w-1 h-1 bg-[#B08D57] rounded-full opacity-60"
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