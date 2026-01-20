"use client"

import { memo } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { Truck, MoreHorizontal, Edit, Eye } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import type { Supplier } from "@/types"

interface SuppliersTableProps {
  suppliers: Supplier[]
  onSelect: (supplier: Supplier) => void
  onEdit: (supplier: Supplier) => void
}

const SupplierRow = memo(function SupplierRow({
  supplier,
  onSelect,
  onEdit,
}: {
  supplier: Supplier
  onSelect: (supplier: Supplier) => void
  onEdit: (supplier: Supplier) => void
}) {
  return (
    <TableRow className="group">
      <TableCell className="font-medium">{supplier.name}</TableCell>
      <TableCell className="text-muted-foreground">{supplier.email || "—"}</TableCell>
      <TableCell className="text-muted-foreground">{supplier.phone || "—"}</TableCell>
      <TableCell>{supplier.products.length} products</TableCell>
      <TableCell className="text-muted-foreground">
        {new Date(supplier.createdAt).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })}
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
            <DropdownMenuItem onClick={() => onSelect(supplier)}>
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(supplier)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Supplier
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  )
})

export function SuppliersTable({ suppliers, onSelect, onEdit }: SuppliersTableProps) {
  if (suppliers.length === 0) {
    return (
      <EmptyState
        icon={Truck}
        title="No suppliers found"
        description="Add your first supplier to start managing your supply chain."
      />
    )
  }

  return (
    <div className="rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Products</TableHead>
            <TableHead>Added</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {suppliers.map((supplier) => (
            <SupplierRow key={supplier.id} supplier={supplier} onSelect={onSelect} onEdit={onEdit} />
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
