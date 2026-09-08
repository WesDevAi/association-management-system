"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createAnnouncementAction } from "@/server/services/announcement-actions";

export function CreateAnnouncementForm() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createAnnouncementAction(null, formData);
      if (result && "error" in result) {
        setError(result.error);
      } else if (result && "success" in result) {
        router.push("/announcements");
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">New Announcement</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                name="title"
                required
                placeholder="Announcement title"
                minLength={2}
                maxLength={200}
              />
            </div>

            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="body">Body *</Label>
              <textarea
                id="body"
                name="body"
                rows={6}
                required
                placeholder="Write your announcement here..."
                minLength={1}
                maxLength={5000}
                className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="audience">Audience *</Label>
              <select
                id="audience"
                name="audience"
                required
                defaultValue="ALL_MEMBERS"
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="ALL_MEMBERS">All Members</option>
                <option value="EXECUTIVES_ONLY">Executives Only</option>
                <option value="BRANCH_ONLY">Branch Only</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="branchId">Branch ID (for Branch Only)</Label>
              <Input
                id="branchId"
                name="branchId"
                placeholder="Optional branch ID"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="expiresAt">Expiry Date</Label>
              <Input
                id="expiresAt"
                name="expiresAt"
                type="datetime-local"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                name="isPinned"
                id="isPinned"
                className="size-4 rounded border-input"
              />
              <Label htmlFor="isPinned" className="font-normal">
                Pin this announcement
              </Label>
            </div>
          </div>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <div className="flex items-center gap-3">
            <Button type="submit" disabled={isPending}>
              <Send className="mr-1.5 size-4" />
              {isPending ? "Creating..." : "Create Announcement"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/announcements")}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
