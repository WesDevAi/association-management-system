import Link from "next/link";
import { requirePermission } from "@/server/permissions/guards";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { getAnnouncements, getAnnouncementStats } from "@/server/services/announcement-service";
import { AnnouncementsTable } from "./announcements-table";
import { StatCard } from "@/components/app-shell/stat-card";
import { Megaphone, Pin, FileEdit } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function AnnouncementsPage({
  searchParams,
}: {
  searchParams?: {
    search?: string;
    status?: string;
    audience?: string;
    sort?: string;
    order?: string;
    page?: string;
  };
}) {
  const context = await requirePermission(PERMISSIONS.ANNOUNCEMENTS_MANAGE);
  const associationId = context.membership.associationId;

  const [result, stats] = await Promise.all([
    getAnnouncements(associationId, {
      search: searchParams?.search,
      status: searchParams?.status,
      audience: searchParams?.audience,
      sort: searchParams?.sort,
      order: searchParams?.order,
      page: searchParams?.page ? parseInt(searchParams.page) : 1,
    }),
    getAnnouncementStats(associationId),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Announcements</h1>
          <p className="text-sm text-muted-foreground">
            Create and manage announcements for your members.
          </p>
        </div>
        <Link href="/announcements/new">
          <Button>New Announcement</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total"
          value={stats.total}
          icon={Megaphone}
          emptyHint={stats.total === 0 ? "No announcements yet" : undefined}
        />
        <StatCard label="Published" value={stats.published} icon={Megaphone} />
        <StatCard label="Drafts" value={stats.draft} icon={FileEdit} />
        <StatCard label="Pinned" value={stats.pinned} icon={Pin} />
      </div>

      <AnnouncementsTable
        announcements={result.announcements}
        total={result.total}
        page={result.page}
        totalPages={result.totalPages}
      />
    </div>
  );
}
