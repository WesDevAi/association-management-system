import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  ClipboardCheck,
  Wallet,
  CreditCard,
  Gavel,
  Landmark,
  PartyPopper,
  Megaphone,
  UserCog,
  ShieldCheck,
  Settings,
  BarChart3,
} from "lucide-react";
import { PERMISSIONS, type PermissionKey } from "@/lib/constants/permissions";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Omit for items every active membership can see (e.g. Dashboard). */
  requiredPermission?: PermissionKey;
  /**
   * Whether the route actually exists yet. Phase 3 only builds the
   * Dashboard — every other module page is a future phase. Items with
   * `implemented: false` render as disabled ("coming soon") rather than
   * as dead links.
   */
  implemented: boolean;
};

export type NavSection = {
  label: string;
  items: NavItem[];
};

/**
 * Hiding an item here is a UX convenience only — it is NOT the
 * authorization boundary. Every route/action behind these links must
 * independently call requirePermission()/requireRole() server-side
 * (see src/server/permissions/guards.ts) regardless of what this file
 * shows or hides in the sidebar.
 */
export const NAV_SECTIONS: NavSection[] = [
  {
    label: "Overview",
    items: [{ label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, implemented: true }],
  },
  {
    label: "Membership",
    items: [
       { label: "Members", href: "/members", icon: Users, requiredPermission: PERMISSIONS.MEMBERS_VIEW, implemented: true },
    ],
  },
  {
    label: "Operations",
    items: [
      { label: "Meetings", href: "/meetings", icon: CalendarDays, requiredPermission: PERMISSIONS.MEETINGS_MANAGE, implemented: false },
      { label: "Attendance", href: "/attendance", icon: ClipboardCheck, requiredPermission: PERMISSIONS.ATTENDANCE_RECORD, implemented: false },
    ],
  },
  {
    label: "Finance",
    items: [
      { label: "Dues", href: "/dues", icon: Wallet, requiredPermission: PERMISSIONS.FINANCE_VIEW, implemented: false },
      { label: "Payments", href: "/payments", icon: CreditCard, requiredPermission: PERMISSIONS.PAYMENTS_RECORD, implemented: false },
      { label: "Fines", href: "/fines", icon: Gavel, requiredPermission: PERMISSIONS.FINES_MANAGE, implemented: false },
      { label: "Finance", href: "/finance", icon: Landmark, requiredPermission: PERMISSIONS.FINANCE_VIEW, implemented: false },
    ],
  },
  {
    label: "Engagement",
    items: [
      { label: "Events", href: "/events", icon: PartyPopper, requiredPermission: PERMISSIONS.EVENTS_MANAGE, implemented: false },
      { label: "Announcements", href: "/announcements", icon: Megaphone, requiredPermission: PERMISSIONS.ANNOUNCEMENTS_MANAGE, implemented: false },
    ],
  },
  {
    label: "Administration",
    items: [
      { label: "Users", href: "/users", icon: UserCog, requiredPermission: PERMISSIONS.MEMBERS_MANAGE, implemented: false },
      { label: "Roles & Permissions", href: "/roles-permissions", icon: ShieldCheck, requiredPermission: PERMISSIONS.ROLES_MANAGE, implemented: false },
      { label: "Settings", href: "/settings", icon: Settings, requiredPermission: PERMISSIONS.ASSOCIATION_SETTINGS_MANAGE, implemented: false },
    ],
  },
  {
    label: "Reports",
    items: [
      { label: "Reports", href: "/reports", icon: BarChart3, requiredPermission: PERMISSIONS.REPORTS_VIEW, implemented: false },
    ],
  },
];

/** Filters the nav down to what a set of permission keys can see. */
export function getVisibleNavSections(permissionKeys: string[]): NavSection[] {
  const canSee = (item: NavItem) =>
    !item.requiredPermission || permissionKeys.includes(item.requiredPermission);

  return NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter(canSee),
  })).filter((section) => section.items.length > 0);
}
