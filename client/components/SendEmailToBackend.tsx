'use client'

import { useUser } from '@clerk/nextjs'
import { useEffect } from 'react'

export default function SendEmailToBackend() {
  const { user } = useUser()

  useEffect(() => {
    const sendEmail = async () => {
      if (!user?.emailAddresses?.[0]?.emailAddress) return

      const email = user.emailAddresses[0].emailAddress
      const referralCode = localStorage.getItem("referrer")

      // build payload only with available fields
      const payload = referralCode
        ? { email, referredBy: referralCode }
        : { email }

      try {
        const res = await fetch('https://cravio-ai.onrender.com/add-user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        })

        const data = await res.json()

        if (!res.ok) {
          console.error("Error from server:", data)
        }
      } catch (error) {
        console.error("Failed to send email to backend:", error)
      }
    }

    sendEmail()
  }, [user])

  return <div />
}
