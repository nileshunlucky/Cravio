"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const YOUTUBE_AUTH_URL = process.env.NEXT_PUBLIC_YOUTUBE_AUTH_URL;
const INSTAGRAM_AUTH_URL = process.env.NEXT_PUBLIC_INSTAGRAM_AUTH_URL;

interface SocialPlatform {
    name: string;
    icon: React.ReactNode;
    gradient: string;
    hoverGradient: string;
    shadowColor: string;
    onClick: () => void;
}

const SocialAccountPage: React.FC = () => {
    const [hoveredPlatform, setHoveredPlatform] = useState<string | null>(null);

    const handleYouTubeConnect = (): void => {
        if (YOUTUBE_AUTH_URL) {
            window.location.href = YOUTUBE_AUTH_URL;
        } else {
            alert("YouTube authentication URL is not set.");
        }
    };

    const handleInstagramConnect = (): void => {
        if (INSTAGRAM_AUTH_URL) {
            window.location.href = INSTAGRAM_AUTH_URL;
        } else {
            alert("Instagram authentication URL is not set.");
        }
    };

    const socialPlatforms: SocialPlatform[] = [
        {
            name: "YouTube",
            icon: (
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
            ),
            gradient: "from-red-600 to-red-700",
            hoverGradient: "from-red-500 to-red-600",
            shadowColor: "shadow-red-500/25",
            onClick: handleYouTubeConnect
        },
        {
            name: "Instagram",
            icon: (
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
            ),
            gradient: "from-purple-600 via-pink-600 to-orange-500",
            hoverGradient: "from-purple-500 via-pink-500 to-orange-400",
            shadowColor: "shadow-pink-500/25",
            onClick: handleInstagramConnect
        }
    ];

    const containerVariants = {
        hidden: { opacity: 0, y: 50 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.6,
                staggerChildren: 0.2
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.5 }
        }
    };

    const buttonVariants = {
        initial: { scale: 1 },
        hover: {
            scale: 1.02,
            transition: { type: "spring", stiffness: 400, damping: 10 }
        },
        tap: { scale: 0.98 }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6">
            <motion.div
                className="max-w-md w-full"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                <Card className=" backdrop-blur-xl border-zinc-600 shadow-2xl">
                    <CardHeader className="text-center space-y-4">

                        <motion.div variants={itemVariants}>
                            <CardTitle className="text-2xl font-bold text-white">
                                Connect Accounts
                            </CardTitle>
                            <CardDescription className="text-slate-400 mt-2">
                                Link your social platforms to get started
                            </CardDescription>
                        </motion.div>

                        <motion.div variants={itemVariants}>
                            <Badge variant="secondary" className="bg-slate-800/50 text-slate-300 border-slate-700">
                                Secure Authentication
                            </Badge>
                        </motion.div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                        {socialPlatforms.map((platform, index) => (
                            <motion.div
                                key={platform.name}
                                variants={itemVariants}
                                custom={index}
                            >
                                <Button
                                    onClick={platform.onClick}
                                    onMouseEnter={() => setHoveredPlatform(platform.name)}
                                    onMouseLeave={() => setHoveredPlatform(null)}
                                    className={`
                    w-full h-14 relative overflow-hidden
                    bg-gradient-to-r ${hoveredPlatform === platform.name ? platform.hoverGradient : platform.gradient}
                    hover:${platform.shadowColor} hover:shadow-2xl
                    border-0 rounded-xl
                    transition-all duration-300
                    group
                  `}
                                    asChild
                                >
                                    <motion.button
                                        variants={buttonVariants}
                                        initial="initial"
                                        whileHover="hover"
                                        whileTap="tap"
                                    >
                                        <div className="flex items-center justify-center space-x-3 relative z-10">
                                            <div className="w-8 h-8 bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center">
                                                {platform.icon}
                                            </div>
                                            <span className="font-semibold text-white">
                                                Connect {platform.name}
                                            </span>
                                            <motion.div
                                                animate={{
                                                    x: hoveredPlatform === platform.name ? 4 : 0
                                                }}
                                                transition={{ type: "spring", stiffness: 400, damping: 10 }}
                                            >
                                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                </svg>
                                            </motion.div>
                                        </div>

                                        {/* Shimmer effect */}
                                        <motion.div
                                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12"
                                            initial={{ x: "-100%" }}
                                            whileHover={{
                                                x: "200%",
                                                transition: { duration: 0.8, ease: "easeInOut" }
                                            }}
                                        />
                                    </motion.button>
                                </Button>
                            </motion.div>
                        ))}

                        <motion.div
                            variants={itemVariants}
                            className="pt-4 text-center"
                        >
                            <p className="text-xs text-zinc-500">
                                Your data is encrypted and secure
                            </p>
                        </motion.div>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
};

export default SocialAccountPage;