"use client"

import { SidebarProvider } from "@/components/ui/sidebar"
import Nav from '@/components/Nav'
import SendEmailToBackend from "@/components/SendEmailToBackend"
import { SignedIn } from "@clerk/nextjs"
import { Toaster } from "sonner";

export default function Layout({ children }: { children: React.ReactNode }) {

  return (
    <SidebarProvider>
      <div className="flex flex-col w-full">
        <Nav />
        <SignedIn>
          <SendEmailToBackend />
        </SignedIn>
        {children}
        <Toaster position="top-right" richColors />
        <div className="mb-15" />
      </div>
    </SidebarProvider>
  )
}
