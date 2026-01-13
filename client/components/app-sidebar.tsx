"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { LayoutDashboard, CircleFadingArrowUp, Handshake , TextSearch} from "lucide-react"

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
    icon: LayoutDashboard,
  },
  {
    title: "Title",
    url: "/admin/title",
    icon: TextSearch ,
  },
  {
    title: "Pricing",
    url: "/admin/pricing",
    icon: CircleFadingArrowUp,
  },
  {
    title: "Portfolio",
    url: "/admin/portfolio",
    icon: Handshake,
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
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg transition ${
                        isActive
                          ? "bg-[#47FFE7] text-black shadow-md"
                          : "text-white hover:bg-white/10"
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
