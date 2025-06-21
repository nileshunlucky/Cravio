'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useUser } from '@clerk/nextjs';
import { motion } from 'framer-motion'
import { X } from 'lucide-react'


declare global {
  interface Window {
    fbq: (...args: any[]) => void;
  }
}
declare const fbq: (...args: any[]) => void;

const Offer = () => {
  const [show, setShow] = useState(false)
  const { user } = useUser();

  const razorpayTrialLink = "https://rzp.io/rzp/jyXt3Ix"

  useEffect(() => {
    const fetchVideos = async () => {

      if (!user?.primaryEmailAddress?.emailAddress) {
        return;
      }
      const email = user.primaryEmailAddress.emailAddress;

      try {
        const res = await fetch(`https://cravio-ai.onrender.com/user/${email}`);
        if (!res.ok) {
          throw new Error(`Failed to fetch videos: ${res.status} ${res.statusText}`);
        }
        const data = await res.json();
        // Check if trial has been claimed
        if (data?.trial_claimed) {
          setShow(false);
        } else {
          setShow(true);
        }


      } catch (err) {
        console.error('Error fetching videos:', err);
      }
    };
    if (user) {
      fetchVideos();
    }
  }, [user]);

  if (!show) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 30, scale: 0.9 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ backdropFilter: 'blur(4px)', backgroundColor: 'rgba(0, 0, 0, 0.1)' }}
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm border shadow-xl rounded-2xl overflow-hidden"
        style={{
          backgroundImage: 'linear-gradient(120deg, rgba(0,0,0,0.6), rgba(20,20,20,0.4), rgba(0,0,0,0.6))',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
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
            <button
              onClick={() => setShow(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-700"
              aria-label="Close Offer"
            >
              <X className="h-5 w-5" />
            </button>

            <Badge className="bg-gradient-to-r from-red-500 to-red-700 text-white text-sm px-3 py-1 shadow-md">
              Exclusive $1 trial
            </Badge>

            <h2 className="text-2xl font-semibold text-white">
              Get 60 Credits for $1 Only
            </h2>

            <p className="text-zinc-400 px-4">
              Perfect for creators to grow fast & scale with Cravio AI.
            </p>

            <motion.div className="w-full">
              <Button asChild>
                <a
                  href={razorpayTrialLink}
                  rel="noopener noreferrer"
                  className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white px-8 py-3 text-lg font-semibold rounded-lg shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105 text-center"
                  onClick={() => {
                    if (typeof window !== 'undefined' && typeof fbq === 'function') {
                      fbq('track', 'InitiateCheckout');
                    }
                  }}
                >
                  Claim $1 Trial
                </a>
              </Button>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}

export default Offer
