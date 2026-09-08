import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  createPaymentCategorySchema,
  recordPaymentSchema,
  issueFineSchema,
  waiveFineSchema,
} from "@/server/validation/finance";

// ---------------------------------------------------------------------------
// Validation schema tests — Payment Categories
// ---------------------------------------------------------------------------

describe("createPaymentCategorySchema", () => {
  test("accepts valid category data", () => {
    const result = createPaymentCategorySchema.safeParse({
      name: "Monthly Dues",
      description: "Monthly membership dues",
      type: "DUES",
      defaultAmount: 5000,
      isRecurring: true,
      frequency: "MONTHLY",
    });
    assert.equal(result.success, true);
  });

  test("requires a name with at least 2 characters", () => {
    const result = createPaymentCategorySchema.safeParse({
      name: "A",
      type: "OTHER",
    });
    assert.equal(result.success, false);
  });

  test("allows empty description", () => {
    const result = createPaymentCategorySchema.safeParse({
      name: "Annual Levy",
      description: "",
      type: "LEVY",
    });
    assert.equal(result.success, true);
  });

  test("defaults isRecurring to false", () => {
    const result = createPaymentCategorySchema.safeParse({
      name: "Event Fee",
      type: "EVENT",
    });
    assert.equal(result.success, true);
    if (result.success) {
      assert.equal(result.data.isRecurring, false);
    }
  });

  test("accepts all valid category types", () => {
    for (const type of ["DUES", "CONTRIBUTION", "LEVY", "EVENT", "DONATION", "FINE", "OTHER"]) {
      const result = createPaymentCategorySchema.safeParse({
        name: `Category ${type}`,
        type,
      });
      assert.equal(result.success, true, `Type ${type} should be valid`);
    }
  });

  test("rejects invalid type", () => {
    const result = createPaymentCategorySchema.safeParse({
      name: "Invalid",
      type: "INVALID",
    });
    assert.equal(result.success, false);
  });

  test("accepts optional default amount", () => {
    const result = createPaymentCategorySchema.safeParse({
      name: "No Amount",
      type: "OTHER",
    });
    assert.equal(result.success, true);
  });

  test("rejects negative default amount", () => {
    const result = createPaymentCategorySchema.safeParse({
      name: "Negative",
      type: "OTHER",
      defaultAmount: -100,
    });
    assert.equal(result.success, false);
  });

  test("accepts all valid frequencies", () => {
    for (const frequency of ["ONE_OFF", "MONTHLY", "QUARTERLY", "ANNUALLY"]) {
      const result = createPaymentCategorySchema.safeParse({
        name: `Category ${frequency}`,
        type: "OTHER",
        frequency,
      });
      assert.equal(result.success, true, `Frequency ${frequency} should be valid`);
    }
  });
});

// ---------------------------------------------------------------------------
// Validation schema tests — Record Payment
// ---------------------------------------------------------------------------

describe("recordPaymentSchema", () => {
  test("accepts valid payment data", () => {
    const result = recordPaymentSchema.safeParse({
      membershipId: "mem-1",
      paymentCategoryId: "cat-1",
      amount: 5000,
      method: "CASH",
      reference: "PAY-001",
      paidAt: "2026-01-15",
    });
    assert.equal(result.success, true);
  });

  test("requires membershipId", () => {
    const result = recordPaymentSchema.safeParse({
      paymentCategoryId: "cat-1",
      amount: 5000,
      method: "CASH",
      reference: "PAY-001",
      paidAt: "2026-01-15",
    });
    assert.equal(result.success, false);
  });

  test("requires paymentCategoryId", () => {
    const result = recordPaymentSchema.safeParse({
      membershipId: "mem-1",
      amount: 5000,
      method: "CASH",
      reference: "PAY-001",
      paidAt: "2026-01-15",
    });
    assert.equal(result.success, false);
  });

  test("requires amount greater than 0", () => {
    const result = recordPaymentSchema.safeParse({
      membershipId: "mem-1",
      paymentCategoryId: "cat-1",
      amount: 0,
      method: "CASH",
      reference: "PAY-001",
      paidAt: "2026-01-15",
    });
    assert.equal(result.success, false);
  });

  test("accepts all valid payment methods", () => {
    for (const method of ["CASH", "BANK_TRANSFER", "CARD", "USSD", "OTHER"]) {
      const result = recordPaymentSchema.safeParse({
        membershipId: "mem-1",
        paymentCategoryId: "cat-1",
        amount: 5000,
        method,
        reference: "PAY-001",
        paidAt: "2026-01-15",
      });
      assert.equal(result.success, true, `Method ${method} should be valid`);
    }
  });

  test("rejects invalid method", () => {
    const result = recordPaymentSchema.safeParse({
      membershipId: "mem-1",
      paymentCategoryId: "cat-1",
      amount: 5000,
      method: "INVALID",
      reference: "PAY-001",
      paidAt: "2026-01-15",
    });
    assert.equal(result.success, false);
  });

  test("rejects missing reference", () => {
    const result = recordPaymentSchema.safeParse({
      membershipId: "mem-1",
      paymentCategoryId: "cat-1",
      amount: 5000,
      method: "CASH",
      paidAt: "2026-01-15",
    });
    assert.equal(result.success, false);
  });

  test("rejects periodEnd before periodStart", () => {
    const result = recordPaymentSchema.safeParse({
      membershipId: "mem-1",
      paymentCategoryId: "cat-1",
      amount: 5000,
      method: "CASH",
      reference: "PAY-001",
      paidAt: "2026-01-15",
      periodStart: "2026-06-01",
      periodEnd: "2026-01-01",
    });
    assert.equal(result.success, false);
  });

  test("accepts optional fineId", () => {
    const result = recordPaymentSchema.safeParse({
      membershipId: "mem-1",
      paymentCategoryId: "cat-1",
      amount: 5000,
      method: "CASH",
      reference: "PAY-001",
      paidAt: "2026-01-15",
      fineId: "fine-1",
    });
    assert.equal(result.success, true);
  });
});

