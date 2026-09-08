import { AppSidebar } from "./app-sidebar";
import { AppHeader } from "./app-header";
import type { NavSection } from "./nav-config";
import type { AssociationOption } from "./association-switcher";

export function AppShell({
  sections,
  associationName,
  associations,
  activeAssociationId,
  userId,
  userName,
  userEmail,
  children,
}: {
  sections: NavSection[];
  associationName: string;
  associations: AssociationOption[];
  activeAssociationId: string;
  userId: string;
  userName: string;
  userEmail: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar sections={sections} associationName={associationName} className="hidden md:flex" />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader
          sections={sections}
          associationName={associationName}
          associations={associations}
          activeAssociationId={activeAssociationId}
          userId={userId}
          userName={userName}
          userEmail={userEmail}
        />
        <main className="flex-1 overflow-y-auto bg-muted/20 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
