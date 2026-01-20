import { TrendingUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { TopSellingProduct } from "@/types"

interface TopProductsWidgetProps {
  products: TopSellingProduct[]
}

export function TopProductsWidget({ products }: TopProductsWidgetProps) {
  const maxSold = Math.max(...products.map((p) => p.totalSold))

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-chart-1" />
          <CardTitle>Top 5 Selling Products</CardTitle>
        </div>
        <p className="text-sm text-muted-foreground">Last 30 days</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {products.map((product, index) => {
            const percentage = (product.totalSold / maxSold) * 100
            return (
              <div key={product.productId} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-xs font-medium text-secondary-foreground">
                      {index + 1}
                    </span>
                    <span className="font-medium text-card-foreground">{product.productName}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-card-foreground">
                      {product.totalSold.toLocaleString()} sold
                    </span>
                    <span className="ml-2 text-muted-foreground">${product.revenue.toLocaleString()}</span>
                  </div>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-secondary">
                  <div className="h-full rounded-full bg-chart-1 transition-all" style={{ width: `${percentage}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
