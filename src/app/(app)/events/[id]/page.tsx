import { notFound } from "next/navigation";
import Link from "next/link";
import { requirePermission } from "@/server/permissions/guards";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { getEvent } from "@/server/services/event-service";
import { getMembers } from "@/server/services/member-service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, MapPin, Clock, Users, Globe, Pencil } from "lucide-react";
import { format } from "date-fns";
import { EventDetailClient } from "./event-detail-client";

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100",
  PUBLISHED: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
  CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
  COMPLETED: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
};

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const context = await requirePermission(PERMISSIONS.EVENTS_MANAGE);
  const associationId = context.membership.associationId;

  const [event, { members }] = await Promise.all([
    getEvent(associationId, id),
    getMembers(associationId),
  ]);

  if (!event) {
    notFound();
  }

  const registered = event.registrations.filter((r) => r.status === "REGISTERED");
  const waitlisted = event.registrations.filter((r) => r.status === "WAITLISTED");
  const attended = event.registrations.filter((r) => r.status === "ATTENDED");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Link href="/events">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">{event.title}</h1>
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[event.status] ?? ""}`}
            >
              {event.status.charAt(0) + event.status.slice(1).toLowerCase()}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Event details and registration management.
          </p>
        </div>
        <Link href={`/events/${event.id}/edit`}>
          <Button variant="outline" size="sm">
            <Pencil className="mr-1.5 size-4" />
            Edit
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Event Information</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <dt className="text-xs font-medium text-muted-foreground">Description</dt>
                  <dd className="mt-1 text-sm whitespace-pre-wrap">
                    {event.description ?? "No description provided."}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <Clock className="size-3" /> Start
                  </dt>
                  <dd className="mt-1 text-sm">{format(event.startAt, "MMMM d, yyyy 'at' h:mm a")}</dd>
                </div>
                {event.endAt && (
                  <div>
                    <dt className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                      <Clock className="size-3" /> End
                    </dt>
                    <dd className="mt-1 text-sm">{format(event.endAt, "MMMM d, yyyy 'at' h:mm a")}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <MapPin className="size-3" /> Location
                  </dt>
                  <dd className="mt-1 text-sm">{event.location ?? (event.isVirtual ? "Online" : "TBD")}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <Users className="size-3" /> Capacity
                  </dt>
                  <dd className="mt-1 text-sm">
                    {event.capacity ? `${event.registeredCount} / ${event.capacity}` : "Unlimited"}
                  </dd>
                </div>
                {event.isVirtual && event.virtualLink && (
                  <div className="sm:col-span-2">
                    <dt className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                      <Globe className="size-3" /> Virtual Link
                    </dt>
                    <dd className="mt-1">
                      <a
                        href={event.virtualLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        {event.virtualLink}
                      </a>
                    </dd>
                  </div>
                )}
                {event.branchName && (
                  <div>
                    <dt className="text-xs font-medium text-muted-foreground">Branch</dt>
                    <dd className="mt-1 text-sm">{event.branchName}</dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Registrations ({event.registrations.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {event.registrations.length === 0 ? (
                <p className="text-sm text-muted-foreground">No registrations yet.</p>
              ) : (
                <div className="rounded-md border border-border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="px-4 py-3 text-left font-medium">Member</th>
                        <th className="px-4 py-3 text-left font-medium">Status</th>
                        <th className="px-4 py-3 text-left font-medium">Registered</th>
                      </tr>
                    </thead>
                    <tbody>
                      {event.registrations.map((r) => (
                        <tr key={r.id} className="border-b border-border/50 last:border-0">
                          <td className="px-4 py-3">
                            <div className="font-medium">{r.memberName}</div>
                            <div className="text-xs text-muted-foreground">{r.membershipNumber}</div>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                r.status === "REGISTERED"
                                  ? "bg-green-100 text-green-800"
                                  : r.status === "WAITLISTED"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : r.status === "ATTENDED"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {r.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {format(r.registeredAt, "MMM d, yyyy")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <EventDetailClient
                event={event}
                members={members}
                registered={registered}
                waitlisted={waitlisted}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="flex flex-col gap-3 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Registered</dt>
                  <dd className="font-medium">{registered.length}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Waitlisted</dt>
                  <dd className="font-medium">{waitlisted.length}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Attended</dt>
                  <dd className="font-medium">{attended.length}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Created by</dt>
                  <dd className="font-medium">{event.createdByName ?? "—"}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
