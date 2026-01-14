"use client"

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import Navbar from "@/components/Navbar"
import SendEmailToBackend from "@/components/SendEmailToBackend"
import { SignedIn, useUser } from "@clerk/nextjs"
import React, { useEffect, useState } from "react"
import { Toaster } from "sonner";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user } = useUser()
  const [credits, setCredits] = useState<number | null>(null)

  useEffect(() => {
    const fetchVideos = async () => {
      if (!user?.primaryEmailAddress?.emailAddress) return
      const email = user.primaryEmailAddress.emailAddress
      

      try {
        const res = await fetch(`https://cravio-ai.onrender.com/user/${email}`)
        const data = await res.json()
        setCredits(data?.credits)
      } catch (error) {
        console.error('Error fetching videos:', error)
      } 
    }
    
    if (user) {
      fetchVideos()
    }
  }, [user])

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarTrigger />
      <div className="flex flex-col w-full h-full overflow-hidden">
        <Navbar credits={credits ?? 0} />
        <SignedIn>
          <SendEmailToBackend />
        </SignedIn>
        {children}
        <Toaster position="top-right" richColors />
      </div>
    </SidebarProvider>
  )
}
