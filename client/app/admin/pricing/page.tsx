"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, X, Sparkles } from 'lucide-react';
import { useUser } from '@clerk/nextjs';

interface FeatureItem {
    name: string;
    included: boolean;
}

interface Features {
    thumbnails: number;
    credits: number;
    list: FeatureItem[];
}

interface PricingCardProps {
    plan: string;
    price: string;
    originalPrice?: string;
    discount?: string;
    features: Features;
    isPopular: boolean;
    buttonText: string;
    href: string;
    delay: number;
}

const PricingCard: React.FC<PricingCardProps> = ({
    plan,
    price,
    originalPrice,
    discount,
    features,
    isPopular,
    buttonText,
    href,
    delay
}) => {
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
            boxShadow: "0 0 0 rgba(71, 255, 231, 0)",
            backgroundColor: "rgba(30, 30, 30, 0.8)"
        },
        animate: {
            boxShadow: isPopular
                ? [
                    "0 0 20px rgba(71, 255, 231, 0.3)",
                    "0 0 40px rgba(71, 255, 231, 0.5)",
                    "0 0 20px rgba(71, 255, 231, 0.3)"
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

    const popularDotVariants = {
        initial: { scale: 0.8, opacity: 0.7 },
        animate: {
            scale: [0.8, 1.2, 0.8],
            opacity: [0.7, 1, 0.7],
            transition: {
                duration: 1.5,
                repeat: Infinity,
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
            style={{ pointerEvents: 'auto' }} // Ensure pointer events work
        >
            {/* Most Popular Badge - Moved outside the card */}
            {isPopular && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.8, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ delay: delay + 0.4, duration: 0.6, ease: "backOut" }}
                    className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-20"
                    style={{ pointerEvents: 'none' }} // Badge shouldn't block interactions
                >
                    <div className="relative">
                        <motion.div
                            variants={popularDotVariants}
                            initial="initial"
                            animate="animate"
                            className="absolute -left-2 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-[#47FFE7] rounded-full"
                        />
                        <div className="bg-[#47FFE7] text-black px-6 py-2 rounded-full  font-bold flex items-center gap-2 shadow-lg whitespace-nowrap">
                            <Sparkles />
                            MOST POPULAR
                        </div>
                    </div>
                </motion.div>
            )}

            <motion.div
                variants={glowVariants}
                initial="initial"
                animate="animate"
                className={`relative rounded-2xl p-6 sm:p-8 h-full backdrop-blur-sm border-2 overflow-hidden ${isPopular
                    ? 'border-[#47FFE7] bg-black/80'
                    : 'border-zinc-700 bg-zinc-900/80'
                    }`}
                style={{ pointerEvents: 'auto' }} // Ensure card content is interactive
            >
                {/* Background Pattern - Fixed pointer events */}
                <div
                    className="absolute inset-0 opacity-5"
                    style={{ pointerEvents: 'none' }} // Background shouldn't block interactions
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-[#47FFE7] via-transparent to-transparent"></div>
                </div>

                {/* Plan Name and Discount */}
                <div className={` flex justify-start items-center gap-3 mb-6 relative z-10 ${isPopular ? 'mt-6' : 'mt-4'}`}>
                    <motion.h3
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: delay + 0.3, duration: 0.6 }}
                        className={`text-2xl font-bold mb-2 ${isPopular ? 'text-[#47FFE7]' : 'text-white'
                            }`}
                        style={{
                            filter: isPopular
                                ? 'drop-shadow(0 0 10px rgba(71, 255, 231, 0.3))'
                                : 'drop-shadow(0 0 10px rgba(255, 255, 255, 0.3))',
                            pointerEvents: 'auto'
                        }}

                    >
                        {plan}
                    </motion.h3>

                    {discount && (
                        <motion.span
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: delay + 0.4, duration: 0.6 }}
                            className="text-red-500 font-semibold text-xl sm:text-2xl select-text drop-shadow-[0_0_6px_red]"
                            style={{ pointerEvents: 'auto' }} // Allow text selection
                        >
                            {discount}
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
                        style={{ pointerEvents: 'auto' }} // Allow text selection
                    >
                        {originalPrice && (
                            <span className="text-zinc-500 text-lg line-through select-text">
                                ${originalPrice}
                            </span>
                        )}
                        <span className={`text-4xl sm:text-5xl font-bold ${isPopular ? 'text-[#47FFE7]' : 'text-white'
                            }`}
                            style={isPopular ? { filter: 'drop-shadow(0 0 10px rgba(71, 255, 231, 0.3))' } : { filter: 'drop-shadow(0 0 10px rgba(255, 255, 255, 0.3))' }}>
                            ${price}
                        </span>
                        <span className=" text-base select-text">/mo</span>
                    </motion.div>
                </div>

                {/* Thumbnail Generation Info */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: delay + 0.7, duration: 0.6 }}
                    className="mb-6 relative z-10"
                >
                    <p className="text-zinc-300 text-sm mb-4 select-text" style={{ pointerEvents: 'auto' }}>
                        Generate up to{' '}
                        <span className="text-[#47FFE7] font-bold">
                            {features.thumbnails} thumbnails
                        </span>{' '}
                        per month.
                    </p>

                    {/* Fixed Button */}
                    <a href={href}>
                        <motion.button
                            whileHover={{
                                scale: 1.02,
                                y: -2,
                                boxShadow: isPopular
                                    ? "0 10px 25px rgba(71, 255, 231, 0.3)"
                                    : "0 10px 25px rgba(0, 0, 0, 0.2)"
                            }}
                            whileTap={{ scale: 0.98 }}
                            className={`relative z-20 w-full py-3 sm:py-4 px-4 sm:px-6 rounded-xl font-bold text-center transition-all duration-300 cursor-pointer ${isPopular
                                ? 'bg-[#47FFE7] text-black hover:bg-[#3ee5d1] shadow-lg'
                                : 'bg-zinc-800 text-white hover:text-[#47FFE7] select-text drop-shadow-[0_0_1px_#47FFE7] hover:bg-zinc-800 border border-zinc-700 hover:border-zinc-600'
                                }`}
                            type="button"
                            role="button"
                            aria-label={`${buttonText} for ${plan} plan`}
                            style={{ pointerEvents: 'auto' }} // Ensure button is clickable
                        >
                            {buttonText}
                        </motion.button></a>
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
                            style={{ pointerEvents: 'auto' }} // Allow text selection
                        >
                            <div className="flex-shrink-0">
                                {feature.included ? (
                                    <div className="w-5 h-5 rounded-full bg-[#47FFE7] flex items-center justify-center">
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

                {/* Glow Effect Overlay for Popular Card - Fixed pointer events */}
                {isPopular && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0, 0.3, 0] }}
                        transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                        className="absolute inset-0 bg-gradient-to-r from-[#47FFE7]/10 via-transparent to-[#47FFE7]/10 rounded-2xl"
                        style={{ pointerEvents: 'none' }} // Glow shouldn't block interactions
                    />
                )}
            </motion.div>
        </motion.div>
    );
};

