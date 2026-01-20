"use client"

import type React from "react"

import { useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import type { ProductVariant, MovementType } from "@/types"
import { stockAdjustmentSchema, type StockAdjustmentFormData } from "@/lib/validations"
import { useInventory } from "@/context/inventory-context"
import { useAuth } from "@/context/auth-context"

interface StockAdjustmentDialogProps {
  variant: ProductVariant | null
  onClose: () => void
  onSuccess: (variantId: string,) => void
}

export function StockAdjustmentDialog({ variant, onClose, onSuccess }: StockAdjustmentDialogProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<StockAdjustmentFormData>({
    resolver: zodResolver(stockAdjustmentSchema),
    mode: "onChange",
    defaultValues: {
      type: "adjustment",
      quantity: "",
      notes: "",
    },
  })
  const { adjustStock } = useInventory();
  const {user} = useAuth()

  const type = watch("type")
  const quantity = watch("quantity")

  useEffect(() => {
    if (variant) {
      reset({
        type: "adjustment",
        quantity: "",
        notes: "",
      })
    }
  }, [variant, reset])

  const handleClose = () => {
    reset()
    onClose()
  }

  const onSubmit = async (data: StockAdjustmentFormData) => {
    if (!variant || !user) return
    adjustStock({
      productId: variant.product_id,
      variantId: variant._id,
      adjustmentType: data.type,
      quantity: Number(data.quantity),
      reason: data.notes || ""
    }).then(() => {
      onSuccess(variant._id)
    }).catch(() => {
      
    })
    reset()
  }

  if (!variant) return null

  const qtyNum = Number(quantity) || 0
  const previewChange = type === "sale" ? -Math.abs(qtyNum) : Math.abs(qtyNum)
  const previewStock = Math.max(0, variant.stock + previewChange)

  return (
    <Dialog open={!!variant} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adjust Stock</DialogTitle>
          <DialogDescription>
            {variant.sku} • Current stock: {variant.stock}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-3">
            <Label>Adjustment Type</Label>
            <RadioGroup
              value={type}
              onValueChange={(v) => setValue("type", v as MovementType)}
              className="grid grid-cols-2 gap-3"
            >
              <div>
                <RadioGroupItem value="purchase" id="purchase" className="peer sr-only" />
                <Label
                  htmlFor="purchase"
                  className="flex cursor-pointer items-center justify-center rounded-lg border border-border p-3 text-sm font-medium peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10"
                >
                  Purchase (+)
                </Label>
              </div>
              <div>
                <RadioGroupItem value="sale" id="sale" className="peer sr-only" />
                <Label
                  htmlFor="sale"
                  className="flex cursor-pointer items-center justify-center rounded-lg border border-border p-3 text-sm font-medium peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10"
                >
                  Sale (-)
                </Label>
              </div>
              <div>
                <RadioGroupItem value="return" id="return" className="peer sr-only" />
                <Label
                  htmlFor="return"
                  className="flex cursor-pointer items-center justify-center rounded-lg border border-border p-3 text-sm font-medium peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10"
                >
                  Return (+)
                </Label>
              </div>
              <div>
                <RadioGroupItem value="adjustment" id="adjustment" className="peer sr-only" />
                <Label
                  htmlFor="adjustment"
                  className="flex cursor-pointer items-center justify-center rounded-lg border border-border p-3 text-sm font-medium peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10"
                >
                  Adjustment
                </Label>
              </div>
            </RadioGroup>
            {errors.type && <p className="text-sm text-destructive">{errors.type.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              {...register("quantity")}
              placeholder="Enter quantity"
              className={errors.quantity ? "border-destructive" : ""}
            />
            {errors.quantity && <p className="text-sm text-destructive">{errors.quantity.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              {...register("notes")}
              placeholder="Reason for adjustment..."
              rows={2}
            />
          </div>

          {/* Preview */}
          {quantity && (
            <div className="rounded-lg bg-secondary p-4">
              <p className="text-sm text-muted-foreground">Preview</p>
              <div className="mt-2 flex items-center gap-2 text-lg">
                <span>{variant.stock}</span>
                <span className="text-muted-foreground">→</span>
                <span className={previewChange >= 0 ? "text-chart-1" : "text-chart-4"}>{previewStock}</span>
                <span className="text-sm text-muted-foreground">
                  ({previewChange >= 0 ? "+" : ""}
                  {previewChange})
                </span>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!quantity || isSubmitting}>
              {isSubmitting ? "Saving..." : "Apply Adjustment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

