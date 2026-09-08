"use server";

import { updateAssociationSchema } from "@/server/validation/association-settings";
import { updateAssociationSettings } from "@/server/services/association-settings-service";
import { requirePermission } from "@/server/permissions/guards";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { logAudit } from "@/server/services/audit-service";

export type SettingsActionState = { error: string } | { success: string } | null;

export async function updateAssociationSettingsAction(
  _prevState: SettingsActionState,
  formData: FormData
): Promise<SettingsActionState> {
  const context = await requirePermission(PERMISSIONS.ASSOCIATION_SETTINGS_MANAGE);
  const associationId = context.membership.associationId;

  const parsed = updateAssociationSchema.safeParse({
    name: formData.get("name"),
    type: formData.get("type"),
    description: formData.get("description"),
    address: formData.get("address"),
    state: formData.get("state"),
    country: formData.get("country"),
    contactEmail: formData.get("contactEmail"),
    contactPhone: formData.get("contactPhone"),
    currency: formData.get("currency"),
    logoUrl: formData.get("logoUrl"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const result = await updateAssociationSettings(associationId, parsed.data);

  if (typeof result === "object" && "error" in result) {
    return { error: result.error };
  }

  await logAudit({
    associationId,
    userId: context.user.id,
    action: "settings.updated",
    entityType: "association",
  });

  return { success: "Settings updated." };
}