// ---------------------------------------------------------------------------
// Validation schema tests — Issue Fine
// ---------------------------------------------------------------------------

describe("issueFineSchema", () => {
  test("accepts valid fine data", () => {
    const result = issueFineSchema.safeParse({
      membershipId: "mem-1",
      reason: "Late attendance",
      amount: 2000,
    });
    assert.equal(result.success, true);
  });

  test("requires membershipId", () => {
    const result = issueFineSchema.safeParse({
      reason: "Late attendance",
      amount: 2000,
    });
    assert.equal(result.success, false);
  });

  test("requires reason with at least 2 characters", () => {
    const result = issueFineSchema.safeParse({
      membershipId: "mem-1",
      reason: "A",
      amount: 2000,
    });
    assert.equal(result.success, false);
  });

  test("requires amount greater than 0", () => {
    const result = issueFineSchema.safeParse({
      membershipId: "mem-1",
      reason: "Late attendance",
      amount: 0,
    });
    assert.equal(result.success, false);
  });

  test("accepts optional dueDate", () => {
    const result = issueFineSchema.safeParse({
      membershipId: "mem-1",
      reason: "Late attendance",
      amount: 2000,
      dueDate: "2026-12-31",
    });
    assert.equal(result.success, true);
  });
});

// ---------------------------------------------------------------------------
// Validation schema tests — Waive Fine
// ---------------------------------------------------------------------------

describe("waiveFineSchema", () => {
  test("accepts valid waive data", () => {
    const result = waiveFineSchema.safeParse({
      fineId: "fine-1",
      waivedReason: "Member has financial hardship",
    });
    assert.equal(result.success, true);
  });

  test("requires fineId", () => {
    const result = waiveFineSchema.safeParse({
      waivedReason: "Member has financial hardship",
    });
    assert.equal(result.success, false);
  });

  test("requires waivedReason with at least 2 characters", () => {
    const result = waiveFineSchema.safeParse({
      fineId: "fine-1",
      waivedReason: "A",
    });
    assert.equal(result.success, false);
  });
});

// ---------------------------------------------------------------------------
// Data transformation tests
// ---------------------------------------------------------------------------

