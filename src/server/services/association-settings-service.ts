import "server-only";
import { prisma } from "@/lib/prisma";
import type { UpdateAssociationInput } from "@/server/validation/association-settings";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AssociationSettings = {
  id: string;
  name: string;
  slug: string;
  type: string;
  description: string | null;
  logoUrl: string | null;
  address: string | null;
  state: string | null;
  country: string;
  currency: string;
  contactEmail: string | null;
  contactPhone: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
};

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export async function getAssociationSettings(
  associationId: string
): Promise<AssociationSettings | null> {
  const association = await prisma.association.findUnique({
    where: { id: associationId },
    select: {
      id: true,
      name: true,
      slug: true,
      type: true,
      description: true,
      logoUrl: true,
      address: true,
      state: true,
      country: true,
      currency: true,
      contactEmail: true,
      contactPhone: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!association) return null;

  return {
    id: association.id,
    name: association.name,
    slug: association.slug,
    type: association.type,
    description: association.description,
    logoUrl: association.logoUrl,
    address: association.address,
    state: association.state,
    country: association.country,
    currency: association.currency,
    contactEmail: association.contactEmail,
    contactPhone: association.contactPhone,
    status: association.status,
    createdAt: association.createdAt,
    updatedAt: association.updatedAt,
  };
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export async function updateAssociationSettings(
  associationId: string,
  data: UpdateAssociationInput
): Promise<boolean | { error: string }> {
  const association = await prisma.association.findUnique({
    where: { id: associationId },
    select: { id: true },
  });

  if (!association) return { error: "Association not found." };

  const updateData: Record<string, unknown> = {};

  if (data.name !== undefined) updateData.name = data.name;
  if (data.type !== undefined) updateData.type = data.type;
  if (data.description !== undefined) updateData.description = data.description || null;
  if (data.address !== undefined) updateData.address = data.address || null;
  if (data.state !== undefined) updateData.state = data.state || null;
  if (data.country !== undefined) updateData.country = data.country;
  if (data.contactEmail !== undefined) updateData.contactEmail = data.contactEmail || null;
  if (data.contactPhone !== undefined) updateData.contactPhone = data.contactPhone || null;
  if (data.currency !== undefined) updateData.currency = data.currency;
  if (data.logoUrl !== undefined) updateData.logoUrl = data.logoUrl || null;

  if (Object.keys(updateData).length === 0) {
    return { error: "No fields to update." };
  }

  await prisma.association.update({
    where: { id: associationId },
    data: updateData,
  });

  return true;
}
