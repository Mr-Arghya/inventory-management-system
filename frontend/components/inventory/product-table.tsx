"use client"

import { useState, memo } from "react"
import { ChevronDown, ChevronRight, MoreHorizontal, History, Edit, Package } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { EmptyState } from "@/components/ui/empty-state"
import type { Product, ProductVariant } from "@/types"
import { cn } from "@/lib/utils"

interface ProductTableProps {
  products: Product[]
  onEdit: (product: Product) => void
  onViewMovements: (variant: ProductVariant) => void
  onAdjustStock: (variant: ProductVariant) => void
}

const ProductRow = memo(function ProductRow({
  product,
  onEdit,
  onViewMovements,
  onAdjustStock,
}: {
  product: Product
  onEdit: (product: Product) => void
  onViewMovements: (variant: ProductVariant) => void
  onAdjustStock: (variant: ProductVariant) => void
}) {
  const [expanded, setExpanded] = useState(false)

  const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0)
  const hasLowStock = product.variants.some((v) => v.stock <= v.low_threshold && v.stock > 0)
  const hasOutOfStock = product.variants.some((v) => v.stock === 0)

  return (
    <>
      <TableRow className="group">
        <TableCell>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setExpanded(!expanded)}>
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            <span className="sr-only">{expanded ? "Collapse" : "Expand"}</span>
          </Button>
        </TableCell>
        <TableCell className="font-medium">{product.name}</TableCell>
        <TableCell className="text-muted-foreground">{product.sku}</TableCell>
        <TableCell>{product.category || "-"}</TableCell>
        <TableCell>{product.variants.length}</TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <span className={cn(hasOutOfStock && "text-destructive", hasLowStock && !hasOutOfStock && "text-warning")}>
              {totalStock}
            </span>
            {hasOutOfStock && (
              <Badge variant="destructive" className="text-xs">
                Out of Stock
              </Badge>
            )}
            {hasLowStock && !hasOutOfStock && <Badge className="bg-warning text-warning-foreground text-xs">Low</Badge>}
          </div>
        </TableCell>
        <TableCell>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(product)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Product
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>

      {/* Expanded Variant Rows */}
      {expanded &&
        product.variants.map((variant) => (
          <VariantRow
            key={variant._id}
            variant={{...variant, product_id: product._id}}
            onViewMovements={onViewMovements}
            onAdjustStock={onAdjustStock}
          />
        ))}
    </>
  )
})

const VariantRow = memo(function VariantRow({
  variant,
  onViewMovements,
  onAdjustStock,
}: {
  variant: ProductVariant
  onViewMovements: (variant: ProductVariant) => void
  onAdjustStock: (variant: ProductVariant) => void
}) {
  const isLowStock = variant.stock <= variant.low_threshold && variant.stock > 0
  const isOutOfStock = variant.stock === 0
  const hasPendingPO = variant.pendingPurchaseOrderQuantity > 0

  return (
    <TableRow className="group bg-secondary/30">
      <TableCell />
      <TableCell className="pl-10">
        <div className="flex items-center gap-2">
          {Object.keys(variant.attributes).map((key) => (
            <Badge key={key} variant="outline" className="text-xs text-card-foreground capitalize">
              {key} : {variant.attributes[key]}
            </Badge>
          ))}
        </div>
      </TableCell>
      <TableCell className="text-muted-foreground">{variant.attributes?.size} - {variant.attributes?.color}</TableCell>
      <TableCell>${variant.price.toFixed(2)}</TableCell>
      <TableCell>${variant.cost.toFixed(2)}</TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "font-medium",
              isOutOfStock && "text-destructive",
              isLowStock && !isOutOfStock && "text-warning",
            )}
          >
            {variant.stock}
          </span>
          {hasPendingPO && (
            <span className="text-xs text-chart-1" title="Pending from Purchase Order">
              (+{variant.pendingPurchaseOrderQuantity})
            </span>
          )}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => onViewMovements(variant)}
            title="View stock movements"
          >
            <History className="h-4 w-4" />
            <span className="sr-only">View movements</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => onAdjustStock(variant)}
            title="Adjust stock"
          >
            <Package className="h-4 w-4" />
            <span className="sr-only">Adjust stock</span>
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
})

export function ProductTable({ products, onEdit, onViewMovements, onAdjustStock }: ProductTableProps) {
  if (products.length === 0) {
    return (
      <EmptyState
        title="No products found"
        description="Add your first product to get started with inventory management."
      />
    )
  }

  return (
    <div className="rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10" />
            <TableHead>Product</TableHead>
            <TableHead>SKU</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Variants</TableHead>
            <TableHead>Total Stock</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <ProductRow
              key={product._id}
              product={product}
              onEdit={onEdit}
              onViewMovements={onViewMovements}
              onAdjustStock={onAdjustStock}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
