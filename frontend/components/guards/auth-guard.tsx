"use client"

import type React from "react"

/**
 * Auth Guard Component
 * Protects routes by requiring authentication.
 * Redirects to /login if user is not authenticated.
 *
 * Why a guard component vs middleware:
 * - Client-side rendering provides smoother UX with loading states
 * - Can show loading skeletons instead of flash of unprotected content
 * - Easier to manage with our context-based auth system
 */

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { Spinner } from "@/components/ui/spinner"
import { Package } from "lucide-react"

interface AuthGuardProps {
  children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter()
  const { isAuthenticated, authCheckLoading } = useAuth()

  useEffect(() => {
    if (!authCheckLoading && !isAuthenticated) {
      router.push("/login")
    }
  }, [isAuthenticated, authCheckLoading, router])

  // Show loading state while checking auth
  if (authCheckLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <div className="flex items-center gap-2 text-primary">
          <Package className="h-10 w-10" />
          <span className="text-2xl font-bold text-foreground">InventoryHub</span>
        </div>
        <Spinner className="h-6 w-6" />
      </div>
    )
  }

  // Don't render children if not authenticated
  if (!isAuthenticated) {
    return null
  }

  return <>{children}</>
}
