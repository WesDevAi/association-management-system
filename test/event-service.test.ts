import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  createEventSchema,
  updateEventSchema,
  eventStatusSchema,
  registerForEventSchema,
  cancelRegistrationSchema,
  checkInAttendeeSchema,
} from "@/server/validation/event";

// ---------------------------------------------------------------------------
// Event validation schemas
// ---------------------------------------------------------------------------

describe("createEventSchema", () => {
  it("accepts valid event data", () => {
    const result = createEventSchema.safeParse({
      title: "Annual General Meeting",
      startAt: "2026-12-01T10:00:00+01:00",
    });
    assert.equal(result.success, true);
  });

  it("requires title with at least 2 characters", () => {
    const result = createEventSchema.safeParse({
      title: "A",
      startAt: "2026-12-01T10:00:00+01:00",
    });
    assert.equal(result.success, false);
  });

  it("requires startAt", () => {
    const result = createEventSchema.safeParse({
      title: "Test Event",
    });
    assert.equal(result.success, false);
  });

  it("validates endAt is after startAt", () => {
    const result = createEventSchema.safeParse({
      title: "Test Event",
      startAt: "2026-12-01T10:00:00+01:00",
      endAt: "2026-12-01T09:00:00+01:00",
    });
    assert.equal(result.success, false);
  });

  it("accepts empty optional fields", () => {
    const result = createEventSchema.safeParse({
      title: "Test Event",
      startAt: "2026-12-01T10:00:00+01:00",
      description: "",
      endAt: "",
      location: "",
      virtualLink: "",
      capacity: "",
      branchId: "",
    });
    assert.equal(result.success, true);
  });

  it("validates capacity is a positive integer", () => {
    const result = createEventSchema.safeParse({
      title: "Test Event",
      startAt: "2026-12-01T10:00:00+01:00",
      capacity: 0,
    });
    assert.equal(result.success, false);
  });

  it("accepts valid capacity", () => {
    const result = createEventSchema.safeParse({
      title: "Test Event",
      startAt: "2026-12-01T10:00:00+01:00",
      capacity: 50,
    });
    assert.equal(result.success, true);
  });

  it("defaults isVirtual to false", () => {
    const result = createEventSchema.safeParse({
      title: "Test Event",
      startAt: "2026-12-01T10:00:00+01:00",
    });
    assert.equal(result.success, true);
    if (result.success) {
      assert.equal(result.data.isVirtual, false);
    }
  });
});

describe("updateEventSchema", () => {
  it("requires eventId", () => {
    const result = updateEventSchema.safeParse({
      title: "Updated Title",
    });
    assert.equal(result.success, false);
  });

  it("accepts partial updates", () => {
    const result = updateEventSchema.safeParse({
      eventId: "event-1",
      title: "Updated Title",
    });
    assert.equal(result.success, true);
  });

  it("accepts all optional fields", () => {
    const result = updateEventSchema.safeParse({
      eventId: "event-1",
      title: "Updated",
      description: "New description",
      startAt: "2026-12-01T10:00:00+01:00",
      endAt: "2026-12-01T12:00:00+01:00",
      location: "New Location",
      isVirtual: true,
      virtualLink: "https://zoom.us/j/123",
      capacity: 100,
    });
    assert.equal(result.success, true);
  });

  it("validates endAt is after startAt when both provided", () => {
    const result = updateEventSchema.safeParse({
      eventId: "event-1",
      startAt: "2026-12-01T10:00:00+01:00",
      endAt: "2026-12-01T09:00:00+01:00",
    });
    assert.equal(result.success, false);
  });
});

describe("eventStatusSchema", () => {
  it("accepts valid status transitions", () => {
    for (const status of ["DRAFT", "PUBLISHED", "CANCELLED", "COMPLETED"]) {
      const result = eventStatusSchema.safeParse({
        eventId: "event-1",
        status,
      });
      assert.equal(result.success, true);
    }
  });

  it("rejects invalid status", () => {
    const result = eventStatusSchema.safeParse({
      eventId: "event-1",
      status: "INVALID",
    });
    assert.equal(result.success, false);
  });

  it("requires eventId", () => {
    const result = eventStatusSchema.safeParse({
      status: "PUBLISHED",
    });
    assert.equal(result.success, false);
  });
});

describe("registerForEventSchema", () => {
  it("accepts valid eventId", () => {
    const result = registerForEventSchema.safeParse({
      eventId: "event-1",
    });
    assert.equal(result.success, true);
  });

  it("requires eventId", () => {
    const result = registerForEventSchema.safeParse({});
    assert.equal(result.success, false);
  });
});

describe("cancelRegistrationSchema", () => {
  it("accepts valid registrationId", () => {
    const result = cancelRegistrationSchema.safeParse({
      registrationId: "reg-1",
    });
    assert.equal(result.success, true);
  });

  it("requires registrationId", () => {
    const result = cancelRegistrationSchema.safeParse({});
    assert.equal(result.success, false);
  });
});

describe("checkInAttendeeSchema", () => {
  it("accepts valid registrationId", () => {
    const result = checkInAttendeeSchema.safeParse({
      registrationId: "reg-1",
    });
    assert.equal(result.success, true);
  });

  it("requires registrationId", () => {
    const result = checkInAttendeeSchema.safeParse({});
    assert.equal(result.success, false);
  });
});