const Page = () => {
    const [isClient, setIsClient] = useState(false);
    const {user} = useUser()
    const email = user?.primaryEmailAddress?.emailAddress

    // Ensure particles only render on client
    useEffect(() => {
        setIsClient(true);
    }, []);

    const plans = [
        {
            plan: "Starter",
            price: "3.99",
            originalPrice: "5.99",
            discount: "-33%",
            buttonText: "Start Free Trial",
            href: `https://cravioai.lemonsqueezy.com/buy/4776476e-309d-4c69-b790-a8bcaab86565?checkout[email]=${encodeURIComponent(email || '')}`,
            isPopular: false,
            features: {
                thumbnails: 8,
                credits: 80,
                list: [
                    { name: "80 credits", included: true },
                    { name: "AI Thumbnail Generator", included: true },
                    { name: "Persona Feature", included: true },
                    { name: "HD Export", included: true },
                    { name: "Advanced Styles", included: false },
                    { name: "Custom Branding", included: false },
                    { name: "Priority Support", included: false },
                    { name: "Bulk Generation", included: false }
                ]
            }
        },
        {
            plan: "Pro",
            price: "5.99",
            originalPrice: "8.99",
            discount: "-33%",
            buttonText: "Start Free Trial",
            href: `https://cravioai.lemonsqueezy.com/buy/eab36718-8eb4-4266-a503-b7d165187d02?checkout[email]=${encodeURIComponent(email || '')}`,
            isPopular: true,
            features: {
                thumbnails: 20,
                credits: 200,
                list: [
                    { name: "200 credits", included: true },
                    { name: "AI Thumbnail Generator", included: true },
                    { name: "Persona Feature", included: true },
                    { name: "HD Export", included: true },
                    { name: "Advanced Styles", included: true },
                    { name: "Custom Branding", included: true },
                    { name: "Priority Support", included: false },
                    { name: "Bulk Generation", included: false }
                ]
            }
        },
        {
            plan: "Premium",
            price: "11.99",
            originalPrice: "17.99",
            discount: "-33%",
            buttonText: "Start Free Trial",
            href: `https://cravioai.lemonsqueezy.com/buy/43aad267-faec-4d5f-9c9b-3c6cf6d83376?checkout[email]=${encodeURIComponent(email || '')}`,
            isPopular: false,
            features: {
                thumbnails: 50,
                credits: 500,
                list: [
                    { name: "500 credits", included: true },
                    { name: "AI Thumbnail Generator", included: true },
                    { name: "Persona Feature", included: true },
                    { name: "HD Export", included: true },
                    { name: "Advanced Styles", included: true },
                    { name: "Custom Branding", included: true },
                    { name: "Priority Support", included: true },
                    { name: "Bulk Generation", included: true }
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
            {/* Background Pattern - Fixed pointer events */}
            <div
                className="absolute inset-0 opacity-30"
                style={{ pointerEvents: 'none' }} // Background shouldn't block interactions
            >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(71,255,231,0.15),transparent_50%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(71,255,231,0.1),transparent_50%)]" />
            </div>

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="relative z-10 container mx-auto px-4 py-8 sm:py-16"
                style={{ pointerEvents: 'auto' }} // Ensure content is interactive
            >
                <motion.div
                    variants={titleVariants}
                    className="text-center mb-12 sm:mb-16"
                >
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 text-[#47FFE7] drop-shadow-lg select-text">
                        Choose Your Plan
                    </h1>
                    <p className="text-base sm:text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed select-text">
                        Unlock the power of AI-generated thumbnails with our flexible pricing plans
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-7xl mx-auto">
                    {plans.map((plan, index) => (
                        <PricingCard
                            key={index}
                            {...plan}
                            delay={index * 0.2}
                        />
                    ))}
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.5, duration: 0.8 }}
                    className="text-center mt-12 sm:mt-16"
                >
                    <p className="text-zinc-400 text-sm select-text">
                        All plans include a 1-day free trial • Cancel anytime • No hidden fees
                    </p>
                </motion.div>
            </motion.div>

            {/* Floating Particles Effect - Fixed pointer events */}
            {isClient && (
                <div
                    className="absolute inset-0"
                    style={{ pointerEvents: 'none' }} // Particles shouldn't block interactions
                >
                    {particlePositions.map((position, i) => (
                        <motion.div
                            key={i}
                            className="absolute w-1 h-1 bg-[#47FFE7] rounded-full opacity-60"
                            style={{
                                left: `${position.left}%`,
                                top: `${position.top}%`,
                                pointerEvents: 'none' // Individual particles shouldn't block interactions
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