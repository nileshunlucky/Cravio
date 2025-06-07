'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { motion } from 'framer-motion'
import { X, Loader2, Zap, Clock, Scissors } from 'lucide-react'
import { toast } from 'sonner'
import { useUser } from '@clerk/nextjs'

// Define Razorpay types
interface RazorpayConstructor {
    new(options: RazorpayOptions): RazorpayInstance;
}

interface RazorpayInstance {
    open(): void;
}

interface RazorpayOptions {
    key: string;
    amount: number;
    currency: string;
    name: string;
    description: string;
    order_id: string;
    handler: (response: RazorpayResponse) => void;
    prefill: {
        email?: string;
    };
    theme: {
        color: string;
    };
}

interface RazorpayResponse {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
}

interface WindowWithRazorpay extends Window {
    Razorpay?: RazorpayConstructor;
}

const TrialOffer = () => {
    const { user } = useUser()
    const [show, setShow] = useState(true)
    const [loading, setLoading] = useState(false)
    const email = user?.primaryEmailAddress?.emailAddress

    // Handle payment flow
    const handleSubmit = async () => {
        try {
            // Validate email
            if (!email) {
                toast.error("Email required")
                return
            }

            setLoading(true)

            // Step 1: Create order
            const createOrderResponse = await fetch("https://cravio-ai.onrender.com/create-order", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email: email }),
            })

            if (!createOrderResponse.ok) {
                const errorData = await createOrderResponse.json()
                throw new Error(errorData.detail || "Failed to create order")
            }

            const orderData = await createOrderResponse.json()

            // Step 2: Initialize Razorpay
            const options = {
                key: orderData.key_id,
                amount: orderData.amount * 100, // Amount in paise
                currency: orderData.currency,
                name: "Cravio AI Trial",
                description: "60 Credits Trial - $1",
                order_id: orderData.order_id,
                handler: async function (response: RazorpayResponse) {
                    try {
                        // Step 3: Verify payment
                        const verifyResponse = await fetch("https://cravio-ai.onrender.com/verify-payment", {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                            },
                            body: JSON.stringify({
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_signature: response.razorpay_signature,
                                email: email
                            }),
                        })

                        if (!verifyResponse.ok) {
                            const errorData = await verifyResponse.json()
                            throw new Error(errorData.detail || "Payment verification failed")
                        }

                        const result = await verifyResponse.json()

                        // Success message
                        toast.success("Welcome to Cravio AI! 🎉", {
                            description: `Your trial has started with ${result.credits} credits`
                        })

                        // Hide the offer after successful purchase
                        setShow(false)
                        localStorage.setItem('trialClaimed', 'true')
                    } catch (err) {
                        toast.error(`Payment verification failed: ${err instanceof Error ? err.message : String(err)}`)
                    }
                },
                prefill: {
                    email: email
                },
                theme: {
                    color: "#000000"
                }
            }

            // Load Razorpay script if not already loaded
            const customWindow = window as WindowWithRazorpay;

            if (!customWindow.Razorpay) {
                await loadRazorpay()
            }

            if (customWindow.Razorpay) {
                const razorpayInstance = new customWindow.Razorpay(options)
                razorpayInstance.open()
            }

        } catch (err) {
            toast.error(`Payment failed: ${err instanceof Error ? err.message : String(err)}`)
        } finally {
            setLoading(false)
        }
    }

    // Helper to load Razorpay script
    const loadRazorpay = () => {
        return new Promise<void>((resolve, reject) => {
            const script = document.createElement('script')
            script.src = 'https://checkout.razorpay.com/v1/checkout.js'
            script.onload = () => resolve()
            script.onerror = () => reject()
            document.body.appendChild(script)
        })
    }

    // Check if trial already claimed
    useEffect(() => {
        const claimed = localStorage.getItem('trialClaimed') === 'true'
        if (claimed) {
            setShow(false)
        }
    }, [])

    if (!show) return null

    return (
        <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            style={{
                backdropFilter: 'blur(8px)',
                backgroundColor: 'rgba(0, 0, 0, 0.6)'
            }}
            onClick={(e) => {
                if (e.target === e.currentTarget) {
                    setShow(false)
                }
            }}
        >
            <motion.div
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-md"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
            >
                {/* Gradient glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-zinc-800 via-black to-zinc-800 rounded-3xl blur-xl opacity-60" />

                <Card className="relative bg-gradient-to-br from-zinc-900 via-black to-zinc-900 border border-zinc-800 shadow-2xl rounded-3xl overflow-hidden">
                    {/* Subtle animated background pattern */}
                    <div className="absolute inset-0 opacity-5">
                        <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent"
                            animate={{
                                x: ['-100%', '100%'],
                            }}
                            transition={{
                                duration: 3,
                                repeat: Infinity,
                                ease: 'linear',
                            }}
                        />
                    </div>

                    <CardContent className="relative p-8 text-center space-y-6">
                        {/* Close Button */}
                        <button
                            onClick={() => setShow(false)}
                            className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-300 transition-colors"
                            aria-label="Close"
                        >
                            <X className="h-5 w-5" />
                        </button>

                        {/* Trial Badge */}
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                        >
                            <Badge className="bg-gradient-to-r from-zinc-700 to-zinc-800 text-zinc-200 border border-zinc-600 px-4 py-1 text-sm font-medium">
                                TRIAL OFFER
                            </Badge>
                        </motion.div>

                        {/* Main Headline */}
                        <div className="space-y-2">
                            <h2 className="text-3xl font-bold text-white">
                                Try Cravio AI
                            </h2>
                            <div className="flex items-center justify-center gap-2 text-2xl font-bold">
                                <span className="text-zinc-400">60 Credits for</span>
                                <span className="text-white bg-gradient-to-r from-zinc-200 to-white bg-clip-text">
                                    $1
                                </span>
                            </div>
                        </div>

                        {/* Value Proposition */}
                        <motion.div
                            className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 space-y-3"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                        >
                            <p className="text-zinc-300 text-sm leading-relaxed">
                                Transform your long videos into viral short clips instantly.
                                Stop spending hours editing – let AI do it in seconds.
                            </p>

                            <div className="grid grid-cols-3 gap-4 pt-2">
                                <div className="flex flex-col items-center gap-1">
                                    <div className="bg-zinc-800 p-2 rounded-lg">
                                        <Scissors className="h-4 w-4 text-zinc-400" />
                                    </div>
                                    <span className="text-xs text-zinc-500">Auto Clips</span>
                                </div>
                                <div className="flex flex-col items-center gap-1">
                                    <div className="bg-zinc-800 p-2 rounded-lg">
                                        <Clock className="h-4 w-4 text-zinc-400" />
                                    </div>
                                    <span className="text-xs text-zinc-500">Seconds</span>
                                </div>
                                <div className="flex flex-col items-center gap-1">
                                    <div className="bg-zinc-800 p-2 rounded-lg">
                                        <Zap className="h-4 w-4 text-zinc-400" />
                                    </div>
                                    <span className="text-xs text-zinc-500">AI Powered</span>
                                </div>
                            </div>
                        </motion.div>

                        {/* Credit Information */}
                        <div className="text-center">
                            <p className="text-zinc-500 text-sm">

                                    // < svg width="20" height="20" viewBox="0 0 24 24" strokeWidth="1.5" fill="none" xmlns="http://www.w3.org/2000/svg" className="inline text-yellow-500" >
    //                             <defs>
    //                                 <linearGradient id="iconGradient" gradientTransform="rotate(90)">
    //                                     <stop offset="0%" stopColor="#FFE629" />
    //                                     <stop offset="100%" stopColor="#FFA057" />
    //                                 </linearGradient>
    //                             </defs>
    //                             <path
                                        d="M13.2319 2.28681C13.5409 2.38727 13.75 2.6752 13.75 3.00005V9.25005H19C19.2821 9.25005 19.5403 9.40834 19.6683 9.65972C19.7963 9.9111 19.7725 10.213 19.6066 10.4412L11.6066 21.4412C11.4155 21.7039 11.077 21.8137 10.7681 21.7133C10.4591 21.6128 10.25 21.3249 10.25 21.0001V14.7501H5C4.71791 14.7501 4.45967 14.5918 4.33167 14.3404C4.20366 14.089 4.22753 13.7871 4.39345 13.5589L12.3935 2.55892C12.5845 2.2962 12.923 2.18635 13.2319 2.28681Z"
                                        fill="url(#iconGradient)"
                                        stroke="currentColor"
                                    />
                                </svg >

                                1 Credit = 1 Minute of Video Processing
                            </p>
                            <p className="text-zinc-600 text-xs mt-1">
                                Process up to 60 minutes of content
                            </p>
                        </div>

                        {/* CTA Button */}
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full"
                        >
                            <Button
                                className="w-full bg-white hover:bg-zinc-100 text-black px-8 py-4 text-lg font-semibold rounded-xl shadow-lg transition-all duration-300 ease-out"
                                onClick={handleSubmit}
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        Starting Trial...
                                    </>
                                ) : (
                                    <>
                                        <Zap className="mr-2 h-5 w-5" />
                                        Start Trial - $1
                                    </>
                                )}
                            </Button>
                        </motion.div>

                        {/* Trust indicators */}
                        <div className="flex justify-center items-center gap-4 text-xs text-zinc-600">
                            <span>✓ Instant Access</span>
                            <span>✓ No Commitment</span>
                            <span>✓ Cancel Anytime</span>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </motion.div>
    )
}

export default TrialOffer;