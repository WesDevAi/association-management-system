import { MobileNav } from "./mobile-nav";
import { UserMenu } from "./user-menu";
import { AssociationSwitcher, type AssociationOption } from "./association-switcher";
import type { NavSection } from "./nav-config";

export function AppHeader({
  sections,
  associationName,
  associations,
  activeAssociationId,
  userName,
  userEmail,
}: {
  sections: NavSection[];
  associationName: string;
  associations: AssociationOption[];
  activeAssociationId: string;
  userName: string;
  userEmail: string;
}) {
  return (
    <header className="flex h-14 items-center justify-between gap-4 border-b border-border bg-background px-4">
      <div className="flex items-center gap-2">
        <MobileNav sections={sections} associationName={associationName} />
        <div className="hidden md:block">
          <AssociationSwitcher associations={associations} activeAssociationId={activeAssociationId} />
        </div>
      </div>
      <UserMenu name={userName} email={userEmail} />
    </header>
  );
}
