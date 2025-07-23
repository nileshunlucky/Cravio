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

import { LayoutDashboard, Type, DollarSign, Briefcase, User } from "lucide-react"

// Add luxury styling improvements
const items = [
  {
    title: "Dashboard",
    url: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Persona",
    url: "/admin/persona",
    icon: User
  },
  {
    title: "Caption",
    url: "/admin/caption",
    icon: Type,
  },
  {
    title: "Pricing",
    url: "/admin/pricing", 
    icon: DollarSign,
  },
  {
    title: "Portfolio",
    url: "/admin/portfolio",
    icon: Briefcase,
  },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup className="gap-3">
          <SidebarGroupLabel className="text-xl font-medium">Cravio Ai</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const isActive = pathname === item.url

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      className={`flex items-center gap-2 px-3 py-2  transition ${
                        isActive
                          ? "bg-[#B08D57] text-white shadow-md hover:bg-[#B08D57]/90 hover:text-white"
                          : "text-white"
                      }`}
                    >
                      <Link href={item.url}>
                        <item.icon className="w-5 h-5" />
                        <span>{item.title}</span>
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
