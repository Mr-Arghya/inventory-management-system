import { AppShell } from "@/components/layout/app-shell"
import { SuppliersContent } from "@/components/suppliers/suppliers-content"
import { RoleGuard } from "@/components/guards/role-guard"

export default function SuppliersPage() {
  return (
    <AppShell title="Suppliers">
      <RoleGuard allowedRoles={["owner", "manager"]}>
        <SuppliersContent />
      </RoleGuard>
    </AppShell>
  )
}
