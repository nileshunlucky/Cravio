"use client"

import React, { useEffect } from 'react'
import SendEmailToBackend from "@/components/SendEmailToBackend"
import { SignedIn, useUser } from "@clerk/nextjs"


const Page = () => {
  const referrer = localStorage.getItem('referrer');

  return (
    <div>
      <SignedIn>
        <SendEmailToBackend />
      </SignedIn>
    </div>
  )
}

export default Page
