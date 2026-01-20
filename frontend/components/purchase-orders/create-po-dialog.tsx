"use client"

import { useEffect, useMemo } from "react"
import { Plus, Minus, X, Search } from "lucide-react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useFieldArray, Controller } from "react-hook-form"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import type { PurchaseOrder, Supplier } from "@/types"
import { createPurchaseOrderSchema, type CreatePurchaseOrderFormData } from "@/lib/validations"

interface CreatePODialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (po: PurchaseOrder) => void
}

// Mock suppliers
const MOCK_SUPPLIERS: Supplier[] = [
  {
    id: "sup-1",
    tenantId: "tenant-1",
    name: "Premium Textiles Co.",
    email: "orders@premiumtextiles.com",
    products: [
      { variantId: "v1", price: 10.5, leadTimeDays: 7 },
      { variantId: "v2", price: 10.5, leadTimeDays: 7 },
      { variantId: "v11", price: 25.0, leadTimeDays: 10 },
    ],
    createdAt: "2025-06-15T10:00:00Z",
  },
  {
    id: "sup-2",
    tenantId: "tenant-1",
    name: "Global Footwear Ltd.",
    email: "supply@globalfootwear.com",
    products: [
      { variantId: "v6", price: 52.0, leadTimeDays: 14 },
      { variantId: "v8", price: 52.0, leadTimeDays: 14 },
    ],
    createdAt: "2025-07-20T14:30:00Z",
  },
  {
    id: "sup-3",
    tenantId: "tenant-1",
    name: "TechSound Electronics",
    email: "wholesale@techsound.com",
    products: [
      { variantId: "v9", price: 78.0, leadTimeDays: 5 },
      { variantId: "v10", price: 78.0, leadTimeDays: 5 },
    ],
    createdAt: "2025-08-10T09:15:00Z",
  },
]

// Mock product names
const PRODUCT_NAMES: Record<string, { name: string; sku: string }> = {
  v1: { name: "Classic T-Shirt (Black, S)", sku: "TSH-BLK-S" },
  v2: { name: "Classic T-Shirt (Black, M)", sku: "TSH-BLK-M" },
  v6: { name: "Running Shoes (Black, 40)", sku: "SHO-BLK-40" },
  v8: { name: "Running Shoes (White, 42)", sku: "SHO-WHT-42" },
  v9: { name: "Wireless Headphones (Black)", sku: "HPH-BLK-01" },
  v10: { name: "Wireless Headphones (White)", sku: "HPH-WHT-01" },
  v11: { name: "Premium Hoodie (Gray, M)", sku: "HOD-GRY-M" },
}

interface POLineItemData {
  variantId: string
  productName: string
  sku: string
  quantity: number
  unitPrice: number
}

