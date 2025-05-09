import { LayoutDashboard, Folder, CircleFadingArrowUp, Handshake} from "lucide-react"

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
import Link from "next/link"

// Menu items.
const items = [
  {
    title: "Dashboard",
    url: "/admin/dashboard",
    icon: LayoutDashboard ,
  },
  {
    title: "Projects",
    url: "/admin/projects",
    icon: Folder,
  },
  {
    title: "Plan",
    url: "/admin/plan",
    icon: CircleFadingArrowUp ,
  },
  {
    title: "Affiliate",
    url: "/admin/affiliate",
    icon: Handshake ,
  },
]

const fetures = [
  {
    title: "Reddit Story",
    url: "/admin/reddit-story",
  },
  {
    title: "Split Screen",
    url: "/admin/split-screen",
  },
]

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup className="gap-3">
          <SidebarGroupLabel className="text-xl font-medium">Cravio Ai</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>

          <SidebarGroupLabel className="text-xl font-medium">Features</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {fetures.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link href={item.url}>
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
