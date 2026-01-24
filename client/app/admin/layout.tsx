"use client"

import { SidebarProvider } from "@/components/ui/sidebar"
import SendEmailToBackend from "@/components/SendEmailToBackend"
import { SignedIn } from "@clerk/nextjs"
import { Toaster } from "sonner";
import Nav from '@/components/Nav'

export default function Layout({ children }: { children: React.ReactNode }) {

  return (
    <SidebarProvider>
      <div className="flex flex-col w-full">
        <SignedIn>
          <SendEmailToBackend />
        </SignedIn>
          <Nav/>
        {children}
        <Toaster position="top-right" richColors />
      </div>
    </SidebarProvider>
  )
}
