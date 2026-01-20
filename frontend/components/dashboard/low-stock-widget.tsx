"use client"

import { AlertTriangle, TruckIcon, ChevronRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { LowStockItem } from "@/types"
import Link from "next/link"

interface LowStockWidgetProps {
  items: LowStockItem[]
}

export function LowStockWidget({ items }: LowStockWidgetProps) {
  // Separate suppressed (has pending PO) from active alerts
  const activeAlerts = items.filter((i) => !i.isSuppressed)
  const suppressedAlerts = items.filter((i) => i.isSuppressed)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-chart-4" />
          <CardTitle>Low Stock Alerts</CardTitle>
          {activeAlerts.length > 0 && <Badge variant="destructive">{activeAlerts.length} Critical</Badge>}
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/inventory?filter=low-stock">
            View All
            <ChevronRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Active Alerts */}
          {activeAlerts.map((item) => (
            <div
              key={item.variantId}
              className="flex items-center justify-between rounded-lg border border-destructive/20 bg-destructive/5 p-4"
            >
              <div className="space-y-1">
                <p className="font-medium text-card-foreground">{item.productName}</p>
                <p className="text-sm text-muted-foreground">SKU: {item.variantSku}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-destructive">{item.currentStock} left</p>
                <p className="text-xs text-muted-foreground">Threshold: {item.threshold}</p>
              </div>
            </div>
          ))}

          {/* Suppressed Alerts (has pending PO) */}
          {suppressedAlerts.length > 0 && (
            <>
              <div className="flex items-center gap-2 pt-4 text-sm text-muted-foreground">
                <TruckIcon className="h-4 w-4" />
                <span>Suppressed due to pending Purchase Orders</span>
              </div>
              {suppressedAlerts.map((item) => (
                <div
                  key={item.variantId}
                  className="flex items-center justify-between rounded-lg border border-border bg-secondary/50 p-4"
                >
                  <div className="space-y-1">
                    <p className="font-medium text-card-foreground">{item.productName}</p>
                    <p className="text-sm text-muted-foreground">SKU: {item.variantSku}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-chart-3">+{item.pendingPOQuantity} incoming</p>
                    <p className="text-xs text-muted-foreground">Current: {item.currentStock}</p>
                  </div>
                </div>
              ))}
            </>
          )}

          {items.length === 0 && (
            <p className="py-8 text-center text-muted-foreground">No low stock alerts at this time.</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
