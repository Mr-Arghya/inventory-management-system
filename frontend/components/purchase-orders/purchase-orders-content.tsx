"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Plus, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { LoadingState } from "@/components/ui/loading-state"
import { ErrorState } from "@/components/ui/error-state"
import { PurchaseOrdersTable } from "./purchase-orders-table"
import { CreatePODialog } from "./create-po-dialog"
import { PODetailSheet } from "./po-detail-sheet"
import type { PurchaseOrder, PurchaseOrderStatus } from "@/types"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Mock purchase orders data
const MOCK_PURCHASE_ORDERS: PurchaseOrder[] = [
  {
    id: "po-1",
    tenantId: "tenant-1",
    poNumber: "PO-2026-0015",
    supplierId: "sup-1",
    supplierName: "Premium Textiles Co.",
    status: "confirmed",
    items: [
      {
        id: "poi-1",
        purchaseOrderId: "po-1",
        variantId: "v2",
        productName: "Classic T-Shirt",
        variantSku: "TSH-BLK-M",
        quantity: 50,
        receivedQuantity: 0,
        unitPrice: 10.5,
        expectedPrice: 10.5,
        priceVariance: 0,
      },
      {
        id: "poi-2",
        purchaseOrderId: "po-1",
        variantId: "v11",
        productName: "Premium Hoodie",
        variantSku: "HOD-GRY-M",
        quantity: 25,
        receivedQuantity: 0,
        unitPrice: 25.0,
        expectedPrice: 25.0,
        priceVariance: 0,
      },
    ],
    totalAmount: 1150.0,
    expectedDeliveryDate: "2026-01-17",
    notes: "Regular monthly restock",
    createdAt: "2026-01-08T10:00:00Z",
    updatedAt: "2026-01-09T14:30:00Z",
  },
  {
    id: "po-2",
    tenantId: "tenant-1",
    poNumber: "PO-2026-0014",
    supplierId: "sup-2",
    supplierName: "Global Footwear Ltd.",
    status: "sent",
    items: [
      {
        id: "poi-3",
        purchaseOrderId: "po-2",
        variantId: "v8",
        productName: "Running Shoes",
        variantSku: "SHO-WHT-42",
        quantity: 20,
        receivedQuantity: 0,
        unitPrice: 52.0,
        expectedPrice: 52.0,
        priceVariance: 0,
      },
    ],
    totalAmount: 1040.0,
    expectedDeliveryDate: "2026-01-20",
    createdAt: "2026-01-07T09:00:00Z",
    updatedAt: "2026-01-07T09:00:00Z",
  },
  {
    id: "po-3",
    tenantId: "tenant-1",
    poNumber: "PO-2026-0013",
    supplierId: "sup-3",
    supplierName: "TechSound Electronics",
    status: "received",
    items: [
      {
        id: "poi-4",
        purchaseOrderId: "po-3",
        variantId: "v9",
        productName: "Wireless Headphones",
        variantSku: "HPH-BLK-01",
        quantity: 30,
        receivedQuantity: 30,
        unitPrice: 78.0,
        expectedPrice: 80.0,
        priceVariance: -2.0,
      },
    ],
    totalAmount: 2340.0,
    expectedDeliveryDate: "2026-01-05",
    notes: "Received with better pricing than expected",
    createdAt: "2025-12-28T14:00:00Z",
    updatedAt: "2026-01-05T11:00:00Z",
  },
  {
    id: "po-4",
    tenantId: "tenant-1",
    poNumber: "PO-2026-0012",
    supplierId: "sup-1",
    supplierName: "Premium Textiles Co.",
    status: "draft",
    items: [
      {
        id: "poi-5",
        purchaseOrderId: "po-4",
        variantId: "v1",
        productName: "Classic T-Shirt",
        variantSku: "TSH-BLK-S",
        quantity: 100,
        receivedQuantity: 0,
        unitPrice: 10.5,
        expectedPrice: 10.5,
        priceVariance: 0,
      },
    ],
    totalAmount: 1050.0,
    createdAt: "2026-01-10T08:00:00Z",
    updatedAt: "2026-01-10T08:00:00Z",
  },
]

type StatusFilter = "all" | PurchaseOrderStatus

export function PurchaseOrdersContent() {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // UI state
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null)

  useEffect(() => {
    const fetchPurchaseOrders = async () => {
      try {
        setIsLoading(true)
        await new Promise((resolve) => setTimeout(resolve, 500))
        setPurchaseOrders(MOCK_PURCHASE_ORDERS)
      } catch {
        setError("Failed to load purchase orders")
      } finally {
        setIsLoading(false)
      }
    }

    fetchPurchaseOrders()
  }, [])

  // Filter and search
  const filteredPurchaseOrders = useMemo(() => {
    let result = [...purchaseOrders]

    if (statusFilter !== "all") {
      result = result.filter((po) => po.status === statusFilter)
    }

    if (search) {
      const searchLower = search.toLowerCase()
      result = result.filter(
        (po) => po.poNumber.toLowerCase().includes(searchLower) || po.supplierName.toLowerCase().includes(searchLower),
      )
    }

    // Sort by created date (newest first)
    result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    return result
  }, [purchaseOrders, statusFilter, search])

  // Status counts
  const statusCounts = useMemo(() => {
    return {
      all: purchaseOrders.length,
      draft: purchaseOrders.filter((po) => po.status === "draft").length,
      sent: purchaseOrders.filter((po) => po.status === "sent").length,
      confirmed: purchaseOrders.filter((po) => po.status === "confirmed").length,
      received: purchaseOrders.filter((po) => po.status === "received").length,
    }
  }, [purchaseOrders])

  const handlePOCreated = useCallback((po: PurchaseOrder) => {
    setPurchaseOrders((prev) => [po, ...prev])
    setShowCreateDialog(false)
  }, [])

  const handlePOUpdated = useCallback((updatedPO: PurchaseOrder) => {
    setPurchaseOrders((prev) => prev.map((po) => (po.id === updatedPO.id ? updatedPO : po)))
    setSelectedPO(updatedPO)
  }, [])

  if (isLoading) {
    return <LoadingState message="Loading purchase orders..." />
  }

  if (error) {
    return <ErrorState message={error} onRetry={() => window.location.reload()} />
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search POs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create PO
        </Button>
      </div>

      {/* Status Tabs */}
      <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
        <TabsList>
          <TabsTrigger value="all">All ({statusCounts.all})</TabsTrigger>
          <TabsTrigger value="draft">Draft ({statusCounts.draft})</TabsTrigger>
          <TabsTrigger value="sent">Sent ({statusCounts.sent})</TabsTrigger>
          <TabsTrigger value="confirmed">Confirmed ({statusCounts.confirmed})</TabsTrigger>
          <TabsTrigger value="received">Received ({statusCounts.received})</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Purchase Orders Table */}
      <PurchaseOrdersTable purchaseOrders={filteredPurchaseOrders} onSelectPO={setSelectedPO} />

      {/* Create PO Dialog */}
      <CreatePODialog open={showCreateDialog} onOpenChange={setShowCreateDialog} onSuccess={handlePOCreated} />

      {/* PO Detail Sheet */}
      <PODetailSheet purchaseOrder={selectedPO} onClose={() => setSelectedPO(null)} onUpdate={handlePOUpdated} />
    </div>
  )
}
