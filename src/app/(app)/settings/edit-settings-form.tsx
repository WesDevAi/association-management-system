"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateAssociationSettingsAction } from "@/server/services/settings-actions";
import type { AssociationSettings } from "@/server/services/association-settings-service";

interface EditSettingsFormProps {
  settings: AssociationSettings;
  associationTypes: { value: string; label: string }[];
}

const ASSOCIATION_STATUSES: Record<string, string> = {
  TRIAL: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
  ACTIVE: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
  SUSPENDED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
  ARCHIVED: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100",
};

export function EditSettingsForm({ settings, associationTypes }: EditSettingsFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();

  function handleSubmit(formData: FormData) {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await updateAssociationSettingsAction(null, formData);
      if (result && "error" in result) {
        setError(result.error);
      } else if (result && "success" in result) {
        setSuccess(result.success);
        router.refresh();
      }
    });
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="size-4" />
            Association Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                name="name"
                defaultValue={settings.name}
                required
                minLength={2}
                maxLength={150}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="type">Type</Label>
              <select
                id="type"
                name="type"
                defaultValue={settings.type}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {associationTypes.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Slug</Label>
              <Input
                value={settings.slug}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                The slug cannot be changed after creation.
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Status</Label>
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${ASSOCIATION_STATUSES[settings.status] ?? ""}`}
                >
                  {settings.status}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Status is managed by the platform.
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="currency">Currency (ISO 4217)</Label>
              <Input
                id="currency"
                name="currency"
                defaultValue={settings.currency}
                maxLength={3}
                pattern="[A-Z]{3}"
                placeholder="NGN"
              />
            </div>

            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                name="description"
                rows={3}
                defaultValue={settings.description ?? ""}
                placeholder="Brief description of the association"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Contact Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="contactEmail">Contact Email</Label>
              <Input
                id="contactEmail"
                name="contactEmail"
                type="email"
                defaultValue={settings.contactEmail ?? ""}
                placeholder="contact@example.com"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="contactPhone">Contact Phone</Label>
              <Input
                id="contactPhone"
                name="contactPhone"
                defaultValue={settings.contactPhone ?? ""}
                placeholder="+234 xxx xxx xxxx"
              />
            </div>

            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                name="address"
                defaultValue={settings.address ?? ""}
                placeholder="Full address"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                name="state"
                defaultValue={settings.state ?? ""}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                name="country"
                defaultValue={settings.country}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Branding</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="logoUrl">Logo URL</Label>
            <Input
              id="logoUrl"
              name="logoUrl"
              type="url"
              defaultValue={settings.logoUrl ?? ""}
              placeholder="https://example.com/logo.png"
            />
            <p className="text-xs text-muted-foreground">
              Enter a URL to your association logo. File upload integration coming soon.
            </p>
          </div>
          {settings.logoUrl && (
            <div className="mt-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={settings.logoUrl}
                alt="Association logo"
                className="h-16 w-16 rounded-md border object-contain"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      {success && (
        <p className="text-sm text-green-600" role="status">
          {success}
        </p>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isPending}>
          <Save className="mr-1.5 size-4" />
          {isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
