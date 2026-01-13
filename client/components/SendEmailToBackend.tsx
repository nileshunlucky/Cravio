'use client'

import { useUser } from '@clerk/nextjs'
import { useEffect } from 'react'

export default function SendEmailToBackend() {
  const { user } = useUser()

  useEffect(() => {
    const sendEmail = async () => {
      if (!user?.emailAddresses?.[0]?.emailAddress) return

      const email = user.emailAddresses[0].emailAddress

      try {
        const res = await fetch('https://cravio-ai.onrender.com/add-user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: email,
        })

        const data = await res.json()

        if (!res.ok) {
          console.error("Error from server:", data)
        }
      } catch (error) {
        console.error("Failed to send data to backend:", error)
      }
    }

    sendEmail()
  }, [user])

  return <div />
}
