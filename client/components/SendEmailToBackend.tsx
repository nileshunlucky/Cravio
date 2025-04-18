'use client'

import { useUser } from '@clerk/nextjs'
import { useEffect } from 'react'

export default function SendEmailToBackend() {
  const { user } = useUser()

  useEffect(() => {
    const sendEmail = async () => {
      if (!user?.emailAddresses?.[0]?.emailAddress) return

      const email = user.emailAddresses[0].emailAddress

      const res = await fetch('https://cravio-ai.onrender.com/add-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      await res.json()
    }

    sendEmail()
  }, [user])

  return (
    <div>
    </div>
);
}
