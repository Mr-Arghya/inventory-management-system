"use client"

import { useState, useEffect, useMemo } from "react"
import { DashboardStats } from "./dashboard-stats"
import { LowStockWidget } from "./low-stock-widget"
import { TopProductsWidget } from "./top-products-widget"
import { StockMovementChart } from "./stock-movement-chart"
import { LoadingState } from "@/components/ui/loading-state"
import { ErrorState } from "@/components/ui/error-state"
import type { DashboardStats as DashboardStatsType } from "@/types"
import { dashboardApi } from "@/services/api"

const MOCK_DASHBOARD_DATA: DashboardStatsType = {
  inventoryValuation: 487520.0,
  totalProducts: 1247,
  lowStockItems: [
    {
      variantId: "v1",
      productName: "Classic T-Shirt",
      variantSku: "TSH-BLK-M",
      currentStock: 5,
      threshold: 10,
      pendingPOQuantity: 50,
      isSuppressed: true,
    },
    {
      variantId: "v2",
      productName: "Running Shoes",
      variantSku: "SHO-WHT-42",
      currentStock: 3,
      threshold: 15,
      pendingPOQuantity: 0,
      isSuppressed: false,
    },
    {
      variantId: "v3",
      productName: "Wireless Headphones",
      variantSku: "HPH-BLK-01",
      currentStock: 2,
      threshold: 10,
      pendingPOQuantity: 0,
      isSuppressed: false,
    },
    {
      variantId: "v4",
      productName: "Laptop Stand",
      variantSku: "STD-ALU-01",
      currentStock: 8,
      threshold: 20,
      pendingPOQuantity: 25,
      isSuppressed: true,
    },
  ],
  topSellingProducts: [
    { productId: "p1", productName: "Premium Hoodie", totalSold: 1245, revenue: 74700 },
    { productId: "p2", productName: "Classic T-Shirt", totalSold: 987, revenue: 29610 },
    { productId: "p3", productName: "Running Shoes", totalSold: 654, revenue: 78480 },
    { productId: "p4", productName: "Wireless Headphones", totalSold: 432, revenue: 43200 },
    { productId: "p5", productName: "Laptop Backpack", totalSold: 321, revenue: 25680 },
  ],
  stockMovementData: [
    { date: "2026-01-04", purchases: 120, sales: 85, returns: 5, adjustments: 10 },
    { date: "2026-01-05", purchases: 0, sales: 92, returns: 8, adjustments: 3 },
    { date: "2026-01-06", purchases: 250, sales: 110, returns: 12, adjustments: 5 },
    { date: "2026-01-07", purchases: 80, sales: 78, returns: 3, adjustments: 8 },
    { date: "2026-01-08", purchases: 0, sales: 125, returns: 15, adjustments: 2 },
    { date: "2026-01-09", purchases: 180, sales: 98, returns: 7, adjustments: 12 },
    { date: "2026-01-10", purchases: 45, sales: 142, returns: 9, adjustments: 4 },
  ],
}

export function DashboardContent() {
  const [data, setData] = useState<DashboardStatsType | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true)
        const resp = await dashboardApi.getStats();
        setData(resp.data)
      } catch {
        setError("Failed to load dashboard data")
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  // Memoize computed values for performance
  const stats = useMemo(() => {
    if (!data) return null
    return {
      inventoryValuation: data.inventoryValuation,
      totalProducts: data.totalProducts,
      lowStockCount: data.lowStockItems.filter((i) => !i.isSuppressed).length,
      pendingPOCount: data.lowStockItems.filter((i) => i.isSuppressed).length,
    }
  }, [data])

  if (isLoading) {
    return <LoadingState message="Loading dashboard..." />
  }

  if (error || !data || !stats) {
    return <ErrorState message={error || "Failed to load dashboard"} onRetry={() => window.location.reload()} />
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <DashboardStats stats={stats} />

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Stock Movement Chart */}
        <StockMovementChart data={data.stockMovementData} />

        {/* Top Products */}
        <TopProductsWidget products={data.topSellingProducts} />
      </div>

      {/* Low Stock Alerts */}
      <LowStockWidget items={data.lowStockItems} />
    </div>
  )
}
