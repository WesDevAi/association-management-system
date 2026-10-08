import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requirePermission } from "@/server/permissions/guards";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { getAnnouncement } from "@/server/services/announcement-service";
import { EditAnnouncementForm } from "../../edit-announcement-form";

export default async function EditAnnouncementPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const context = await requirePermission(PERMISSIONS.ANNOUNCEMENTS_MANAGE);
  const associationId = context.membership.associationId;

  const announcement = await getAnnouncement(associationId, resolvedParams.id);

  if (!announcement) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6">
      <Link
        href={`/announcements/${resolvedParams.id}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="size-4" />
        Back to announcement
      </Link>

      <EditAnnouncementForm announcement={announcement} />
    </div>
  );
}
