"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Plus, Search, Filter, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import { ProductTable } from "./product-table";
import { ProductFormDialog } from "./product-form-dialog";
import { StockMovementSheet } from "./stock-movement-sheet";
import { StockAdjustmentDialog } from "./stock-adjustment-dialog";
import type { Product, ProductVariant } from "@/types";
import { productsApi } from "@/services/api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

type SortField = "name" | "stock" | "updatedAt";
type FilterOption = "all" | "low-stock" | "in-stock" | "out-of-stock";

export function InventoryContent() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [filter, setFilter] = useState<FilterOption>("all");

  // Dialogs/sheets
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [movementVariant, setMovementVariant] = useState<ProductVariant | null>(
    null,
  );
  const [adjustmentVariant, setAdjustmentVariant] =
    useState<ProductVariant | null>(null);
  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const response = await productsApi.getAll();
      console.log(response, "<-----RESP");
      setProducts(response.data?.products || []);
    } catch {
      setError("Failed to load inventory");
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    fetchProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    let result = [...products];
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(searchLower) ||
          p.sku.toLowerCase().includes(searchLower)
      );
    }
    if (filter === "low-stock") {
      result = result.filter((p) =>
        p.variants.some((v) => v.stock <= v.low_threshold && v.stock > 0),
      );
    } else if (filter === "in-stock") {
      result = result.filter((p) => p.variants.some((v) => v.stock > 0));
    } else if (filter === "out-of-stock") {
      result = result.filter((p) => p.variants.every((v) => v.stock === 0));
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "stock":
          const aTotal = a.variants.reduce((sum, v) => sum + v.stock, 0);
          const bTotal = b.variants.reduce((sum, v) => sum + v.stock, 0);
          comparison = aTotal - bTotal;
          break;
        case "updatedAt":
          comparison =
            new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
          break;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });

    return result;
  }, [products, search, filter, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleEditProduct = useCallback((product: Product) => {
    setEditingProduct(product);
    setShowProductForm(true);
  }, []);

  const handleViewMovements = useCallback((variant: ProductVariant) => {
    setMovementVariant(variant);
  }, []);

  const handleAdjustStock = useCallback((variant: ProductVariant) => {
    setAdjustmentVariant(variant);
  }, []);

  const handleStockAdjusted = useCallback(() => {
    fetchProducts();
    setAdjustmentVariant(null);
  }, []);

  if (isLoading) {
    return <LoadingState message="Loading inventory..." />;
  }

  if (error) {
    return (
      <ErrorState message={error} onRetry={() => window.location.reload()} />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
                <span className="sr-only">Filter</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Filter by stock</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setFilter("all")}>
                All Products
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilter("low-stock")}>
                Low Stock
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilter("in-stock")}>
                In Stock
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilter("out-of-stock")}>
                Out of Stock
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Sort */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <ArrowUpDown className="h-4 w-4" />
                <span className="sr-only">Sort</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Sort by</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleSort("name")}>
                Name
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSort("stock")}>
                Total Stock
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSort("updatedAt")}>
                Last Updated
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Button onClick={() => setShowProductForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Product
        </Button>
      </div>

      {/* Product Table */}
      <ProductTable
        products={filteredProducts}
        onEdit={handleEditProduct}
        onViewMovements={handleViewMovements}
        onAdjustStock={handleAdjustStock}
      />

      {/* Product Form Dialog */}
      <ProductFormDialog
        open={showProductForm}
        onOpenChange={(open) => {
          setShowProductForm(open);
          if (!open) setEditingProduct(null);
        }}
        product={editingProduct}
      />

      {/* Stock Movement Sheet */}
      <StockMovementSheet
        variant={movementVariant}
        onClose={() => setMovementVariant(null)}
      />

      {/* Stock Adjustment Dialog */}
      <StockAdjustmentDialog
        variant={adjustmentVariant}
        onClose={() => setAdjustmentVariant(null)}
        onSuccess={handleStockAdjusted}
      />
    </div>
  );
}
