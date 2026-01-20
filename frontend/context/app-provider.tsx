"use client"

import type { ReactNode } from "react"
import { AuthProvider } from "./auth-context"
import { InventoryProvider } from "./inventory-context"

export function AppProvider({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <InventoryProvider>{children}</InventoryProvider>
    </AuthProvider>
  )
}
