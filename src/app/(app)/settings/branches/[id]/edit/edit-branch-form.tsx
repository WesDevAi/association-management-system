"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateBranchAction } from "@/server/services/branch-actions";
import type { BranchDetail } from "@/server/services/branch-service";

interface EditBranchFormProps {
  branch: BranchDetail;
}

export function EditBranchForm({ branch }: EditBranchFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();

  function handleSubmit(formData: FormData) {
    setError(null);
    setSuccess(null);
    formData.set("branchId", branch.id);
    startTransition(async () => {
      const result = await updateBranchAction(null, formData);
      if (result && "error" in result) {
        setError(result.error);
      } else if (result && "success" in result) {
        setSuccess(result.success);
        router.refresh();
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {branch.name}
          {branch.isHeadquarters && (
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              (Headquarters)
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                name="name"
                defaultValue={branch.name}
                required
                minLength={2}
                maxLength={100}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="code">Code *</Label>
              <Input
                id="code"
                name="code"
                defaultValue={branch.code}
                required
                maxLength={20}
                className="uppercase"
              />
              <p className="text-xs text-muted-foreground">
                Unique code within the association. Auto-capitalized.
              </p>
            </div>

            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                name="address"
                defaultValue={branch.address ?? ""}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                name="state"
                defaultValue={branch.state ?? ""}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="isHeadquarters" className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isHeadquarters"
                  name="isHeadquarters"
                  value="true"
                  defaultChecked={branch.isHeadquarters}
                  className="size-4 rounded border-gray-300"
                />
                Set as Headquarters
              </Label>
              <p className="text-xs text-muted-foreground">
                Only one branch can be headquarters at a time.
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                name="status"
                defaultValue={branch.status}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>

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
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/settings/branches")}
            >
              Back to Branches
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
