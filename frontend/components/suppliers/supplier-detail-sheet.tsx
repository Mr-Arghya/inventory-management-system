"use client"

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Mail, Phone, MapPin } from "lucide-react"
import type { Supplier } from "@/types"

interface SupplierDetailSheetProps {
  supplier: Supplier | null
  onClose: () => void
}

// Mock product names for display
const PRODUCT_NAMES: Record<string, string> = {
  v1: "Classic T-Shirt (Black, S)",
  v2: "Classic T-Shirt (Black, M)",
  v3: "Classic T-Shirt (Black, L)",
  v4: "Classic T-Shirt (White, S)",
  v5: "Classic T-Shirt (White, M)",
  v6: "Running Shoes (Black, 40)",
  v7: "Running Shoes (Black, 42)",
  v8: "Running Shoes (White, 42)",
  v9: "Wireless Headphones (Black)",
  v10: "Wireless Headphones (White)",
  v11: "Premium Hoodie (Gray, M)",
  v12: "Premium Hoodie (Gray, L)",
  v13: "Premium Hoodie (Navy, M)",
}

export function SupplierDetailSheet({ supplier, onClose }: SupplierDetailSheetProps) {
  if (!supplier) return null

  return (
    <Sheet open={!!supplier} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{supplier.name}</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Contact Info */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">Contact Information</h3>
            <div className="rounded-lg border border-border divide-y divide-border">
              {supplier.email && (
                <div className="flex items-center gap-3 p-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-card-foreground">{supplier.email}</span>
                </div>
              )}
              {supplier.phone && (
                <div className="flex items-center gap-3 p-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-card-foreground">{supplier.phone}</span>
                </div>
              )}
              {supplier.address && (
                <div className="flex items-start gap-3 p-3">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <span className="text-card-foreground">{supplier.address}</span>
                </div>
              )}
            </div>
          </div>

          {/* Product Pricing */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">
              Product Pricing ({supplier.products.length} products)
            </h3>
            <div className="rounded-lg border border-border divide-y divide-border max-h-80 overflow-y-auto">
              {supplier.products.map((product) => (
                <div key={product.variantId} className="flex items-center justify-between p-3">
                  <div>
                    <p className="text-sm font-medium text-card-foreground">
                      {PRODUCT_NAMES[product.variantId] || product.variantId}
                    </p>
                    <p className="text-xs text-muted-foreground">Lead time: {product.leadTimeDays} days</p>
                  </div>
                  <Badge variant="outline" className="font-mono">
                    ${product.price.toFixed(2)}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Added Date */}
          <div className="text-xs text-muted-foreground">
            Added:{" "}
            {new Date(supplier.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
