'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Mail, MessageSquare } from 'lucide-react'

const ContactPage = () => {
  const handleBack = () => {
    if (typeof window !== 'undefined') {
      window.history.back()
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-20">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full max-w-3xl"
      >
        <Card className="border border-muted shadow-md rounded-xl">
          <CardContent className="px-8 py-10 space-y-6">
            {/* Back Button */}
            <Button variant="outline" onClick={handleBack}>
              &larr; Back
            </Button>

            <h1 className="text-3xl font-bold">Contact Us</h1>
            <p className="text-muted-foreground text-lg">
              Have questions, need technical support, or want feedback on Mellvitta? We're here to help you get the most out of our AI video clipping platform.
            </p>

            <div className="pt-4 space-y-4">
              <div className="flex items-center space-x-4 p-4 border rounded-lg">
                <Mail className="h-6 w-6 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Support & Inquiries</p>
                  <a
                    href="mailto:mellvitta.ai@gmail.com"
                    className="text-lg font-semibold hover:underline"
                  >
                    mellvitta.ai@gmail.com
                  </a>
                </div>
              </div>

              <div className="flex items-center space-x-4 p-4 border rounded-lg">
                <MessageSquare className="h-6 w-6 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Response Time</p>
                  <p className="text-lg font-semibold">Within 24 - 48 hours</p>
                </div>
              </div>
            </div>

            <footer className="mt-8 text-center text-sm text-muted-foreground">
              <p>&copy; {new Date().getFullYear()} Mellvitta. All rights reserved.</p>
            </footer>
          </CardContent>
        </Card>
      </motion.div>
    </main>
  )
}

export default ContactPage