"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  updateAnnouncementStatusAction,
  toggleAnnouncementPinAction,
  deleteAnnouncementAction,
} from "@/server/services/announcement-actions";
import type { AnnouncementDetail } from "@/server/services/announcement-service";

interface AnnouncementDetailClientProps {
  announcement: AnnouncementDetail;
}

export function AnnouncementDetailClient({
  announcement,
}: AnnouncementDetailClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function handleStatusChange(status: string) {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("announcementId", announcement.id);
      formData.set("status", status);
      const result = await updateAnnouncementStatusAction(null, formData);
      if (result && "error" in result) {
        setError(result.error);
      } else if (result && "success" in result) {
        setSuccess(result.success);
        router.refresh();
      }
    });
  }

  function handleTogglePin() {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("announcementId", announcement.id);
      const result = await toggleAnnouncementPinAction(formData);
      if (result && "error" in result) {
        setError(result.error);
      } else if (result && "success" in result) {
        setSuccess(result.success);
        router.refresh();
      }
    });
  }

  function handleDelete() {
    if (!confirm("Are you sure you want to delete this announcement?")) return;
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("announcementId", announcement.id);
      const result = await deleteAnnouncementAction(formData);
      if (result && "error" in result) {
        setError(result.error);
      } else if (result && "success" in result) {
        router.push("/announcements");
      }
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {announcement.status !== "PUBLISHED" && (
        <Button
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={() => handleStatusChange("PUBLISHED")}
        >
          Publish
        </Button>
      )}
      {announcement.status !== "ARCHIVED" && (
        <Button
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={() => handleStatusChange("ARCHIVED")}
        >
          Archive
        </Button>
      )}
      {announcement.status !== "DRAFT" && (
        <Button
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={() => handleStatusChange("DRAFT")}
        >
          Revert to Draft
        </Button>
      )}
      <Button
        variant="outline"
        size="sm"
        disabled={isPending}
        onClick={handleTogglePin}
      >
        {announcement.isPinned ? "Unpin" : "Pin"}
      </Button>
      <Button
        variant="destructive"
        size="sm"
        disabled={isPending}
        onClick={handleDelete}
      >
        Delete
      </Button>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      {success && (
        <p className="text-sm text-green-600 dark:text-green-400" role="status">
          {success}
        </p>
      )}
    </div>
  );
}
