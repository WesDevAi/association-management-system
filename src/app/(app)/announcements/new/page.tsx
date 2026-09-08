import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requirePermission } from "@/server/permissions/guards";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { CreateAnnouncementForm } from "../create-announcement-form";

export default async function NewAnnouncementPage() {
  await requirePermission(PERMISSIONS.ANNOUNCEMENTS_MANAGE);

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/announcements"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="size-4" />
        Back to announcements
      </Link>

      <CreateAnnouncementForm />
    </div>
  );
}
