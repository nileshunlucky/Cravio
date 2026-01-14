"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"

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

  return (
    <Sidebar className="border-r border-white/5 bg-[#030303] text-white overflow-hidden">
      <SidebarContent className="relative bg-[#030303] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {/* Ambient Teal Glow rising from bottom */}
        <div className="absolute -bottom-32 left-1/2 -translate-x-1/2 w-[120%] h-80 bg-teal-500/10 blur-[120px] pointer-events-none" />
        
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
                        {/* Premium Teal/Black Gradient Background for Active State */}
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
      </SidebarContent>
    </Sidebar>
  )
}