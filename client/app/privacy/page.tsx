"use client"

import React from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

const PrivacyPage = () => {
  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-20">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full max-w-3xl"
      >
        <Card className="border border-muted shadow-md rounded-xl ">
          <CardContent className="px-8 py-10 space-y-6">
            {/* Back Button */}
            <Button variant="outline" onClick={() => window.history.back()} >
              &larr; Back
            </Button>

            <h1 className="text-3xl font-bold ">Privacy Policy</h1>
            <p className="text-muted-foreground text-lg">
              Welcome to Cravio! We respect your privacy and are committed to protecting your personal data. This Privacy Policy outlines how we collect, use, and protect your information when using our AI-powered tools.
            </p>

            <h2 className="text-xl font-semibold ">1. Information We Collect</h2>
            <p className="text-muted-foreground text-lg">
              We collect personal data when you use Cravio services. This may include your name, email address, payment information, and usage data. We only collect information that is necessary for providing our services.
            </p>

            <h2 className="text-xl font-semibold ">2. How We Use Your Information</h2>
            <p className="text-muted-foreground text-lg">
              The information we collect is used to provide, improve, and personalize our services. We may also use your data to communicate with you, process payments, and ensure the security of our platform.
            </p>

            <h2 className="text-xl font-semibold ">3. Data Security</h2>
            <p className="text-muted-foreground text-lg">
              We take the security of your data seriously. We implement reasonable security measures to protect your personal information from unauthorized access, disclosure, or destruction. However, no method of transmission over the Internet is completely secure, and we cannot guarantee absolute security.
            </p>

            <h2 className="text-xl font-semibold ">4. Sharing Your Information</h2>
            <p className="text-muted-foreground text-lg">
              We do not share your personal data with third parties, except as necessary to provide our services or as required by law. We may share aggregated, anonymized data for analytical purposes.
            </p>

            <h2 className="text-xl font-semibold ">5. Your Rights</h2>
            <p className="text-muted-foreground text-lg">
              You have the right to access, correct, and delete your personal information. If you wish to exercise these rights or have any concerns about your data, please contact us using the information below.
            </p>

            <h2 className="text-xl font-semibold ">6. Cookies</h2>
            <p className="text-muted-foreground text-lg">
              We use cookies to improve your experience on Cravio. Cookies are small data files stored on your device to remember your preferences and enhance functionality. You can manage your cookie preferences through your browser settings.
            </p>

            <h2 className="text-xl font-semibold ">7. Changes to This Privacy Policy</h2>
            <p className="text-muted-foreground text-lg">
              We may update this Privacy Policy from time to time. Any changes will be posted on this page, and the date of the last revision will be noted at the bottom of the page.
            </p>

            <h2 className="text-xl font-semibold ">8. Contact Us</h2>
            <p className="text-muted-foreground text-lg">
              If you have any questions or concerns about this Privacy Policy, please contact us at <span className="font-semibold">cravio.ai@gmail.com</span>.
            </p>

            <footer className="mt-8 text-center text-sm text-muted-foreground">
              <p>Last updated: April 2025</p>
            </footer>
          </CardContent>
        </Card>
      </motion.div>
    </main>
  )
}

export default PrivacyPage
