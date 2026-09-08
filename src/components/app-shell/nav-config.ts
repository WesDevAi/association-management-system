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
  Crown,
  Receipt,
  FolderOpen,
  TrendingDown,
  Calendar,
  PieChart,
  FileText,
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
       { label: "Meetings", href: "/meetings", icon: CalendarDays, requiredPermission: PERMISSIONS.MEETINGS_MANAGE, implemented: true },
       { label: "Attendance", href: "/attendance", icon: ClipboardCheck, requiredPermission: PERMISSIONS.ATTENDANCE_RECORD, implemented: true },
    ],
  },
  {
    label: "Leadership",
    items: [
      { label: "Current Executive", href: "/executives", icon: Crown, requiredPermission: PERMISSIONS.EXECUTIVES_MANAGE, implemented: true },
      { label: "Positions", href: "/executives/positions", icon: UserCog, requiredPermission: PERMISSIONS.EXECUTIVES_MANAGE, implemented: true },
      { label: "History", href: "/executives/history", icon: BarChart3, requiredPermission: PERMISSIONS.EXECUTIVES_MANAGE, implemented: true },
    ],
  },
  {
    label: "Finance",
    items: [
      { label: "Overview", href: "/finance", icon: Landmark, requiredPermission: PERMISSIONS.FINANCE_VIEW, implemented: true },
      { label: "Payments", href: "/finance/payments", icon: CreditCard, requiredPermission: PERMISSIONS.PAYMENTS_RECORD, implemented: true },
      { label: "Expenses", href: "/finance/expenses", icon: Receipt, requiredPermission: PERMISSIONS.EXPENSES_VIEW, implemented: true },
      { label: "Expense Categories", href: "/finance/expense-categories", icon: FolderOpen, requiredPermission: PERMISSIONS.EXPENSES_VIEW, implemented: true },
      { label: "Balances", href: "/finance/balances", icon: Wallet, requiredPermission: PERMISSIONS.FINANCE_VIEW, implemented: true },
      { label: "Fines", href: "/finance/fines", icon: Gavel, requiredPermission: PERMISSIONS.FINES_MANAGE, implemented: true },
      { label: "Reports", href: "/finance/reports", icon: BarChart3, requiredPermission: PERMISSIONS.FINANCE_REPORTS_VIEW, implemented: true },
      { label: "Monthly Report", href: "/finance/reports/monthly", icon: Calendar, requiredPermission: PERMISSIONS.FINANCE_REPORTS_VIEW, implemented: true },
      { label: "Quarterly Report", href: "/finance/reports/quarterly", icon: PieChart, requiredPermission: PERMISSIONS.FINANCE_REPORTS_VIEW, implemented: true },
      { label: "Annual Report", href: "/finance/reports/annual", icon: TrendingDown, requiredPermission: PERMISSIONS.FINANCE_REPORTS_VIEW, implemented: true },
    ],
  },
  {
    label: "Engagement",
    items: [
      { label: "Events", href: "/events", icon: PartyPopper, requiredPermission: PERMISSIONS.EVENTS_MANAGE, implemented: true },
      { label: "Announcements", href: "/announcements", icon: Megaphone, requiredPermission: PERMISSIONS.ANNOUNCEMENTS_MANAGE, implemented: true },
    ],
  },
  {
    label: "Documents",
    items: [
      { label: "Documents", href: "/documents", icon: FileText, requiredPermission: PERMISSIONS.DOCUMENTS_VIEW, implemented: true },
    ],
  },
  {
    label: "Administration",
    items: [
      { label: "Users", href: "/users", icon: UserCog, requiredPermission: PERMISSIONS.MEMBERS_MANAGE, implemented: true },
      { label: "Roles & Permissions", href: "/roles-permissions", icon: ShieldCheck, requiredPermission: PERMISSIONS.ROLES_MANAGE, implemented: true },
      { label: "Settings", href: "/settings", icon: Settings, requiredPermission: PERMISSIONS.ASSOCIATION_SETTINGS_MANAGE, implemented: false },
    ],
  },
  {
    label: "Reports",
    items: [
      { label: "Reports", href: "/finance/reports", icon: BarChart3, requiredPermission: PERMISSIONS.FINANCE_REPORTS_VIEW, implemented: true },
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
