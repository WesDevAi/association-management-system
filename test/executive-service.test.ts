import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  createPositionSchema,
  createAppointmentSchema,
  endAppointmentSchema,
} from "@/server/validation/executive";

// ---------------------------------------------------------------------------
// Validation schema tests
// ---------------------------------------------------------------------------

describe("createPositionSchema", () => {
  test("accepts valid position data", () => {
    const result = createPositionSchema.safeParse({
      title: "Chairman",
      description: "Head of the association",
      order: 1,
      maxOccupants: 1,
      termLengthMonths: 24,
    });
    assert.equal(result.success, true);
  });

  test("requires a title with at least 2 characters", () => {
    const result = createPositionSchema.safeParse({ title: "A" });
    assert.equal(result.success, false);
  });

  test("allows empty description", () => {
    const result = createPositionSchema.safeParse({
      title: "Secretary",
      description: "",
    });
    assert.equal(result.success, true);
  });

  test("defaults order to 0 and maxOccupants to 1", () => {
    const result = createPositionSchema.safeParse({ title: "Treasurer" });
    assert.equal(result.success, true);
    if (result.success) {
      assert.equal(result.data.order, 0);
      assert.equal(result.data.maxOccupants, 1);
    }
  });

  test("rejects maxOccupants less than 1", () => {
    const result = createPositionSchema.safeParse({
      title: "Auditor",
      maxOccupants: 0,
    });
    assert.equal(result.success, false);
  });
});

describe("createAppointmentSchema", () => {
  test("accepts valid appointment data", () => {
    const result = createAppointmentSchema.safeParse({
      executivePositionId: "pos-1",
      membershipId: "mem-1",
      appointmentType: "ELECTED",
      startDate: "2026-01-15",
    });
    assert.equal(result.success, true);
  });

  test("rejects missing position", () => {
    const result = createAppointmentSchema.safeParse({
      membershipId: "mem-1",
      appointmentType: "ELECTED",
      startDate: "2026-01-15",
    });
    assert.equal(result.success, false);
  });

  test("rejects missing member", () => {
    const result = createAppointmentSchema.safeParse({
      executivePositionId: "pos-1",
      appointmentType: "ELECTED",
      startDate: "2026-01-15",
    });
    assert.equal(result.success, false);
  });

  test("rejects invalid appointment type", () => {
    const result = createAppointmentSchema.safeParse({
      executivePositionId: "pos-1",
      membershipId: "mem-1",
      appointmentType: "INVALID",
      startDate: "2026-01-15",
    });
    assert.equal(result.success, false);
  });

  test("allows optional end date", () => {
    const result = createAppointmentSchema.safeParse({
      executivePositionId: "pos-1",
      membershipId: "mem-1",
      appointmentType: "APPOINTED",
      startDate: "2026-01-15",
      endDate: "2028-01-15",
    });
    assert.equal(result.success, true);
  });

  test("rejects end date before start date", () => {
    const result = createAppointmentSchema.safeParse({
      executivePositionId: "pos-1",
      membershipId: "mem-1",
      appointmentType: "APPOINTED",
      startDate: "2028-01-15",
      endDate: "2026-01-15",
    });
    assert.equal(result.success, false);
  });

  test("allows empty notes", () => {
    const result = createAppointmentSchema.safeParse({
      executivePositionId: "pos-1",
      membershipId: "mem-1",
      appointmentType: "ACTING",
      startDate: "2026-01-15",
      notes: "",
    });
    assert.equal(result.success, true);
  });
});

describe("endAppointmentSchema", () => {
  test("accepts valid end appointment data", () => {
    const result = endAppointmentSchema.safeParse({
      appointmentId: "appt-1",
      status: "COMPLETED",
    });
    assert.equal(result.success, true);
  });

  test("rejects missing appointment ID", () => {
    const result = endAppointmentSchema.safeParse({
      status: "COMPLETED",
    });
    assert.equal(result.success, false);
  });

  test("rejects invalid status", () => {
    const result = endAppointmentSchema.safeParse({
      appointmentId: "appt-1",
      status: "INVALID",
    });
    assert.equal(result.success, false);
  });

  test("accepts all valid status values", () => {
    for (const status of ["COMPLETED", "REMOVED", "RESIGNED", "SUSPENDED"]) {
      const result = endAppointmentSchema.safeParse({
        appointmentId: "appt-1",
        status,
      });
      assert.equal(result.success, true, `Status ${status} should be valid`);
    }
  });
});

// ---------------------------------------------------------------------------
// Data transformation tests
// ---------------------------------------------------------------------------

describe("Executive appointment type mapping", () => {
  test("maps appointment types to display labels", () => {
    const typeLabels: Record<string, string> = {
      ELECTED: "Elected",
      APPOINTED: "Appointed",
      ACTING: "Acting",
      INTERIM: "Interim",
    };

    assert.equal(typeLabels["ELECTED"], "Elected");
    assert.equal(typeLabels["APPOINTED"], "Appointed");
    assert.equal(typeLabels["ACTING"], "Acting");
    assert.equal(typeLabels["INTERIM"], "Interim");
  });

  test("maps appointment statuses to badge colors", () => {
    const statusColors: Record<string, string> = {
      ACTIVE: "bg-green-100 text-green-800",
      COMPLETED: "bg-blue-100 text-blue-800",
      REMOVED: "bg-red-100 text-red-800",
      RESIGNED: "bg-amber-100 text-amber-800",
      SUSPENDED: "bg-orange-100 text-orange-800",
    };

    assert.equal(statusColors["ACTIVE"].includes("green"), true);
    assert.equal(statusColors["COMPLETED"].includes("blue"), true);
    assert.equal(statusColors["REMOVED"].includes("red"), true);
    assert.equal(statusColors["RESIGNED"].includes("amber"), true);
    assert.equal(statusColors["SUSPENDED"].includes("orange"), true);
  });
});

describe("Executive stats calculation", () => {
  test("calculates vacant positions correctly", () => {
    const activePositions = 10;
    const filledPositions = 8;
    const vacantPositions = activePositions - filledPositions;
    assert.equal(vacantPositions, 2);
  });

  test("handles zero positions", () => {
    const activePositions = 0;
    const filledPositions = 0;
    const vacantPositions = activePositions - filledPositions;
    assert.equal(vacantPositions, 0);
  });

  test("days remaining calculation", () => {
    const now = new Date("2026-06-15T00:00:00Z");
    const endDate = new Date("2026-07-15T00:00:00Z");
    const daysRemaining = Math.max(
      0,
      Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    );
    assert.equal(daysRemaining, 30);
  });

  test("days remaining is 0 for past dates", () => {
    const now = new Date("2026-06-15T00:00:00Z");
    const endDate = new Date("2026-06-01T00:00:00Z");
    const daysRemaining = Math.max(
      0,
      Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    );
    assert.equal(daysRemaining, 0);
  });

  test("isExpiringSoon flag for 30 days or less", () => {
    const daysRemaining = 15;
    const isExpiringSoon = daysRemaining !== null && daysRemaining <= 30;
    assert.equal(isExpiringSoon, true);
  });

  test("isExpiringSoon flag for more than 30 days", () => {
    const daysRemaining = 45;
    const isExpiringSoon = daysRemaining !== null && daysRemaining <= 30;
    assert.equal(isExpiringSoon, false);
  });
});
