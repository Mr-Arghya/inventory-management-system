"use client"

import type React from "react"

import { useEffect, useMemo } from "react"
import { Plus, Minus, X, AlertCircle, Search } from "lucide-react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useFieldArray, Controller } from "react-hook-form"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import type { Order, ProductVariant } from "@/types"
import { cn } from "@/lib/utils"
import { createOrderSchema, type CreateOrderFormData } from "@/lib/validations"

interface CreateOrderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (order: Order) => void
}

// Mock available variants for order creation
const AVAILABLE_VARIANTS: (ProductVariant & { productName: string })[] = [
  {
    id: "v1",
    productId: "p1",
    productName: "Classic T-Shirt",
    sku: "TSH-BLK-S",
    attributes: [
      { name: "Color", value: "Black" },
      { name: "Size", value: "S" },
    ],
    stock: 45,
    price: 29.99,
    cost: 12.0,
    low_threshold: 10,
    pendingPurchaseOrderQuantity: 0,
  },
  {
    id: "v2",
    productId: "p1",
    productName: "Classic T-Shirt",
    sku: "TSH-BLK-M",
    attributes: [
      { name: "Color", value: "Black" },
      { name: "Size", value: "M" },
    ],
    stock: 5,
    price: 29.99,
    cost: 12.0,
    low_threshold: 10,
    pendingPurchaseOrderQuantity: 50,
  },
  {
    id: "v6",
    productId: "p2",
    productName: "Running Shoes",
    sku: "SHO-BLK-40",
    attributes: [
      { name: "Color", value: "Black" },
      { name: "Size", value: "40" },
    ],
    stock: 15,
    price: 119.99,
    cost: 55.0,
    low_threshold: 10,
    pendingPurchaseOrderQuantity: 0,
  },
  {
    id: "v9",
    productId: "p3",
    productName: "Wireless Headphones",
    sku: "HPH-BLK-01",
    attributes: [{ name: "Color", value: "Black" }],
    stock: 2,
    price: 199.99,
    cost: 85.0,
    low_threshold: 10,
    pendingPurchaseOrderQuantity: 0,
  },
  {
    id: "v11",
    productId: "p4",
    productName: "Premium Hoodie",
    sku: "HOD-GRY-M",
    attributes: [
      { name: "Color", value: "Gray" },
      { name: "Size", value: "M" },
    ],
    stock: 67,
    price: 59.99,
    cost: 28.0,
    low_threshold: 15,
    pendingPurchaseOrderQuantity: 0,
  },
]