export function CreatePODialog({ open, onOpenChange, onSuccess }: CreatePODialogProps) {
  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreatePurchaseOrderFormData & { search?: string }>({
    resolver: zodResolver(createPurchaseOrderSchema),
    mode: "onChange",
    defaultValues: {
      supplierId: "",
      expectedDeliveryDate: "",
      notes: "",
      items: [],
      search: "",
    },
  })

  const { fields: itemFields, append: appendItem, remove: removeItem, update: updateItem } = useFieldArray({
    control,
    name: "items",
  })

  const supplierId = watch("supplierId")
  const search = watch("search")
  const items = watch("items")

  const selectedSupplier = MOCK_SUPPLIERS.find((s) => s.id === supplierId)

  // Available products from selected supplier
  const availableProducts = useMemo(() => {
    if (!selectedSupplier) return []
    return selectedSupplier.products.map((p) => ({
      ...p,
      ...PRODUCT_NAMES[p.variantId],
    }))
  }, [selectedSupplier])

  // Filter by search
  const filteredProducts = useMemo(() => {
    if (!search) return availableProducts
    const searchLower = search.toLowerCase()
    return availableProducts.filter(
      (p) => p.name?.toLowerCase().includes(searchLower) || p.sku?.toLowerCase().includes(searchLower),
    )
  }, [availableProducts, search])

  // Total calculation
  const totalAmount = useMemo(() => {
    return items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
  }, [items])

  const resetForm = () => {
    reset({
      supplierId: "",
      expectedDeliveryDate: "",
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

  const addItem = (product: (typeof availableProducts)[0]) => {
    const existingIndex = items.findIndex((i) => i.variantId === product.variantId)
    if (existingIndex >= 0) {
      updateItem(existingIndex, {
        variantId: product.variantId,
        productName: product.name || "",
        sku: product.sku || "",
        quantity: items[existingIndex].quantity + 1,
        unitPrice: product.price,
      })
    } else {
      appendItem({
        variantId: product.variantId,
        productName: product.name || "",
        sku: product.sku || "",
        quantity: 1,
        unitPrice: product.price,
      })
    }
    setValue("search", "")
  }

  const onSubmit = async (data: CreatePurchaseOrderFormData) => {
    if (!selectedSupplier || data.items.length === 0) return
    await new Promise((resolve) => setTimeout(resolve, 800))

    const newPO: PurchaseOrder = {
      id: `po-${Date.now()}`,
      tenantId: "tenant-1",
      poNumber: `PO-2026-${String(Math.floor(Math.random() * 9999)).padStart(4, "0")}`,
      supplierId: selectedSupplier.id,
      supplierName: selectedSupplier.name,
      status: "draft",
      items: data.items.map((item) => ({
        id: `poi-${Date.now()}-${item.variantId}`,
        purchaseOrderId: "",
        variantId: item.variantId,
        productName: item.productName,
        variantSku: item.sku,
        quantity: item.quantity,
        receivedQuantity: 0,
        unitPrice: item.unitPrice,
        expectedPrice: item.unitPrice,
        priceVariance: 0,
      })),
      totalAmount,
      expectedDeliveryDate: data.expectedDeliveryDate || undefined,
      notes: data.notes || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    console.log("[v0] PO created:", newPO)
    onSuccess(newPO)
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
          <DialogTitle>Create Purchase Order</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Supplier Selection */}
          <div className="space-y-2">
            <Label>Supplier</Label>
            <Controller
              control={control}
              name="supplierId"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(v) => {
                    field.onChange(v)
                    // Clear items when supplier changes
                    items.forEach((_, index) => removeItem(0))
                  }}
                >
                  <SelectTrigger className={errors.supplierId ? "border-destructive" : ""}>
                    <SelectValue placeholder="Select a supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {MOCK_SUPPLIERS.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.supplierId && (
              <p className="text-sm text-destructive">{errors.supplierId.message}</p>
            )}
          </div>

          {/* Expected Delivery Date */}
          <div className="space-y-2">
            <Label>Expected Delivery Date</Label>
            <Input
              type="date"
              {...register("expectedDeliveryDate")}
            />
          </div>

          {/* Product Search (only if supplier selected) */}
          {selectedSupplier && (
            <div className="space-y-3">
              <Label>Add Products</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setValue("search", e.target.value)}
                  placeholder="Search supplier products..."
                  className="pl-9"
                />
              </div>

              {search && (
                <div className="max-h-48 overflow-y-auto rounded-lg border border-border">
                  {filteredProducts.length === 0 ? (
                    <p className="p-4 text-center text-sm text-muted-foreground">No products found</p>
                  ) : (
                    filteredProducts.map((product) => (
                      <div
                        key={product.variantId}
                        className="flex items-center justify-between p-3 hover:bg-secondary/50 cursor-pointer"
                        onClick={() => addItem(product)}
                      >
                        <div>
                          <p className="font-medium text-card-foreground">{product.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {product.sku} • Lead time: {product.leadTimeDays} days
                          </p>
                        </div>
                        <Badge variant="outline" className="font-mono">
                          ${product.price.toFixed(2)}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {/* Selected Items */}
          {itemFields.length > 0 && (
            <div className="space-y-3">
              <Label>Order Items</Label>
              <div className="rounded-lg border border-border divide-y divide-border">
                {itemFields.map((field, index) => (
                  <div key={field.id} className="flex items-center justify-between p-3">
                    <div className="flex-1">
                      <p className="font-medium text-card-foreground">{items[index].productName}</p>
                      <p className="text-sm text-muted-foreground">{items[index].sku}</p>
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
                                if (items[index].quantity > 1) {
                                  updateItem(index, { ...items[index], quantity: items[index].quantity - 1 })
                                } else {
                                  removeItem(index)
                                }
                              }}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-8 text-center font-medium">{items[index].quantity}</span>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 bg-transparent"
                              onClick={() => updateItem(index, { ...items[index], quantity: items[index].quantity + 1 })}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      />

                      <p className="w-24 text-right font-medium">
                        ${(items[index].unitPrice * items[index].quantity).toFixed(2)}
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
                ))}

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
            <Label>Notes (Optional)</Label>
            <Textarea
              {...register("notes")}
              placeholder="Purchase order notes..."
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!supplierId || itemFields.length === 0 || isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Purchase Order"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

