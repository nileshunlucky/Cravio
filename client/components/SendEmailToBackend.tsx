'use client'

import { useUser } from '@clerk/nextjs'
import { useEffect } from 'react'

export default function SendEmailToBackend() {
  const { user } = useUser()

  useEffect(() => {
    const sendEmail = async () => {
      if (!user?.emailAddresses?.[0]?.emailAddress) return

      const email = user.emailAddresses[0].emailAddress

      const res = await fetch('http://127.0.0.1:8000/add-user', {
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
        {/* Add your JSX content here */}
        <p>Send Email Component</p>
    </div>
);
}
