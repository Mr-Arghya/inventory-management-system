"use client"

import { useState, useEffect, useMemo } from "react"
import { Plus, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { LoadingState } from "@/components/ui/loading-state"
import { ErrorState } from "@/components/ui/error-state"
import { SuppliersTable } from "./suppliers-table"
import { SupplierFormDialog } from "./supplier-form-dialog"
import { SupplierDetailSheet } from "./supplier-detail-sheet"
import type { Supplier } from "@/types"

// Mock suppliers data
const MOCK_SUPPLIERS: Supplier[] = [
  {
    id: "sup-1",
    tenantId: "tenant-1",
    name: "Premium Textiles Co.",
    email: "orders@premiumtextiles.com",
    phone: "+1 (555) 123-4567",
    address: "123 Industrial Blvd, Manufacturing City, MC 12345",
    products: [
      { variantId: "v1", price: 10.5, leadTimeDays: 7 },
      { variantId: "v2", price: 10.5, leadTimeDays: 7 },
      { variantId: "v3", price: 10.5, leadTimeDays: 7 },
      { variantId: "v4", price: 10.5, leadTimeDays: 7 },
      { variantId: "v5", price: 10.5, leadTimeDays: 7 },
      { variantId: "v11", price: 25.0, leadTimeDays: 10 },
      { variantId: "v12", price: 25.0, leadTimeDays: 10 },
      { variantId: "v13", price: 25.0, leadTimeDays: 10 },
    ],
    createdAt: "2025-06-15T10:00:00Z",
  },
  {
    id: "sup-2",
    tenantId: "tenant-1",
    name: "Global Footwear Ltd.",
    email: "supply@globalfootwear.com",
    phone: "+1 (555) 987-6543",
    address: "456 Shoe Lane, Footwear District, FD 67890",
    products: [
      { variantId: "v6", price: 52.0, leadTimeDays: 14 },
      { variantId: "v7", price: 52.0, leadTimeDays: 14 },
      { variantId: "v8", price: 52.0, leadTimeDays: 14 },
    ],
    createdAt: "2025-07-20T14:30:00Z",
  },
  {
    id: "sup-3",
    tenantId: "tenant-1",
    name: "TechSound Electronics",
    email: "wholesale@techsound.com",
    phone: "+1 (555) 456-7890",
    address: "789 Tech Park, Electronics Valley, EV 11223",
    products: [
      { variantId: "v9", price: 78.0, leadTimeDays: 5 },
      { variantId: "v10", price: 78.0, leadTimeDays: 5 },
    ],
    createdAt: "2025-08-10T09:15:00Z",
  },
]

export function SuppliersContent() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // UI state
  const [search, setSearch] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        setIsLoading(true)
        await new Promise((resolve) => setTimeout(resolve, 500))
        setSuppliers(MOCK_SUPPLIERS)
      } catch {
        setError("Failed to load suppliers")
      } finally {
        setIsLoading(false)
      }
    }

    fetchSuppliers()
  }, [])

  const filteredSuppliers = useMemo(() => {
    if (!search) return suppliers
    const searchLower = search.toLowerCase()
    return suppliers.filter(
      (s) =>
        s.name.toLowerCase().includes(searchLower) ||
        s.email?.toLowerCase().includes(searchLower) ||
        s.phone?.includes(search),
    )
  }, [suppliers, search])

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier)
    setShowForm(true)
  }

  if (isLoading) {
    return <LoadingState message="Loading suppliers..." />
  }

  if (error) {
    return <ErrorState message={error} onRetry={() => window.location.reload()} />
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search suppliers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Button onClick={() => setShowForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Supplier
        </Button>
      </div>

      {/* Suppliers Table */}
      <SuppliersTable suppliers={filteredSuppliers} onSelect={setSelectedSupplier} onEdit={handleEdit} />

      {/* Supplier Form Dialog */}
      <SupplierFormDialog
        open={showForm}
        onOpenChange={(open) => {
          setShowForm(open)
          if (!open) setEditingSupplier(null)
        }}
        supplier={editingSupplier}
      />

      {/* Supplier Detail Sheet */}
      <SupplierDetailSheet supplier={selectedSupplier} onClose={() => setSelectedSupplier(null)} />
    </div>
  )
}
