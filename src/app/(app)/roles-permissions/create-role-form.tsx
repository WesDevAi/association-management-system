"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createRoleAction } from "@/server/services/role-actions";
import type { PermissionCatalogItem } from "@/server/services/role-service";

interface CreateRoleFormProps {
  permissions: PermissionCatalogItem[];
}

export function CreateRoleForm({ permissions }: CreateRoleFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const router = useRouter();

  const grouped = permissions.reduce<Record<string, PermissionCatalogItem[]>>(
    (acc, p) => {
      (acc[p.category] ??= []).push(p);
      return acc;
    },
    {}
  );

  function togglePermission(id: string) {
    setSelectedPermissions((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function toggleCategory(category: string) {
    const catPermIds = permissions
      .filter((p) => p.category === category)
      .map((p) => p.id);
    const allSelected = catPermIds.every((id) => selectedPermissions.includes(id));
    if (allSelected) {
      setSelectedPermissions((prev) => prev.filter((id) => !catPermIds.includes(id)));
    } else {
      setSelectedPermissions((prev) => [
        ...new Set([...prev, ...catPermIds]),
      ]);
    }
  }

  function handleSubmit(formData: FormData) {
    setError(null);
    selectedPermissions.forEach((id) => formData.append("permissionIds", id));
    startTransition(async () => {
      const result = await createRoleAction(null, formData);
      if (result && "error" in result) {
        setError(result.error);
      } else if (result && "success" in result) {
        router.push("/roles-permissions");
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Role Details</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="flex flex-col gap-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                name="name"
                required
                placeholder="e.g. Event Coordinator"
                minLength={2}
                maxLength={100}
              />
              <p className="text-xs text-muted-foreground">
                A stable key will be generated automatically from the name.
              </p>
            </div>

            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                name="description"
                rows={2}
                placeholder="Brief description of this role"
                className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <Label>Permissions *</Label>
              <span className="text-xs text-muted-foreground">
                {selectedPermissions.length} selected
              </span>
            </div>

            <div className="flex flex-col gap-4 rounded-lg border p-4">
              {Object.entries(grouped).map(([category, perms]) => {
                const allSelected = perms.every((p) =>
                  selectedPermissions.includes(p.id)
                );
                const someSelected = perms.some((p) =>
                  selectedPermissions.includes(p.id)
                );

                return (
                  <div key={category} className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        ref={(el) => {
                          if (el) el.indeterminate = someSelected && !allSelected;
                        }}
                        onChange={() => toggleCategory(category)}
                        className="size-4 rounded border-gray-300"
                      />
                      <span className="text-sm font-medium">{category}</span>
                    </div>
                    <div className="ml-6 grid grid-cols-1 gap-1 sm:grid-cols-2">
                      {perms.map((p) => (
                        <label
                          key={p.id}
                          className="flex items-center gap-2 text-sm"
                        >
                          <input
                            type="checkbox"
                            checked={selectedPermissions.includes(p.id)}
                            onChange={() => togglePermission(p.id)}
                            className="size-4 rounded border-gray-300"
                          />
                          <span>{p.key}</span>
                          {p.description && (
                            <span className="text-xs text-muted-foreground">
                              — {p.description}
                            </span>
                          )}
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <div className="flex items-center gap-3">
            <Button type="submit" disabled={isPending}>
              <ShieldPlus className="mr-1.5 size-4" />
              {isPending ? "Creating..." : "Create Role"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/roles-permissions")}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
