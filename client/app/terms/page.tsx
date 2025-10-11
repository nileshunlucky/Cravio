"use client"

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import React from 'react'

const page = () => {
  // Function to handle back button click
  const handleBack = () => {
    if (typeof window !== 'undefined') {
      window.history.back() // This uses the browser history API to go back
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center  px-6 py-20">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full max-w-3xl"
      >
        <Card className="border border-muted shadow-md rounded-xl ">
          <CardContent className="px-8 py-10 space-y-6">
            {/* Back Button */}
            <Button variant="outline" onClick={handleBack}>
              &larr; Back
            </Button>

            <h1 className="text-3xl font-bold underline">Terms and Conditions</h1>
            <p className="text-muted-foreground text-lg">
              Welcome to Auraiser! By using our AI-powered tools for rating users physics by scnning thier fitness, you agree to the following terms and conditions. Please read them carefully.
            </p>

            <h2 className="text-xl font-semibold">1. Introduction</h2>
            <p className="text-muted-foreground text-lg">
              Auraiser provides AI-powered tools that help athelets produce rate their physics, such as images. By using our platform, you agree to comply with these Terms and Conditions, which govern your use of the Auraiser service.
            </p>

            <h2 className="text-xl font-semibold ">2. Use of Service</h2>
            <p className="text-muted-foreground text-lg">
              You may only use Auraiser for lawful purposes and in accordance with these terms. You are responsible for ensuring that your use of the platform complies with all applicable laws and regulations.
            </p>

            <h2 className="text-xl font-semibold ">3. Payment and Subscription</h2>
            <p className="text-muted-foreground text-lg">
              Auraiser offers subscription-based access to its AI tools. All payments are processed securely via <span className="font-semibold">Lemon Squeezing</span>, a trusted third-party payment gateway. By subscribing, you agree to pay the specified fees for the plan you select. Payment is processed upon confirmation of your subscription.
            </p>
            <p className="text-muted-foreground text-lg">
              Lemon Squeezing ensures that your payment details are processed securely. We do not store any sensitive payment information on our servers. Please refer to Lemon Squeezing privacy policy for more details.
            </p>

            <h2 className="text-xl font-semibold ">4. Refund Policy</h2>
            <p className="text-muted-foreground text-lg">
              Due to the digital nature of our product and the immediate access granted upon purchase, we do not offer refunds once a subscription or purchase is completed. However, if you experience any technical issues or need help with using the platform, our support team is available to assist you.
            </p>

            <h2 className="text-xl font-semibold ">5. User Responsibilities</h2>
            <p className="text-muted-foreground text-lg">
              You are responsible for all content that you create and share using Auraiser. You agree not to use the platform to create or distribute any illegal, harmful, or offensive content. Auraiser reserves the right to suspend or terminate your account if you violate these terms.
            </p>

            <h2 className="text-xl font-semibold ">6. Privacy and Data Security</h2>
            <p className="text-muted-foreground text-lg">
              We value your privacy and are committed to safeguarding your personal data. Please refer to our Privacy Policy for more information about how we collect, use, and protect your data.
            </p>

            <h2 className="text-xl font-semibold ">7. Termination</h2>
            <p className="text-muted-foreground text-lg">
              Auraiser reserves the right to suspend or terminate your account at any time, without notice, for any reason, including violation of these Terms and Conditions.
            </p>

            <h2 className="text-xl font-semibold ">8. Limitation of Liability</h2>
            <p className="text-muted-foreground text-lg">
              To the fullest extent permitted by law, Auraiser is not liable for any damages arising out of your use of the platform. This includes any direct, indirect, incidental, or consequential damages.
            </p>

            <h2 className="text-xl font-semibold ">9. Changes to Terms</h2>
            <p className="text-muted-foreground text-lg">
              Auraiser reserves the right to update or change these Terms and Conditions at any time. Any updates will be posted on this page, and the date of the last revision will be noted at the bottom of this page.
            </p>

            <h2 className="text-xl font-semibold ">10. Contact Us</h2>
            <p className="text-muted-foreground text-lg">
              If you have any questions or concerns about these Terms and Conditions, please contact us at <span className="font-semibold">mellvitta.ai@gmail.com</span>.
            </p>

            <footer className="mt-8 text-center text-sm text-muted-foreground">
              <p>Last updated: Oct 2025</p>
            </footer>
          </CardContent>
        </Card>
      </motion.div>
    </main>
  )
}

export default page