export function CreateOrderDialog({ open, onOpenChange, onSuccess }: CreateOrderDialogProps) {
  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateOrderFormData & { search: string }>({
    resolver: zodResolver(createOrderSchema),
    mode: "onChange",
    defaultValues: {
      customerName: "",
      customerEmail: "",
      notes: "",
      items: [],
      search: "",
    },
  })

  const { fields: itemFields, append: appendItem, remove: removeItem, update: updateItem } = useFieldArray({
    control,
    name: "items",
  })

  const items = watch("items")
  const search = watch("search")

  // Filter variants based on search
  const filteredVariants = useMemo(() => {
    if (!search) return AVAILABLE_VARIANTS
    const searchLower = search.toLowerCase()
    return AVAILABLE_VARIANTS.filter(
      (v) =>
        v.productName.toLowerCase().includes(searchLower) ||
        v.sku.toLowerCase().includes(searchLower) ||
        v.attributes.some((a) => a.value.toLowerCase().includes(searchLower)),
    )
  }, [search])

  // Calculate totals
  const totalAmount = useMemo(() => {
    return items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
  }, [items])

  // Check for stock issues
  const stockIssues = useMemo(() => {
    return items.filter((item) => item.quantity > (AVAILABLE_VARIANTS.find(v => v.id === item.variantId)?.stock || 0))
  }, [items])

  const resetForm = () => {
    reset({
      customerName: "",
      customerEmail: "",
      notes: "",
      items: [],
    })
    setValue("search", "")
  }

  useEffect(() => {
    if (!open) {
      resetForm()
    }
  }, [open, reset])

  const addItem = (variant: (typeof AVAILABLE_VARIANTS)[0]) => {
    const existingIndex = items.findIndex((i) => i.variantId === variant.id)
    if (existingIndex >= 0) {
      updateItem(existingIndex, {
        variantId: variant.id,
        productName: variant.productName,
        variantSku: variant.sku,
        quantity: items[existingIndex].quantity + 1,
        unitPrice: variant.price,
      })
    } else {
      appendItem({
        variantId: variant.id,
        productName: variant.productName,
        variantSku: variant.sku,
        quantity: 1,
        unitPrice: variant.price,
      })
    }
    setValue("search", "")
  }

  const onSubmit = async (data: CreateOrderFormData) => {
    if (data.items.length === 0 || stockIssues.length > 0) return

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 800))

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      tenantId: "tenant-1",
      orderNumber: `ORD-2026-${String(Math.floor(Math.random() * 9999)).padStart(4, "0")}`,
      status: "pending",
      items: data.items.map((item) => ({
        id: `oi-${Date.now()}-${item.variantId}`,
        orderId: "",
        variantId: item.variantId,
        productName: item.productName,
        variantSku: item.variantSku,
        quantity: item.quantity,
        fulfilledQuantity: 0,
        unitPrice: item.unitPrice,
        availableStock: item.quantity, // This would come from the variant in real implementation
      })),
      totalAmount,
      customerName: data.customerName || undefined,
      customerEmail: data.customerEmail || undefined,
      notes: data.notes || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    console.log("[v0] Order created:", newOrder)
    onSuccess(newOrder)
    resetForm()
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) resetForm()
        onOpenChange(o)
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Order</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Customer Info */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="customerName">Customer Name</Label>
              <Input
                id="customerName"
                {...register("customerName")}
                placeholder="John Smith"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customerEmail">Customer Email</Label>
              <Input
                id="customerEmail"
                type="email"
                {...register("customerEmail")}
                placeholder="john@example.com"
                className={errors.customerEmail ? "border-destructive" : ""}
              />
              {errors.customerEmail && (
                <p className="text-sm text-destructive">{errors.customerEmail.message}</p>
              )}
            </div>
          </div>

          {/* Product Search */}
          <div className="space-y-3">
            <Label>Add Products</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setValue("search", e.target.value)}
                placeholder="Search products..."
                className="pl-9"
              />
            </div>

            {/* Search Results */}
            {search && (
              <div className="max-h-48 overflow-y-auto rounded-lg border border-border">
                {filteredVariants.length === 0 ? (
                  <p className="p-4 text-center text-sm text-muted-foreground">No products found</p>
                ) : (
                  filteredVariants.map((variant) => {
                    const isLowStock = variant.stock <= 5
                    const isOutOfStock = variant.stock === 0

                    return (
                      <div
                        key={variant.id}
                        className={cn(
                          "flex items-center justify-between p-3 hover:bg-secondary/50 cursor-pointer",
                          isOutOfStock && "opacity-50",
                        )}
                        onClick={() => !isOutOfStock && addItem(variant)}
                      >
                        <div>
                          <p className="font-medium text-card-foreground">{variant.productName}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{variant.sku}</span>
                            {variant.attributes.map((attr) => (
                              <Badge key={attr.name} variant="outline" className="text-xs">
                                {attr.value}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">${variant.price.toFixed(2)}</p>
                          <p
                            className={cn(
                              "text-xs",
                              isOutOfStock ? "text-destructive" : isLowStock ? "text-warning" : "text-muted-foreground",
                            )}
                          >
                            {isOutOfStock ? "Out of stock" : `${variant.stock} in stock`}
                          </p>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            )}
          </div>

          {/* Selected Items */}
          {itemFields.length > 0 && (
            <div className="space-y-3">
              <Label>Order Items</Label>
              <div className="rounded-lg border border-border divide-y divide-border">
                {itemFields.map((field, index) => {
                  const item = items[index]
                  const variant = AVAILABLE_VARIANTS.find(v => v.id === item.variantId)
                  const hasStockIssue = variant ? item.quantity > variant.stock : false

                  return (
                    <div key={field.id} className="flex items-center justify-between p-3">
                      <div className="flex-1">
                        <p className="font-medium text-card-foreground">{item.productName}</p>
                        <p className="text-sm text-muted-foreground">{item.variantSku}</p>
                        {hasStockIssue && (
                          <p className="flex items-center gap-1 text-xs text-destructive mt-1">
                            <AlertCircle className="h-3 w-3" />
                            Only {variant?.stock} available
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <Controller
                          control={control}
                          name={`items.${index}.quantity`}
                          render={() => (
                            <div className="flex items-center gap-1">
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 bg-transparent"
                                onClick={() => {
                                  if (item.quantity > 1) {
                                    updateItem(index, { ...item, quantity: item.quantity - 1 })
                                  } else {
                                    removeItem(index)
                                  }
                                }}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-8 text-center font-medium">{item.quantity}</span>
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 bg-transparent"
                                onClick={() => updateItem(index, { ...item, quantity: item.quantity + 1 })}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        />

                        <p className="w-20 text-right font-medium">
                          ${(item.unitPrice * item.quantity).toFixed(2)}
                        </p>

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => removeItem(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )
                })}

                {/* Total */}
                <div className="flex items-center justify-between p-3 bg-secondary/30">
                  <p className="font-medium">Total</p>
                  <p className="text-lg font-semibold">${totalAmount.toFixed(2)}</p>
                </div>
              </div>
              {errors.items && (
                <p className="text-sm text-destructive">{errors.items.message}</p>
              )}
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              {...register("notes")}
              placeholder="Order notes..."
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={itemFields.length === 0 || stockIssues.length > 0 || isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Order"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

