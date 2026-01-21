"use client"

import type React from "react"

import { useState } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { AlertCircle, Package, CheckCircle, XCircle } from "lucide-react"
import type { Order, OrderStatus, OrderItem } from "@/types"
import { cn } from "@/lib/utils"

interface OrderDetailSheetProps {
  order: Order | null
  onClose: () => void
  onUpdate: (order: Order) => void
}

const statusConfig: Record<OrderStatus, { label: string; className: string; icon: React.ElementType }> = {
  pending: { label: "Pending", className: "bg-warning/10 text-warning border-warning/20", icon: Package },
  partially_fulfilled: {
    label: "Partially Fulfilled",
    className: "bg-chart-2/10 text-chart-2 border-chart-2/20",
    icon: Package,
  },
  fulfilled: { label: "Completed", className: "bg-chart-1/10 text-chart-1 border-chart-1/20", icon: CheckCircle },
  cancelled: { label: "Cancelled", className: "bg-muted text-muted-foreground border-muted", icon: XCircle },
  confirmed: { label: "Confirmed", className: "bg-chart-3/10 text-chart-3 border-chart-3/20", icon: Package },
  processing: { label: "Processing", className: "bg-chart-4/10 text-chart-4 border-chart-4/20", icon: Package },
  refunded: { label: "Refunded", className: "bg-chart-5/10 text-chart-5 border-chart-5/20", icon: Package },
  failed: { label: "Failed", className: "bg-chart-6/10 text-chart-6 border-chart-6/20", icon: AlertCircle },
}

export function OrderDetailSheet({ order, onClose, onUpdate }: OrderDetailSheetProps) {
  const [fulfillQuantities, setFulfillQuantities] = useState<Record<string, number>>({})
  const [isProcessing, setIsProcessing] = useState(false)

  if (!order) return null

  const status = statusConfig[order.status]
  const StatusIcon = status.icon

  const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0)
  const fulfilledItems = order.items.reduce((sum, item) => sum + item.fulfilledQuantity, 0)
  const fulfillmentPercentage = (fulfilledItems / totalItems) * 100

  const canFulfill = order.status === "pending" || order.status === "partially_fulfilled"
  const canCancel = order.status === "pending"

  const handleFulfillItem = async (item: OrderItem) => {
    const quantity = fulfillQuantities[item._id] || 0
    if (quantity <= 0) return

    setIsProcessing(true)
    await new Promise((resolve) => setTimeout(resolve, 500))

    const newFulfilledQuantity = Math.min(item.quantity, item.fulfilledQuantity + quantity)
    const updatedItems = order.items.map((i) =>
      i._id === item._id ? { ...i, fulfilledQuantity: newFulfilledQuantity } : i,
    )
    const allFulfilled = updatedItems.every((i) => i.fulfilledQuantity >= i.quantity)
    const anyFulfilled = updatedItems.some((i) => i.fulfilledQuantity > 0)

    const newStatus: OrderStatus = allFulfilled ? "fulfilled" : anyFulfilled ? "partially_fulfilled" : order.status

    const updatedOrder: Order = {
      ...order,
      items: updatedItems,
      status: newStatus,
      updatedAt: new Date().toISOString(),
    }

    console.log("[v0] Order item fulfilled:", { orderId: order._id, itemId: item._id, quantity })
    onUpdate(updatedOrder)
    setFulfillQuantities((prev) => ({ ...prev, [item._id]: 0 }))
    setIsProcessing(false)
  }

  const handleCancelOrder = async () => {
    setIsProcessing(true)
    await new Promise((resolve) => setTimeout(resolve, 500))

    const updatedOrder: Order = {
      ...order,
      status: "cancelled",
      updatedAt: new Date().toISOString(),
    }
    onUpdate(updatedOrder)
    setIsProcessing(false)
  }

  return (
    <Sheet open={!!order} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle>{order.orderNumber}</SheetTitle>
            <Badge variant="outline" className={cn("border", status.className)}>
              <StatusIcon className="mr-1 h-3 w-3" />
              {status.label}
            </Badge>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Customer Info */}
          <div className="rounded-lg border border-border p-4 space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">Customer</h3>
            <p className="font-medium text-card-foreground">{order.customerName || "No name provided"}</p>
            <p className="text-sm text-muted-foreground">{order.customerEmail || "No email provided"}</p>
          </div>

          {/* Fulfillment Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Fulfillment Progress</span>
              <span className="font-medium">
                {fulfilledItems}/{totalItems} items
              </span>
            </div>
            <Progress value={fulfillmentPercentage} className="h-2" />
          </div>

          {/* Order Items */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">Items</h3>
            <div className="rounded-lg border border-border divide-y divide-border">
              {order.items.map((item) => {
                const remaining = item.quantity - item.fulfilledQuantity
                const isFullyFulfilled = remaining === 0
                const hasStockIssue = item.availableStock < remaining

                return (
                  <div key={item._id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-card-foreground">{item.productName}</p>
                        <p className="text-sm text-muted-foreground">{item.variantSku}</p>
                      </div>
                      <p className="font-medium">${(item.unitPrice * item.quantity).toFixed(2)}</p>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        Qty: {item.quantity} | Fulfilled: {item.fulfilledQuantity}
                      </span>
                      {isFullyFulfilled ? (
                        <Badge className="bg-chart-1/10 text-chart-1 border-chart-1/20">Fulfilled</Badge>
                      ) : (
                        <span className="text-warning">{remaining} remaining</span>
                      )}
                    </div>

                    {/* Stock availability indicator */}
                    {!isFullyFulfilled && hasStockIssue && (
                      <p className="flex items-center gap-1 text-xs text-destructive">
                        <AlertCircle className="h-3 w-3" />
                        Only {item.availableStock} available in stock
                      </p>
                    )}

                    {/* Fulfill action */}
                    {canFulfill && !isFullyFulfilled && (
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="0"
                          max={Math.min(remaining, item.availableStock)}
                          value={fulfillQuantities[item._id] || ""}
                          onChange={(e) =>
                            setFulfillQuantities((prev) => ({
                              ...prev,
                              [item._id]: Math.min(
                                Math.max(0, Number.parseInt(e.target.value) || 0),
                                Math.min(remaining, item.availableStock),
                              ),
                            }))
                          }
                          placeholder="Qty"
                          className="w-20"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleFulfillItem(item)}
                          disabled={!fulfillQuantities[item._id] || isProcessing}
                        >
                          Fulfill
                        </Button>
                      </div>
                    )}
                  </div>
                )
              })}

              {/* Total */}
              <div className="flex items-center justify-between p-4 bg-secondary/30">
                <p className="font-medium">Total</p>
                <p className="text-lg font-semibold">${order.totalAmount.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Notes */}
          {order.notes && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Notes</h3>
              <p className="text-sm text-card-foreground rounded-lg bg-secondary/50 p-3">{order.notes}</p>
            </div>
          )}

          {/* Timestamps */}
          <div className="text-xs text-muted-foreground space-y-1">
            <p>
              Created:{" "}
              {new Date(order.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
            <p>
              Updated:{" "}
              {new Date(order.updatedAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>

          {/* Actions */}
          {canCancel && (
            <div className="pt-4 border-t border-border">
              <Button variant="destructive" className="w-full" onClick={handleCancelOrder} disabled={isProcessing}>
                {isProcessing ? "Processing..." : "Cancel Order"}
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
