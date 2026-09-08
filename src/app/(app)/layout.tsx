import { requireAssociationContext, getUserAssociations } from "@/server/db/tenant";
import { AppShell } from "@/components/app-shell/app-shell";
import { getVisibleNavSections } from "@/components/app-shell/nav-config";
import type { PermissionKey } from "@/lib/constants/permissions";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Single choke point (Phase 2 Section 4.4 / Phase 3.6): every page under
  // this layout gets its tenant + RBAC context resolved exactly once, here.
  // Individual pages/actions still call requirePermission() themselves for
  // the specific capability they need — this layout only establishes "is
  // there a valid association context at all" and what the sidebar should
  // show, it does not substitute for per-action authorization.
  const context = await requireAssociationContext();
  const associations = await getUserAssociations(context.user.id);
  const visibleSections = getVisibleNavSections(context.permissionKeys as PermissionKey[]);

  return (
    <AppShell
      sections={visibleSections}
      associationName={context.membership.association.name}
      associations={associations}
      activeAssociationId={context.membership.associationId}
      userId={context.user.id}
      userName={context.user.name ?? "Member"}
      userEmail={context.user.email ?? ""}
    >
      {children}
    </AppShell>
  );
}
