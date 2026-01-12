"use client"

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import Navbar from "@/components/Navbar"
import SendEmailToBackend from "@/components/SendEmailToBackend"
import { SignedIn, useUser } from "@clerk/nextjs"
import React from "react"
import { Toaster } from "sonner";

export default function Layout({ children }: { children: React.ReactNode }) {

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarTrigger />
      <div className="flex flex-col w-full h-full overflow-hidden">
        <Navbar />
        <SignedIn>
          <SendEmailToBackend />
        </SignedIn>
        {children}
        <Toaster position="top-right" richColors />
      </div>
    </SidebarProvider>
  )
}
