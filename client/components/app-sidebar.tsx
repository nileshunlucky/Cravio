"use client"

import React, { useState, useEffect } from 'react';
import { usePathname } from "next/navigation"
import Link from "next/link"
import { useUser } from "@clerk/nextjs";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const items = [
  {
    title: "Dashboard",
    url: "/admin/dashboard",
  },
  {
    title: "Pricing",
    url: "/admin/pricing",
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const [thumbnails, setThumbnails] = useState([]);
  const { user } = useUser();
  const email = user?.primaryEmailAddress?.emailAddress

  useEffect(() => {
    const fetchThumbnails = async () => {
      try {
        const res = await fetch(`https://cravio-ai.onrender.com/user/${email}`)
        const data = await res.json()
        // Ensure we handle the case where generated_thumbnails might be null
        setThumbnails(data?.generated_thumbnails || [])
      } catch (error) {
        console.error('Error fetching thumbnails:', error)
      } 
    }
    
    if (user && email) {
      fetchThumbnails()
    }
  }, [user, email])

  const formatDate = (dateObj: string) => {
    const dateValue = dateObj?.$date || dateObj;
    const date = new Date(dateValue);
    return isNaN(date.getTime()) ? "Recent" : date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
  }

  return (
    <Sidebar className="border-r border-white/5 bg-[#030303] text-white overflow-hidden">
      <SidebarContent className="relative bg-[#030303] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {/* Ambient Teal Glow */}
        <div className="absolute -bottom-32 left-1/2 -translate-x-1/2 w-[120%] h-80 bg-teal-500/10 blur-[120px] pointer-events-none" />
        
        {/* Navigation Group */}
        <SidebarGroup className="gap-8 pt-10">
          <SidebarGroupLabel className="px-6 text-2xl font-bold tracking-tighter text-white">
            MELL<span className="text-teal-400">VITTA</span>
          </SidebarGroupLabel>
          
          <SidebarGroupContent>
            <SidebarMenu className="px-4 space-y-2">
              {items.map((item) => {
                const isActive = pathname === item.url
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      className={`flex items-center px-6 py-7 rounded-xl transition-all duration-500 relative overflow-hidden group ${
                        isActive
                          ? "text-white shadow-[0_0_25px_rgba(45,212,191,0.2)]"
                          : "text-gray-500 hover:text-gray-200 hover:bg-white/5"
                      }`}
                    >
                      <Link href={item.url}>
                        {isActive && (
                          <div className="absolute inset-0 bg-gradient-to-r from-teal-500/20 via-teal-500/10 to-transparent border-l-2 border-teal-400 animate-in fade-in duration-500" />
                        )}
                        <span className={`relative z-10 text-base font-medium tracking-wide ${isActive ? "text-teal-400" : ""}`}>
                          {item.title}
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Premium Thumbnail History Group */}
        <SidebarGroup className="mt-4">
          <SidebarGroupLabel className="px-6 text-xs font-semibold uppercase tracking-widest text-gray-500 mb-4">
            RECENT Thumbnail
          </SidebarGroupLabel>
          <SidebarGroupContent className="px-4">
            {/* flex-col-reverse makes the newest array items appear at the bottom, 
                swap to flex-col if your API already sorts by newest first */}
            <div className="flex flex-col-reverse gap-4">
              {thumbnails.map((thumb, index) => (
                <div 
                  key={index} 
                  className="group relative aspect-video w-full overflow-hidden rounded-xl border border-white/10 bg-white/5 transition-all duration-300 hover:border-teal-500/50 hover:scale-[1.02]"
                >
                  <img 
                    src={thumb.url} 
                    alt="Generated Thumbnail" 
                    className="h-full w-full object-cover transition-opacity duration-300 group-hover:opacity-80"
                  />
                  {/* Subtle Overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 opacity-100 transition-opacity flex flex-col justify-end p-2">
                     <p className="text-[10px] text-teal-400 font-medium truncate">
                        {formatDate(thumb.created_at)}
                     </p>
                  </div>
                </div>
              ))}
              
              {thumbnails.length === 0 && (
                <div className="px-2 py-4 rounded-xl text-center">
                  <p className="text-xs text-gray-600">No thumbnails yet</p>
                </div>
              )}
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}