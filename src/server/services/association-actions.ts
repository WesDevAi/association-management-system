"use server";

import { redirect } from "next/navigation";
import { requireAuth } from "@/server/auth/session";
import { createAssociationSchema } from "@/server/validation/association";
import { createAssociationWithAdmin } from "@/server/services/association-service";

export type CreateAssociationActionState = { error: string } | null;

export async function createAssociationAction(
  _prevState: CreateAssociationActionState,
  formData: FormData
): Promise<CreateAssociationActionState> {
  const user = await requireAuth();

  const parsed = createAssociationSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description"),
    contactEmail: formData.get("contactEmail"),
    contactPhone: formData.get("contactPhone"),
    address: formData.get("address"),
    state: formData.get("state"),
    currency: formData.get("currency") || "NGN",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const result = await createAssociationWithAdmin({
    ...parsed.data,
    creatingUserId: user.id,
    creatingUserName: user.name ?? "Admin",
    creatingUserEmail: user.email ?? "",
  });

  if (!result.success) {
    return { error: result.error };
  }

  redirect("/dashboard");
}
