import { AppShell } from "@/components/layout/app-shell"
import { PurchaseOrdersContent } from "@/components/purchase-orders/purchase-orders-content"
import { RoleGuard } from "@/components/guards/role-guard"

export default function PurchaseOrdersPage() {
  return (
    <AppShell title="Purchase Orders">
      <RoleGuard allowedRoles={["owner", "manager"]}>
        <PurchaseOrdersContent />
      </RoleGuard>
    </AppShell>
  )
}
