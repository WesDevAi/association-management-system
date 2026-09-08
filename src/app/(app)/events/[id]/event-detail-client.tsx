"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  updateEventStatusAction,
  registerForEventAction,
  cancelRegistrationAction,
  checkInAttendeeAction,
} from "@/server/services/event-actions";
import type { EventDetail, EventRegistrationListItem } from "@/server/services/event-service";
import type { MemberListItem } from "@/server/services/member-service";

interface EventDetailClientProps {
  event: EventDetail;
  members: MemberListItem[];
  registered: EventRegistrationListItem[];
  waitlisted: EventRegistrationListItem[];
  attended: EventRegistrationListItem[];
}

export function EventDetailClient({
  event,
  members,
  registered,
  waitlisted,
  attended,
}: EventDetailClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function handleStatusChange(status: string) {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("eventId", event.id);
      formData.set("status", status);
      const result = await updateEventStatusAction(null, formData);
      if (result && "error" in result) {
        setError(result.error);
      } else if (result && "success" in result) {
        setSuccess(result.success);
        router.refresh();
      }
    });
  }

  function handleRegister(memberId: string) {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("eventId", event.id);
      formData.set("membershipId", memberId);
      const result = await registerForEventAction(null, formData);
      if (result && "error" in result) {
        setError(result.error);
      } else if (result && "success" in result) {
        setSuccess(result.success);
        router.refresh();
      }
    });
  }

  function handleCancelRegistration(registrationId: string) {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("registrationId", registrationId);
      const result = await cancelRegistrationAction(null, formData);
      if (result && "error" in result) {
        setError(result.error);
      } else if (result && "success" in result) {
        setSuccess(result.success);
        router.refresh();
      }
    });
  }

  function handleCheckIn(registrationId: string) {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("registrationId", registrationId);
      const result = await checkInAttendeeAction(null, formData);
      if (result && "error" in result) {
        setError(result.error);
      } else if (result && "success" in result) {
        setSuccess(result.success);
        router.refresh();
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label>Status</Label>
        <div className="flex flex-wrap gap-2">
          {event.status !== "PUBLISHED" && (
            <Button
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={() => handleStatusChange("PUBLISHED")}
            >
              Publish
            </Button>
          )}
          {event.status !== "COMPLETED" && (
            <Button
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={() => handleStatusChange("COMPLETED")}
            >
              Complete
            </Button>
          )}
          {event.status !== "CANCELLED" && (
            <Button
              variant="destructive"
              size="sm"
              disabled={isPending}
              onClick={() => handleStatusChange("CANCELLED")}
            >
              Cancel Event
            </Button>
          )}
        </div>
      </div>

      {event.status === "PUBLISHED" && (
        <div className="flex flex-col gap-2">
          <Label>Register Member</Label>
          <select
            id="registerMember"
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
            onChange={(e) => {
              if (e.target.value) {
                handleRegister(e.target.value);
                e.target.value = "";
              }
            }}
          >
            <option value="">Select a member...</option>
            {members
              .filter((m) => !registered.some((r) => r.membershipId === m.id) && !waitlisted.some((w) => w.membershipId === m.id))
              .map((m) => (
                <option key={m.id} value={m.id}>
                  {m.fullName} ({m.membershipNumber})
                </option>
              ))}
          </select>
        </div>
      )}

      {registered.length > 0 && (
        <div className="flex flex-col gap-2">
          <Label>Registered ({registered.length})</Label>
          <div className="flex flex-col gap-1">
            {registered.map((r) => (
              <div key={r.id} className="flex items-center justify-between text-sm">
                <span>{r.memberName}</span>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={isPending}
                    onClick={() => handleCheckIn(r.id)}
                  >
                    Check In
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={isPending}
                    onClick={() => handleCancelRegistration(r.id)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {waitlisted.length > 0 && (
        <div className="flex flex-col gap-2">
          <Label>Waitlisted ({waitlisted.length})</Label>
          <div className="flex flex-col gap-1">
            {waitlisted.map((r) => (
              <div key={r.id} className="flex items-center justify-between text-sm">
                <span>{r.memberName}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={isPending}
                  onClick={() => handleCancelRegistration(r.id)}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

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
