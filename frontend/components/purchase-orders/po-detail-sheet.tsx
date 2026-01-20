"use client"

import { useState } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Send, CheckCircle, Package, AlertTriangle, ArrowUp, ArrowDown } from "lucide-react"
import type { PurchaseOrder, PurchaseOrderStatus, PurchaseOrderItem } from "@/types"
import { cn } from "@/lib/utils"

interface PODetailSheetProps {
  purchaseOrder: PurchaseOrder | null
  onClose: () => void
  onUpdate: (po: PurchaseOrder) => void
}

const statusConfig: Record<PurchaseOrderStatus, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-muted text-muted-foreground border-muted" },
  sent: { label: "Sent", className: "bg-chart-2/10 text-chart-2 border-chart-2/20" },
  confirmed: { label: "Confirmed", className: "bg-warning/10 text-warning border-warning/20" },
  received: { label: "Received", className: "bg-chart-1/10 text-chart-1 border-chart-1/20" },
}

export function PODetailSheet({ purchaseOrder, onClose, onUpdate }: PODetailSheetProps) {
  const [receiveQuantities, setReceiveQuantities] = useState<Record<string, number>>({})
  const [isProcessing, setIsProcessing] = useState(false)

  if (!purchaseOrder) return null

  const status = statusConfig[purchaseOrder.status]

  const totalItems = purchaseOrder.items.reduce((sum, item) => sum + item.quantity, 0)
  const receivedItems = purchaseOrder.items.reduce((sum, item) => sum + item.receivedQuantity, 0)
  const receivedPercentage = (receivedItems / totalItems) * 100

  const canSend = purchaseOrder.status === "draft"
  const canReceive = purchaseOrder.status === "confirmed"

  const handleStatusChange = async (newStatus: PurchaseOrderStatus) => {
    setIsProcessing(true)
    await new Promise((resolve) => setTimeout(resolve, 500))

    const updatedPO: PurchaseOrder = {
      ...purchaseOrder,
      status: newStatus,
      updatedAt: new Date().toISOString(),
    }

    console.log("[v0] PO status changed:", { poId: purchaseOrder.id, newStatus })
    onUpdate(updatedPO)
    setIsProcessing(false)
  }

  const handleReceiveItem = async (item: PurchaseOrderItem) => {
    const quantity = receiveQuantities[item.id] || 0
    if (quantity <= 0) return

    setIsProcessing(true)
    await new Promise((resolve) => setTimeout(resolve, 500))

    const newReceivedQuantity = Math.min(item.quantity, item.receivedQuantity + quantity)
    const updatedItems = purchaseOrder.items.map((i) =>
      i.id === item.id ? { ...i, receivedQuantity: newReceivedQuantity } : i,
    )

    // Check if all items are received
    const allReceived = updatedItems.every((i) => i.receivedQuantity >= i.quantity)

    const updatedPO: PurchaseOrder = {
      ...purchaseOrder,
      items: updatedItems,
      status: allReceived ? "received" : purchaseOrder.status,
      updatedAt: new Date().toISOString(),
    }

    console.log("[v0] PO item received:", { poId: purchaseOrder.id, itemId: item.id, quantity })
    onUpdate(updatedPO)
    setReceiveQuantities((prev) => ({ ...prev, [item.id]: 0 }))
    setIsProcessing(false)
  }

  return (
    <Sheet open={!!purchaseOrder} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle>{purchaseOrder.poNumber}</SheetTitle>
            <Badge variant="outline" className={cn("border", status.className)}>
              {status.label}
            </Badge>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Supplier Info */}
          <div className="rounded-lg border border-border p-4 space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">Supplier</h3>
            <p className="font-medium text-card-foreground">{purchaseOrder.supplierName}</p>
            {purchaseOrder.expectedDeliveryDate && (
              <p className="text-sm text-muted-foreground">
                Expected delivery:{" "}
                {new Date(purchaseOrder.expectedDeliveryDate).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            )}
          </div>

          {/* Receiving Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Receiving Progress</span>
              <span className="font-medium">
                {receivedItems}/{totalItems} items
              </span>
            </div>
            <Progress value={receivedPercentage} className="h-2" />
          </div>

          {/* Status Actions */}
          {(canSend || purchaseOrder.status === "sent") && (
            <div className="flex gap-2">
              {canSend && (
                <Button
                  variant="outline"
                  className="flex-1 bg-transparent"
                  onClick={() => handleStatusChange("sent")}
                  disabled={isProcessing}
                >
                  <Send className="mr-2 h-4 w-4" />
                  Send to Supplier
                </Button>
              )}
              {purchaseOrder.status === "sent" && (
                <Button className="flex-1" onClick={() => handleStatusChange("confirmed")} disabled={isProcessing}>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Mark Confirmed
                </Button>
              )}
            </div>
          )}

          {/* Order Items */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">Items</h3>
            <div className="rounded-lg border border-border divide-y divide-border">
              {purchaseOrder.items.map((item) => {
                const remaining = item.quantity - item.receivedQuantity
                const isFullyReceived = remaining === 0
                const hasPriceVariance = item.priceVariance !== 0

                return (
                  <div key={item.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-card-foreground">{item.productName}</p>
                        <p className="text-sm text-muted-foreground">{item.variantSku}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${(item.unitPrice * item.quantity).toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">@ ${item.unitPrice.toFixed(2)} ea</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        Qty: {item.quantity} | Received: {item.receivedQuantity}
                      </span>
                      {isFullyReceived ? (
                        <Badge className="bg-chart-1/10 text-chart-1 border-chart-1/20">
                          <Package className="mr-1 h-3 w-3" />
                          Received
                        </Badge>
                      ) : (
                        <span className="text-warning">{remaining} pending</span>
                      )}
                    </div>

                    {/* Price variance indicator */}
                    {hasPriceVariance && (
                      <div
                        className={cn(
                          "flex items-center gap-1 text-xs",
                          item.priceVariance < 0 ? "text-chart-1" : "text-chart-4",
                        )}
                      >
                        {item.priceVariance < 0 ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />}$
                        {Math.abs(item.priceVariance).toFixed(2)} {item.priceVariance < 0 ? "below" : "above"} expected
                        price
                        {item.priceVariance > 0 && <AlertTriangle className="h-3 w-3 ml-1" />}
                      </div>
                    )}

                    {/* Receive action */}
                    {canReceive && !isFullyReceived && (
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="0"
                          max={remaining}
                          value={receiveQuantities[item.id] || ""}
                          onChange={(e) =>
                            setReceiveQuantities((prev) => ({
                              ...prev,
                              [item.id]: Math.min(Math.max(0, Number.parseInt(e.target.value) || 0), remaining),
                            }))
                          }
                          placeholder="Qty"
                          className="w-20"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReceiveItem(item)}
                          disabled={!receiveQuantities[item.id] || isProcessing}
                        >
                          Receive
                        </Button>
                      </div>
                    )}
                  </div>
                )
              })}

              {/* Total */}
              <div className="flex items-center justify-between p-4 bg-secondary/30">
                <p className="font-medium">Total</p>
                <p className="text-lg font-semibold">${purchaseOrder.totalAmount.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Notes */}
          {purchaseOrder.notes && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Notes</h3>
              <p className="text-sm text-card-foreground rounded-lg bg-secondary/50 p-3">{purchaseOrder.notes}</p>
            </div>
          )}

          {/* Timestamps */}
          <div className="text-xs text-muted-foreground space-y-1">
            <p>
              Created:{" "}
              {new Date(purchaseOrder.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
            <p>
              Updated:{" "}
              {new Date(purchaseOrder.updatedAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
