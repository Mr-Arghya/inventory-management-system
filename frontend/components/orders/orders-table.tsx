"use client"

import { memo } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/ui/empty-state"
import { ShoppingCart, ChevronRight } from "lucide-react"
import type { Order, OrderStatus } from "@/types"
import { cn } from "@/lib/utils"

interface OrdersTableProps {
  orders: Order[]
  onSelectOrder: (order: Order) => void
}

const statusConfig: Record<OrderStatus, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-warning/10 text-warning border-warning/20" },
  partially_fulfilled: { label: "Partial", className: "bg-chart-2/10 text-chart-2 border-chart-2/20" },
  completed: { label: "Completed", className: "bg-chart-1/10 text-chart-1 border-chart-1/20" },
  cancelled: { label: "Cancelled", className: "bg-muted text-muted-foreground border-muted" },
}

const OrderRow = memo(function OrderRow({
  order,
  onSelect,
}: {
  order: Order
  onSelect: (order: Order) => void
}) {
  const status = statusConfig[order.status]
  const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0)
  const fulfilledItems = order.items.reduce((sum, item) => sum + item.fulfilledQuantity, 0)

  return (
    <TableRow className="group cursor-pointer hover:bg-secondary/50" onClick={() => onSelect(order)}>
      <TableCell className="font-medium">{order.orderNumber}</TableCell>
      <TableCell>
        <div>
          <p className="font-medium text-card-foreground">{order.customerName || "—"}</p>
          <p className="text-xs text-muted-foreground">{order.customerEmail || "—"}</p>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="outline" className={cn("border", status.className)}>
          {status.label}
        </Badge>
      </TableCell>
      <TableCell>
        <span className="text-muted-foreground">
          {fulfilledItems}/{totalItems} items
        </span>
      </TableCell>
      <TableCell className="font-medium">${order.totalAmount.toFixed(2)}</TableCell>
      <TableCell className="text-muted-foreground">
        {new Date(order.createdAt).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </TableCell>
      <TableCell>
        <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100" />
      </TableCell>
    </TableRow>
  )
})

export function OrdersTable({ orders, onSelectOrder }: OrdersTableProps) {
  if (orders.length === 0) {
    return (
      <EmptyState icon={ShoppingCart} title="No orders found" description="Create your first order to get started." />
    )
  }

  return (
    <div className="rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order #</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Fulfillment</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <OrderRow key={order.id} order={order} onSelect={onSelectOrder} />
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
