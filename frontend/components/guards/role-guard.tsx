"use client"

/**
 * Role Guard Component
 * Protects routes/components based on user role.
 * Used for role-based UI rendering as specified in requirements.
 */

import type { ReactNode } from "react"
import { useAuth } from "@/context/auth-context"
import type { UserRole } from "@/types"
import { AlertCircle } from "lucide-react"

interface RoleGuardProps {
  children: ReactNode
  allowedRoles: UserRole[]
  fallback?: ReactNode
}

export function RoleGuard({ children, allowedRoles, fallback }: RoleGuardProps) {
  const { hasPermission, isLoading } = useAuth()

  if (isLoading) {
    return null // Or a loading spinner
  }

  if (!hasPermission(allowedRoles)) {
    if (fallback) {
      return <>{fallback}</>
    }

    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        <div className="text-center">
          <h3 className="text-lg font-medium text-foreground">Access Denied</h3>
          <p className="mt-1 text-sm text-muted-foreground">You don&apos;t have permission to view this content.</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
