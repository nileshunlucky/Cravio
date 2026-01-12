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

const items = [
  {
    title: "Dashboard",
    url: "/admin/dashboard",
  },
  {
    title: "Pricing",
    url: "/admin/plan",
  },
]

export function AppSidebar() {
  return (
    <Sidebar className="border-r border-zinc-800 bg-black">
      <SidebarContent className="bg-black">
        <SidebarGroup className="px-4 pt-8">
          {/* Brand Header */}
          <SidebarGroupLabel className="text-xl font-semibold text-white tracking-tight mb-8 h-auto px-2">
            Mellvitta
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu className="gap-2">
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    className="group relative h-10 px-3 transition-all duration-200 hover:bg-zinc-900 active:bg-zinc-800"
                  >
                    <Link href={item.url} className="flex items-center">
                      <span className="text-[17px] font-medium text-zinc-400 group-hover:text-white transition-colors">
                        {item.title}
                      </span>
                      
                      {/* Subtle indicator that appears on hover */}
                      <div className="absolute left-0 w-[2px] h-0 bg-white transition-all duration-200 group-hover:h-1/2" />
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