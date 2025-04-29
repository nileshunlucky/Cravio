'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { motion } from 'framer-motion'
import { X, Loader2 } from 'lucide-react'
import { toast } from 'sonner' // Assuming you have a toast component
import { useUser } from '@clerk/nextjs'

// Extend the Window interface to include Razorpay
declare global {
    interface Window {
        Razorpay?: any;
    }
}

const Offer = () => {
    const {user} = useUser()
    const [timeLeft, setTimeLeft] = useState('')
    const [show, setShow] = useState(true)
    const [loading, setLoading] = useState(false)
    const email = user?.primaryEmailAddress?.emailAddress

    useEffect(() => {

        let offerEnds: Date

        // Try to get the deadline from localStorage
        const savedTime = localStorage.getItem('offerDeadline')
        if (savedTime) {
            offerEnds = new Date(savedTime)
            // Basic validation: If the saved time is somehow in the past already (e.g., clock changes), reset
            if (offerEnds.getTime() <= new Date().getTime()) {
                // Reset the timer to 7 days from now if the stored date is invalid or past
                offerEnds = new Date()
                offerEnds.setDate(offerEnds.getDate() + 7)
                localStorage.setItem('offerDeadline', offerEnds.toISOString())
            }
        } else {
            // Set a new deadline 7 days from now
            offerEnds = new Date()
            offerEnds.setDate(offerEnds.getDate() + 7)
            localStorage.setItem('offerDeadline', offerEnds.toISOString())
        }

        const interval = setInterval(() => {
            const now = new Date()
            const diff = offerEnds.getTime() - now.getTime()

            if (diff <= 0) {
                clearInterval(interval)
                setTimeLeft('Expired')
                return
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24))
            const hours = Math.floor((diff / (1000 * 60 * 60)) % 24)
            const minutes = Math.floor((diff / (1000 * 60)) % 60)
            const seconds = Math.floor((diff / 1000) % 60)

            setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`)
        }, 1000)

        // Cleanup interval on component unmount
        return () => clearInterval(interval)
    }, [])

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
            const createOrderResponse = await fetch("http://localhost:8000/create-order", {
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
                name: "LIMITED TIME OFFER",
                description: "100 Credits for $1",
                order_id: orderData.order_id,
                handler: async function (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) {
                    try {
                        // Step 3: Verify payment
                        const verifyResponse = await fetch("http://localhost:8000/verify-payment", {
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
                        toast.success("Payment Successful!", {
                            description: `You have been credited with ${result.credits} credits`
                        })

                        // Hide the offer after successful purchase
                        setShow(false)
                        localStorage.setItem('offerClaimed', 'true')
                    } catch (error) {
                        toast.error("Something went wrong during payment verification")
                    }
                },
                prefill: {
                    email: email
                },
                theme: {
                    color: "#EF4444"
                }
            }

            // Load Razorpay script if not already loaded
            if (!window.Razorpay) {
                await loadRazorpay()
            }

            // Open Razorpay checkout
            const razorpayInstance = new window.Razorpay(options)
            razorpayInstance.open()

        } catch (error) {
            toast("Something went wrong")
        } finally {
            setLoading(false)
        }
    }

    // Helper to load Razorpay script
    const loadRazorpay = () => {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script')
            script.src = 'https://checkout.razorpay.com/v1/checkout.js'
            script.onload = resolve
            script.onerror = reject
            document.body.appendChild(script)
        })
    }

    // Check if offer already claimed
    useEffect(() => {
        const claimed = localStorage.getItem('offerClaimed') === 'true'
        if (claimed) {
            setShow(false)
        }
    }, [])

    if (!show || timeLeft === 'Expired') return null

    return (
        // Centering the component using fixed positioning and transform
        <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.9 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            style={{ backdropFilter: 'blur(4px)', backgroundColor: 'rgba(0, 0, 0, 0.1)' }}
            onClick={(e) => {
                if (e.target === e.currentTarget) {
                    // setShow(false);
                }
            }}
        >
            {/* Card container with shiny background animation */}
            <motion.div
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-sm border shadow-xl rounded-2xl overflow-hidden"
                style={{
                    backgroundImage: 'linear-gradient(120deg, #ffffff 0%, #f9f9f9 50%, #ffffff 100%)',
                    backgroundSize: '200% 200%',
                }}
                animate={{
                    backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                }}
                transition={{
                    duration: 6,
                    ease: 'linear',
                    repeat: Infinity,
                }}
            >
                <Card className="bg-transparent border-none shadow-none rounded-2xl">
                    <CardContent className="relative p-6 pt-8 text-center flex flex-col gap-4 items-center">
                        {/* Close Button */}
                        <button
                            onClick={() => setShow(false)}
                            className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 transition-colors"
                            aria-label="Close Offer"
                        >
                            <X className="h-5 w-5" />
                        </button>

                        {/* Badge */}
                        <Badge className="bg-gradient-to-r from-red-500 to-red-700 text-white text-sm px-3 py-1 shadow-md">
                            LIMITED TIME OFFER | HURRY UP! 🔥
                        </Badge>

                        {/* Headline */}
                        <h2 className="text-2xl font-semibold text-gray-900 flex whitespace-nowrap items-center gap-1">
                            Get
                            {/* Inline SVG with gradient - adjusted for better visual */}
                            <svg width="20" height="20" viewBox="0 0 24 24" strokeWidth="1.5" fill="none" xmlns="http://www.w3.org/2000/svg" className="inline text-yellow-500">
                                <defs>
                                    <linearGradient id="iconGradient" gradientTransform="rotate(90)">
                                        <stop offset="0%" stopColor="#FFE629" />
                                        <stop offset="100%" stopColor="#FFA057" />
                                    </linearGradient>
                                </defs>
                                <path
                                    d="M13.2319 2.28681C13.5409 2.38727 13.75 2.6752 13.75 3.00005V9.25005H19C19.2821 9.25005 19.5403 9.40834 19.6683 9.65972C19.7963 9.9111 19.7725 10.213 19.6066 10.4412L11.6066 21.4412C11.4155 21.7039 11.077 21.8137 10.7681 21.7133C10.4591 21.6128 10.25 21.3249 10.25 21.0001V14.7501H5C4.71791 14.7501 4.45967 14.5918 4.33167 14.3404C4.20366 14.089 4.22753 13.7871 4.39345 13.5589L12.3935 2.55892C12.5845 2.2962 12.923 2.18635 13.2319 2.28681Z"
                                    fill="url(#iconGradient)"
                                    stroke="currentColor"
                                />
                            </svg>
                            100 Credits for $1 Only
                        </h2>

                        {/* Description Text */}
                        <p className="text-gray-600 px-4">
                            Get this limited offer now before it disappears forever. Last chance!
                        </p>

                        {/* Countdown Timer */}
                        <div className="text-xl font-bold text-red-600 tracking-wider">
                            {timeLeft}
                        </div>

                        {/* Claim Now Button with Gradient and Animation */}
                        <motion.div
                            animate={{ scale: [1, 1.03, 1] }}
                            transition={{
                                duration: 1.5,
                                repeat: Infinity,
                                ease: 'easeInOut',
                            }}
                            className="w-full"
                        >
                            <Button 
                                className="w-full bg-gradient-to-r from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 text-white px-8 py-3 text-lg font-semibold rounded-lg shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105"
                                onClick={handleSubmit}
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Claiming
                                    </>
                                ) : (
                                    "Claim Now"
                                )}
                            </Button>
                        </motion.div>
                    </CardContent>
                </Card>
            </motion.div>
        </motion.div>
    )
}

export default Offer