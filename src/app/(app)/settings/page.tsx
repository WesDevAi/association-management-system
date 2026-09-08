import { requirePermission } from "@/server/permissions/guards";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { getAssociationSettings } from "@/server/services/association-settings-service";
import { EditSettingsForm } from "./edit-settings-form";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { GitBranch } from "lucide-react";

const ASSOCIATION_TYPES = [
  { value: "CLUB", label: "Club" },
  { value: "UNION", label: "Union" },
  { value: "PROFESSIONAL_BODY", label: "Professional Body" },
  { value: "ALUMNI", label: "Alumni" },
  { value: "COMMUNITY", label: "Community" },
  { value: "COOPERATIVE", label: "Cooperative" },
  { value: "RELIGIOUS", label: "Religious" },
  { value: "OTHER", label: "Other" },
];

export default async function SettingsPage() {
  const context = await requirePermission(PERMISSIONS.ASSOCIATION_SETTINGS_MANAGE);
  const associationId = context.membership.associationId;

  const settings = await getAssociationSettings(associationId);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Manage your association details and configuration.
          </p>
        </div>
        <Link href="/settings/branches">
          <Button variant="outline">
            <GitBranch className="mr-1.5 size-4" />
            Branch Management
          </Button>
        </Link>
      </div>

      {settings && (
        <EditSettingsForm settings={settings} associationTypes={ASSOCIATION_TYPES} />
      )}
    </div>
  );
}
