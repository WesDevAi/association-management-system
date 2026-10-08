import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Pin, Clock, Users } from "lucide-react";
import { requirePermission } from "@/server/permissions/guards";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { getAnnouncement } from "@/server/services/announcement-service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnnouncementDetailClient } from "./announcement-detail-client";

const statusLabels: Record<string, string> = {
  DRAFT: "Draft",
  PUBLISHED: "Published",
  ARCHIVED: "Archived",
};

const statusColors: Record<string, string> = {
  DRAFT: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
  PUBLISHED: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
  ARCHIVED: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100",
};

const audienceLabels: Record<string, string> = {
  ALL_MEMBERS: "All Members",
  EXECUTIVES_ONLY: "Executives Only",
  BRANCH_ONLY: "Branch Only",
};

export default async function AnnouncementDetailPage({
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
        href="/announcements"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="size-4" />
        Back to announcements
      </Link>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-col gap-2">
                  <CardTitle className="text-xl">
                    {announcement.isPinned && (
                      <Pin className="mr-1.5 inline size-4 text-amber-500" />
                    )}
                    {announcement.title}
                  </CardTitle>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[announcement.status] ?? ""}`}
                    >
                      {statusLabels[announcement.status]}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {audienceLabels[announcement.audience]}
                    </span>
                    {announcement.branchName && (
                      <span className="text-sm text-muted-foreground">
                        · {announcement.branchName}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none whitespace-pre-wrap">
                {announcement.body}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <AnnouncementDetailClient announcement={announcement} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Details</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="size-4" />
                <span>By {announcement.authorName ?? "Unknown"}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="size-4" />
                <span>
                  Created{" "}
                  {new Date(announcement.createdAt).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
              {announcement.publishedAt && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="size-4" />
                  <span>
                    Published{" "}
                    {new Date(announcement.publishedAt).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
              )}
              {announcement.expiresAt && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="size-4" />
                  <span>
                    Expires{" "}
                    {new Date(announcement.expiresAt).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
