"use client"

import { memo } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/ui/empty-state"
import { FileText, ChevronRight } from "lucide-react"
import type { PurchaseOrder, PurchaseOrderStatus } from "@/types"
import { cn } from "@/lib/utils"

interface PurchaseOrdersTableProps {
  purchaseOrders: PurchaseOrder[]
  onSelectPO: (po: PurchaseOrder) => void
}

const statusConfig: Record<PurchaseOrderStatus, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-muted text-muted-foreground border-muted" },
  sent: { label: "Sent", className: "bg-chart-2/10 text-chart-2 border-chart-2/20" },
  confirmed: { label: "Confirmed", className: "bg-warning/10 text-warning border-warning/20" },
  received: { label: "Received", className: "bg-chart-1/10 text-chart-1 border-chart-1/20" },
}

const PORow = memo(function PORow({
  purchaseOrder,
  onSelect,
}: {
  purchaseOrder: PurchaseOrder
  onSelect: (po: PurchaseOrder) => void
}) {
  const status = statusConfig[purchaseOrder.status]
  const totalItems = purchaseOrder.items.reduce((sum, item) => sum + item.quantity, 0)
  const receivedItems = purchaseOrder.items.reduce((sum, item) => sum + item.receivedQuantity, 0)

  return (
    <TableRow className="group cursor-pointer hover:bg-secondary/50" onClick={() => onSelect(purchaseOrder)}>
      <TableCell className="font-medium">{purchaseOrder.poNumber}</TableCell>
      <TableCell>{purchaseOrder.supplierName}</TableCell>
      <TableCell>
        <Badge variant="outline" className={cn("border", status.className)}>
          {status.label}
        </Badge>
      </TableCell>
      <TableCell className="text-muted-foreground">
        {receivedItems}/{totalItems} items
      </TableCell>
      <TableCell className="font-medium">${purchaseOrder.totalAmount.toFixed(2)}</TableCell>
      <TableCell className="text-muted-foreground">
        {purchaseOrder.expectedDeliveryDate
          ? new Date(purchaseOrder.expectedDeliveryDate).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })
          : "—"}
      </TableCell>
      <TableCell>
        <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100" />
      </TableCell>
    </TableRow>
  )
})

export function PurchaseOrdersTable({ purchaseOrders, onSelectPO }: PurchaseOrdersTableProps) {
  if (purchaseOrders.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="No purchase orders found"
        description="Create your first purchase order to restock inventory."
      />
    )
  }

  return (
    <div className="rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>PO #</TableHead>
            <TableHead>Supplier</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Received</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Expected</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {purchaseOrders.map((po) => (
            <PORow key={po.id} purchaseOrder={po} onSelect={onSelectPO} />
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
