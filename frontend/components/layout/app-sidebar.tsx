"use client"

import type React from "react"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { LayoutDashboard, Package, ShoppingCart, Truck, FileText, Settings, ChevronRight, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import type { UserRole } from "@/types"

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
  requiredRoles: UserRole[]
  badge?: number
}

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    requiredRoles: ["owner", "manager", "staff"],
  },
  {
    label: "Inventory",
    href: "/inventory",
    icon: Package,
    requiredRoles: ["owner", "manager"],
  },
  {
    label: "Orders",
    href: "/orders",
    icon: ShoppingCart,
    requiredRoles: ["owner", "manager", "staff"],
  },
  {
    label: "Suppliers",
    href: "/suppliers",
    icon: Truck,
    requiredRoles: ["owner", "manager"],
  },
  {
    label: "Purchase Orders",
    href: "/purchase-orders",
    icon: FileText,
    requiredRoles: ["owner", "manager"],
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
    requiredRoles: ["owner"],
  },
]

interface AppSidebarProps {
  onCloseMobile?: () => void
}

export function AppSidebar({ onCloseMobile }: AppSidebarProps) {
  const pathname = usePathname()
  const { user, hasPermission, logout } = useAuth()

  // Filter nav items based on user role
  const visibleNavItems = navItems.filter((item) => hasPermission(item.requiredRoles))

  const handleNavClick = () => {
    // Close mobile sidebar when navigating
    onCloseMobile?.()
  }

  return (
    <aside className="flex h-full w-64 flex-col border-r border-sidebar-border bg-sidebar">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <Package className="h-4 w-4 text-primary-foreground" />
        </div>
        <span className="text-lg font-semibold text-sidebar-foreground">InventoryHub</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {visibleNavItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={handleNavClick}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-xs text-destructive-foreground">
                  {item.badge}
                </span>
              )}
              {isActive && <ChevronRight className="h-4 w-4 text-sidebar-foreground/50" />}
            </Link>
          )
        })}
      </nav>

      {/* User info - Added logout button */}
      <div className="border-t border-sidebar-border p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sidebar-accent text-sm font-medium text-sidebar-accent-foreground">
            {user?.name?.charAt(0) || "U"}
          </div>
          <div className="flex-1 truncate">
            <p className="truncate text-sm font-medium text-sidebar-foreground">{user?.name || "User"}</p>
            <p className="truncate text-xs text-sidebar-foreground/60 capitalize">{user?.user_type || "Loading..."}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-sidebar-foreground/70 hover:text-destructive hover:bg-destructive/10"
          onClick={logout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </Button>
      </div>
    </aside>
  )
}
