"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Plus, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { LoadingState } from "@/components/ui/loading-state"
import { ErrorState } from "@/components/ui/error-state"
import { OrdersTable } from "./orders-table"
import { CreateOrderDialog } from "./create-order-dialog"
import { OrderDetailSheet } from "./order-detail-sheet"
import type { Order, OrderStatus } from "@/types"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Mock orders data
const MOCK_ORDERS: Order[] = [
  {
    id: "ord-1",
    tenantId: "tenant-1",
    orderNumber: "ORD-2026-0042",
    status: "pending",
    items: [
      {
        id: "oi-1",
        orderId: "ord-1",
        variantId: "v1",
        productName: "Classic T-Shirt",
        variantSku: "TSH-BLK-S",
        quantity: 3,
        fulfilledQuantity: 0,
        unitPrice: 29.99,
        availableStock: 45,
      },
      {
        id: "oi-2",
        orderId: "ord-1",
        variantId: "v6",
        productName: "Running Shoes",
        variantSku: "SHO-BLK-40",
        quantity: 1,
        fulfilledQuantity: 0,
        unitPrice: 119.99,
        availableStock: 15,
      },
    ],
    totalAmount: 209.96,
    customerName: "John Smith",
    customerEmail: "john.smith@example.com",
    createdAt: "2026-01-10T09:30:00Z",
    updatedAt: "2026-01-10T09:30:00Z",
  },
  {
    id: "ord-2",
    tenantId: "tenant-1",
    orderNumber: "ORD-2026-0041",
    status: "partially_fulfilled",
    items: [
      {
        id: "oi-3",
        orderId: "ord-2",
        variantId: "v11",
        productName: "Premium Hoodie",
        variantSku: "HOD-GRY-M",
        quantity: 5,
        fulfilledQuantity: 3,
        unitPrice: 59.99,
        availableStock: 67,
      },
      {
        id: "oi-4",
        orderId: "ord-2",
        variantId: "v9",
        productName: "Wireless Headphones",
        variantSku: "HPH-BLK-01",
        quantity: 2,
        fulfilledQuantity: 0,
        unitPrice: 199.99,
        availableStock: 2,
      },
    ],
    totalAmount: 699.93,
    customerName: "Sarah Johnson",
    customerEmail: "sarah.j@example.com",
    notes: "Rush order - expedite shipping",
    createdAt: "2026-01-09T14:20:00Z",
    updatedAt: "2026-01-10T08:15:00Z",
  },
  {
    id: "ord-3",
    tenantId: "tenant-1",
    orderNumber: "ORD-2026-0040",
    status: "completed",
    items: [
      {
        id: "oi-5",
        orderId: "ord-3",
        variantId: "v4",
        productName: "Classic T-Shirt",
        variantSku: "TSH-WHT-S",
        quantity: 10,
        fulfilledQuantity: 10,
        unitPrice: 29.99,
        availableStock: 28,
      },
    ],
    totalAmount: 299.9,
    customerName: "Mike Wilson",
    customerEmail: "mike.w@example.com",
    createdAt: "2026-01-08T11:00:00Z",
    updatedAt: "2026-01-09T16:30:00Z",
  },
  {
    id: "ord-4",
    tenantId: "tenant-1",
    orderNumber: "ORD-2026-0039",
    status: "cancelled",
    items: [
      {
        id: "oi-6",
        orderId: "ord-4",
        variantId: "v8",
        productName: "Running Shoes",
        variantSku: "SHO-WHT-42",
        quantity: 2,
        fulfilledQuantity: 0,
        unitPrice: 119.99,
        availableStock: 3,
      },
    ],
    totalAmount: 239.98,
    customerName: "Emily Davis",
    customerEmail: "emily.d@example.com",
    notes: "Customer requested cancellation",
    createdAt: "2026-01-07T09:45:00Z",
    updatedAt: "2026-01-07T15:00:00Z",
  },
  {
    id: "ord-5",
    tenantId: "tenant-1",
    orderNumber: "ORD-2026-0038",
    status: "pending",
    items: [
      {
        id: "oi-7",
        orderId: "ord-5",
        variantId: "v12",
        productName: "Premium Hoodie",
        variantSku: "HOD-GRY-L",
        quantity: 2,
        fulfilledQuantity: 0,
        unitPrice: 59.99,
        availableStock: 54,
      },
      {
        id: "oi-8",
        orderId: "ord-5",
        variantId: "v10",
        productName: "Wireless Headphones",
        variantSku: "HPH-WHT-01",
        quantity: 1,
        fulfilledQuantity: 0,
        unitPrice: 199.99,
        availableStock: 18,
      },
    ],
    totalAmount: 319.97,
    customerName: "Alex Brown",
    customerEmail: "alex.b@example.com",
    createdAt: "2026-01-06T16:20:00Z",
    updatedAt: "2026-01-06T16:20:00Z",
  },
]

type StatusFilter = "all" | OrderStatus

export function OrdersContent() {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // UI state
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setIsLoading(true)
        await new Promise((resolve) => setTimeout(resolve, 600))
        setOrders(MOCK_ORDERS)
      } catch {
        setError("Failed to load orders")
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrders()
  }, [])

  // Filter and search orders
  const filteredOrders = useMemo(() => {
    let result = [...orders]

    // Status filter
    if (statusFilter !== "all") {
      result = result.filter((o) => o.status === statusFilter)
    }

    // Search
    if (search) {
      const searchLower = search.toLowerCase()
      result = result.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(searchLower) ||
          o.customerName?.toLowerCase().includes(searchLower) ||
          o.customerEmail?.toLowerCase().includes(searchLower),
      )
    }

    // Sort by created date (newest first)
    result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    return result
  }, [orders, statusFilter, search])

  // Status counts for tabs
  const statusCounts = useMemo(() => {
    return {
      all: orders.length,
      pending: orders.filter((o) => o.status === "pending").length,
      partially_fulfilled: orders.filter((o) => o.status === "partially_fulfilled").length,
      completed: orders.filter((o) => o.status === "completed").length,
      cancelled: orders.filter((o) => o.status === "cancelled").length,
    }
  }, [orders])

  const handleOrderCreated = useCallback((order: Order) => {
    setOrders((prev) => [order, ...prev])
    setShowCreateDialog(false)
  }, [])

  const handleOrderUpdated = useCallback((updatedOrder: Order) => {
    setOrders((prev) => prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o)))
    setSelectedOrder(updatedOrder)
  }, [])

  if (isLoading) {
    return <LoadingState message="Loading orders..." />
  }

  if (error) {
    return <ErrorState message={error} onRetry={() => window.location.reload()} />
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search orders..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Order
        </Button>
      </div>

      {/* Status Tabs */}
      <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
        <TabsList>
          <TabsTrigger value="all">All ({statusCounts.all})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({statusCounts.pending})</TabsTrigger>
          <TabsTrigger value="partially_fulfilled">Partial ({statusCounts.partially_fulfilled})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({statusCounts.completed})</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled ({statusCounts.cancelled})</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Orders Table */}
      <OrdersTable orders={filteredOrders} onSelectOrder={setSelectedOrder} />

      {/* Create Order Dialog */}
      <CreateOrderDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} onSuccess={handleOrderCreated} />

      {/* Order Detail Sheet */}
      <OrderDetailSheet order={selectedOrder} onClose={() => setSelectedOrder(null)} onUpdate={handleOrderUpdated} />
    </div>
  )
}
