'use client'

import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { useState, useEffect } from 'react'

const RefundPolicyPage = () => {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) return null  // Return null on the server side (SSR)

  const handleBackClick = () => {
    window.history.back()
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-white px-6 py-20">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full max-w-3xl"
      >
        <Card className="border border-muted shadow-md rounded-xl">
          <CardContent className="px-8 py-10 space-y-6">
            <button
              onClick={handleBackClick}
              className="cursor-pointer underline font-medium text-lg mb-4"
            >
              &lt; Back
            </button>
            <h1 className="text-3xl font-bold">Refund Policy</h1>
            <p className="text-muted-foreground text-lg">
              At Cravio, we are committed to delivering high-performance AI tools for faceless content creation. Due to the nature of our digital SaaS offering and the immediate access granted upon purchase, <span className="font-semibold text-black">we do not offer refunds once a subscription or purchase is completed</span>.
            </p>
            <p className="text-muted-foreground text-lg">
              We encourage all users to review our features and ask questions prior to subscribing. If you experience any technical issues or need help using the platform, our support team is available to assist you promptly.
            </p>
            <p className="text-muted-foreground text-lg">
              By proceeding with a purchase, you agree to this refund policy. We appreciate your understanding and thank you for being part of the Cravio community.
            </p>
            <p>
                Support - <span className='font-semibold'>cravio.ai@gmail.com</span>
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </main>
  )
}

export default RefundPolicyPage
