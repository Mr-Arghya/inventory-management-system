"use client";

import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { LoadingState } from "@/components/ui/loading-state";
import type { ProductVariant, StockMovement } from "@/types";
import { ArrowUp, ArrowDown, RotateCcw, Wrench } from "lucide-react";
import { useInventory } from "@/context/inventory-context";

interface StockMovementSheetProps {
  variant: ProductVariant | null;
  onClose: () => void;
}

const generateMockMovements = (variantId: string): StockMovement[] => [
  {
    _id: "m1",
    variantId,
    type: "purchase",
    quantity: 50,
    previousStock: 15,
    newStock: 65,
    reference: "PO-2024-0045",
    notes: "Restock from main supplier",
    createdAt: "2026-01-09T14:30:00Z",
    createdBy: "Alex Johnson",
  },
  {
    _id: "m2",
    variantId,
    type: "sale",
    quantity: -3,
    previousStock: 65,
    newStock: 62,
    reference: "ORD-2024-1234",
    createdAt: "2026-01-09T10:15:00Z",
    createdBy: "System",
  },
  {
    _id: "m3",
    variantId,
    type: "sale",
    quantity: -5,
    previousStock: 67,
    newStock: 62,
    reference: "ORD-2024-1230",
    createdAt: "2026-01-08T16:45:00Z",
    createdBy: "System",
  },
  {
    _id: "m4",
    variantId,
    type: "return",
    quantity: 2,
    previousStock: 60,
    newStock: 62,
    reference: "RET-2024-0089",
    notes: "Customer return - defective item",
    createdAt: "2026-01-07T11:20:00Z",
    createdBy: "Sarah Miller",
  },
  {
    _id: "m5",
    variantId,
    type: "adjustment",
    quantity: -3,
    previousStock: 63,
    newStock: 60,
    notes: "Inventory count correction",
    createdAt: "2026-01-05T09:00:00Z",
    createdBy: "Alex Johnson",
  },
];

const movementConfig = {
  purchase: {
    icon: ArrowUp,
    color: "text-chart-1",
    bgColor: "bg-chart-1/10",
    label: "Purchase",
  },
  sale: {
    icon: ArrowDown,
    color: "text-chart-2",
    bgColor: "bg-chart-2/10",
    label: "Sale",
  },
  return: {
    icon: RotateCcw,
    color: "text-chart-3",
    bgColor: "bg-chart-3/10",
    label: "Return",
  },
  adjustment: {
    icon: Wrench,
    color: "text-chart-5",
    bgColor: "bg-chart-5/10",
    label: "Adjustment",
  },
};

export function StockMovementSheet({
  variant,
  onClose,
}: StockMovementSheetProps) {
  const [movements, setMovements] = useState<StockMovement[] | []>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { getStockMovements } = useInventory();

  useEffect(() => {
    if (!variant) return;

    const fetchMovements = async () => {
      setIsLoading(true);
      const resp = await getStockMovements(variant._id)
      
      setMovements(resp || []);
      setIsLoading(false);
    };

    fetchMovements();
  }, [variant]);

  return (
    <Sheet open={!!variant} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Stock Movement History</SheetTitle>
          {variant && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{variant.sku}</span>
              <span>•</span>
              <span>Current Stock: {variant.stock}</span>
            </div>
          )}
        </SheetHeader>

        <div className="mt-6">
          {isLoading ? (
            <LoadingState message="Loading history..." />
          ) : (
            <div className="relative space-y-0">
              <div className="absolute left-5 top-2 bottom-2 w-px bg-border" />

              {movements.map((movement) => {
                const config = movementConfig[movement.type];
                const Icon = config.icon;
                const isPositive = movement.quantity > 0;

                return (
                  <div key={movement._id} className="relative flex gap-4 pb-6">
                    {/* Icon */}
                    <div
                      className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${config.bgColor}`}
                    >
                      <Icon className={`h-5 w-5 ${config.color}`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 space-y-1 pt-1">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-xs">
                          {config.label}
                        </Badge>
                        <span
                          className={`text-sm font-semibold ${isPositive ? "text-chart-1" : "text-chart-4"}`}
                        >
                          {isPositive ? "+" : ""}
                          {movement.quantity}
                        </span>
                      </div>

                      <p className="text-sm text-muted-foreground">
                        Stock: {movement.previousStock} → {movement.newStock}
                      </p>

                      {movement.reference && (
                        <p className="text-xs text-muted-foreground">
                          Ref: {movement.reference}
                        </p>
                      )}

                      {movement.notes && (
                        <p className="text-sm text-card-foreground">
                          {movement.notes}
                        </p>
                      )}

                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{movement.createdBy}</span>
                        <span>
                          {new Date(movement.createdAt).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
