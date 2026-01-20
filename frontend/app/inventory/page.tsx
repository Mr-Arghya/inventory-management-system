import { AppShell } from "@/components/layout/app-shell"
import { InventoryContent } from "@/components/inventory/inventory-content"
import { RoleGuard } from "@/components/guards/role-guard"

export default function InventoryPage() {
  return (
    <AppShell title="Inventory">
      <RoleGuard allowedRoles={["owner", "manager"]}>
        <InventoryContent />
      </RoleGuard>
    </AppShell>
  )
}
