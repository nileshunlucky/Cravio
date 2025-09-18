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

import { ChevronRight } from "lucide-react"

// Add luxury styling improvements
const items = [
  {
    title: "Explore",
    url: "/",
    icon: ChevronRight
  },
  {
    title: "Canvas",
    url: "/admin/canvas",
    icon: ChevronRight
  },
  {
    title: "Opus",
    url: "/admin/opus",
    icon: ChevronRight
  },
  {
    title: "Persona's",
    url: "/admin/personas",
    icon: ChevronRight
  },
  {
    title: "Pricing",
    url: "/admin/pricing",
    icon: ChevronRight
  },
  {
    title: "Portfolio",
    url: "/admin/portfolio",
    icon: ChevronRight
  },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup className="gap-5">
          <SidebarGroupLabel className="text-xl font-medium relative flex justify-center items-center my-3">
            <p>M E L L V I T T A</p>
            <div className="absolute left-0 -bottom-1 w-full h-[2px] bg-gradient-to-br from-[#4e3c20] via-[#B08D57] to-[#4e3c20] rounded-full" />
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const isActive = pathname === item.url
                return (
                  <SidebarMenuItem key={item.title} className="py-1">
                    <SidebarMenuButton
                      asChild
                      className={`flex items-center gap-2 px-3 py-5 justify-between transition text-lg ${isActive
                          ? "bg-gradient-to-r from-[#C9A96E] via-[#B08D57] to-[#ad8544] transition-all duration-300 text-black hover:text-black shadow-md"
                          : "text-white"
                        }`}
                    >
                      <Link href={item.url}>
                        <span>{item.title}</span>
                        <item.icon size={20} />
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
