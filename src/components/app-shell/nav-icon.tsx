"use client";

import {
  BarChart3,
  Bell,
  Calendar,
  CalendarDays,
  ClipboardCheck,
  CreditCard,
  Crown,
  FileText,
  FolderOpen,
  Gavel,
  Landmark,
  LayoutDashboard,
  Megaphone,
  PartyPopper,
  PieChart,
  Receipt,
  ScrollText,
  Settings,
  ShieldCheck,
  TrendingDown,
  UserCog,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import type { NavIconName } from "./nav-config";

const NAV_ICONS: Record<NavIconName, LucideIcon> = {
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
  Bell,
  ScrollText,
};

export function NavIcon({ name, className }: { name: NavIconName; className?: string }) {
  const Icon = NAV_ICONS[name];
  return <Icon aria-hidden="true" className={className} />;
}
