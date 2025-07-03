'use client'

import { useUser } from '@clerk/nextjs'
import { useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'

export default function SendEmailToBackend() {
  const { user } = useUser()

  useEffect(() => {
    const sendEmail = async () => {
      if (!user?.emailAddresses?.[0]?.emailAddress) return

      const email = user.emailAddresses[0].emailAddress

      // Get or generate deviceId
      const deviceId = localStorage.getItem("deviceId") || uuidv4()
      localStorage.setItem("deviceId", deviceId)

      // Build payload with deviceId
      const payload: { email: string; deviceId: string } = {
        email,
        deviceId
      }

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
        console.error("Failed to send data to backend:", error)
      }
    }

    sendEmail()
  }, [user])

  return <div />
}