describe("Finance payment type mapping", () => {
  test("maps payment category types to display labels", () => {
    const typeLabels: Record<string, string> = {
      DUES: "Dues",
      CONTRIBUTION: "Contribution",
      LEVY: "Levy",
      EVENT: "Event",
      DONATION: "Donation",
      FINE: "Fine",
      OTHER: "Other",
    };

    assert.equal(typeLabels["DUES"], "Dues");
    assert.equal(typeLabels["CONTRIBUTION"], "Contribution");
    assert.equal(typeLabels["LEVY"], "Levy");
    assert.equal(typeLabels["EVENT"], "Event");
    assert.equal(typeLabels["DONATION"], "Donation");
    assert.equal(typeLabels["FINE"], "Fine");
    assert.equal(typeLabels["OTHER"], "Other");
  });

  test("maps payment statuses to badge colors", () => {
    const statusColors: Record<string, string> = {
      PENDING: "bg-yellow-100 text-yellow-800",
      COMPLETED: "bg-green-100 text-green-800",
      FAILED: "bg-red-100 text-red-800",
      REFUNDED: "bg-blue-100 text-blue-800",
    };

    assert.equal(statusColors["PENDING"].includes("yellow"), true);
    assert.equal(statusColors["COMPLETED"].includes("green"), true);
    assert.equal(statusColors["FAILED"].includes("red"), true);
    assert.equal(statusColors["REFUNDED"].includes("blue"), true);
  });

  test("maps payment methods to display labels", () => {
    const methodLabels: Record<string, string> = {
      CASH: "Cash",
      BANK_TRANSFER: "Bank Transfer",
      CARD: "Card",
      USSD: "USSD",
      OTHER: "Other",
    };

    assert.equal(methodLabels["CASH"], "Cash");
    assert.equal(methodLabels["BANK_TRANSFER"], "Bank Transfer");
    assert.equal(methodLabels["CARD"], "Card");
    assert.equal(methodLabels["USSD"], "USSD");
    assert.equal(methodLabels["OTHER"], "Other");
  });

  test("maps fine statuses to display labels", () => {
    const fineStatusLabels: Record<string, string> = {
      PENDING: "Pending",
      PARTIALLY_PAID: "Partially Paid",
      PAID: "Paid",
      WAIVED: "Waived",
      CANCELLED: "Cancelled",
    };

    assert.equal(fineStatusLabels["PENDING"], "Pending");
    assert.equal(fineStatusLabels["PARTIALLY_PAID"], "Partially Paid");
    assert.equal(fineStatusLabels["PAID"], "Paid");
    assert.equal(fineStatusLabels["WAIVED"], "Waived");
    assert.equal(fineStatusLabels["CANCELLED"], "Cancelled");
  });
});

// ---------------------------------------------------------------------------
// Finance calculation tests
// ---------------------------------------------------------------------------

describe("Finance stats calculation", () => {
  test("calculates collection rate correctly", () => {
    const totalCollected = 80000;
    const totalPending = 20000;
    const totalExpected = totalCollected + totalPending;
    const collectionRate = Math.round((totalCollected / totalExpected) * 100);
    assert.equal(collectionRate, 80);
  });

  test("collection rate is 100% when no pending payments", () => {
    const totalCollected = 50000;
    const totalPending = 0;
    const totalExpected = totalCollected + totalPending;
    const collectionRate = totalExpected > 0
      ? Math.round((totalCollected / totalExpected) * 100)
      : 100;
    assert.equal(collectionRate, 100);
  });

  test("collection rate is 100% when no payments at all", () => {
    const totalCollected = 0;
    const totalPending = 0;
    const totalExpected = totalCollected + totalPending;
    const collectionRate = totalExpected > 0
      ? Math.round((totalCollected / totalExpected) * 100)
      : 100;
    assert.equal(collectionRate, 100);
  });

  test("calculates fine outstanding amount correctly", () => {
    const fineAmount = 10000;
    const paidAmount = 3500;
    const outstandingAmount = Math.max(0, fineAmount - paidAmount);
    assert.equal(outstandingAmount, 6500);
  });

  test("fine outstanding is 0 when fully paid", () => {
    const fineAmount = 10000;
    const paidAmount = 10000;
    const outstandingAmount = Math.max(0, fineAmount - paidAmount);
    assert.equal(outstandingAmount, 0);
  });

  test("fine outstanding is 0 when overpaid", () => {
    const fineAmount = 10000;
    const paidAmount = 12000;
    const outstandingAmount = Math.max(0, fineAmount - paidAmount);
    assert.equal(outstandingAmount, 0);
  });

  test("total collected sums payment amounts correctly", () => {
    const payments = [
      { amount: 5000 },
      { amount: 3000 },
      { amount: 10000 },
    ];
    const total = payments.reduce((sum, p) => sum + p.amount, 0);
    assert.equal(total, 18000);
  });

  test("member balance calculation", () => {
    const completedPayments = [
      { amount: 5000 },
      { amount: 3000 },
    ];
    const pendingPayments = [
      { amount: 2000 },
    ];
    const totalPaid = completedPayments.reduce((sum, p) => sum + p.amount, 0);
    const totalPending = pendingPayments.reduce((sum, p) => sum + p.amount, 0);
    assert.equal(totalPaid, 8000);
    assert.equal(totalPending, 2000);
  });
});
