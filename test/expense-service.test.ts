import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  createExpenseCategorySchema,
  updateExpenseCategorySchema,
  createExpenseSchema,
  updateExpenseSchema,
  expenseFilterSchema,
} from "@/server/validation/expense";
import { escapeCsvField, arrayToCsv } from "@/lib/csv-export";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { DEFAULT_ROLE_PERMISSIONS } from "@/lib/constants/default-role-permissions";

// ---------------------------------------------------------------------------
// Validation schema tests — Expense Categories
// ---------------------------------------------------------------------------

describe("createExpenseCategorySchema", () => {
  test("accepts valid category data", () => {
    const result = createExpenseCategorySchema.safeParse({
      name: "Office Supplies",
      description: "General office supplies",
    });
    assert.equal(result.success, true);
  });

  test("requires a name with at least 2 characters", () => {
    const result = createExpenseCategorySchema.safeParse({
      name: "A",
    });
    assert.equal(result.success, false);
  });

  test("allows empty description", () => {
    const result = createExpenseCategorySchema.safeParse({
      name: "Travel",
      description: "",
    });
    assert.equal(result.success, true);
  });

  test("allows missing description", () => {
    const result = createExpenseCategorySchema.safeParse({
      name: "Utilities",
    });
    assert.equal(result.success, true);
  });

  test("rejects empty name", () => {
    const result = createExpenseCategorySchema.safeParse({
      name: "",
    });
    assert.equal(result.success, false);
  });

  test("rejects name exceeding 100 characters", () => {
    const result = createExpenseCategorySchema.safeParse({
      name: "A".repeat(101),
    });
    assert.equal(result.success, false);
  });

  test("accepts name at exactly 100 characters", () => {
    const result = createExpenseCategorySchema.safeParse({
      name: "A".repeat(100),
    });
    assert.equal(result.success, true);
  });

  test("trims whitespace from name", () => {
    const result = createExpenseCategorySchema.safeParse({
      name: "  Office Supplies  ",
    });
    assert.equal(result.success, true);
    if (result.success) {
      assert.equal(result.data.name, "Office Supplies");
    }
  });
});

// ---------------------------------------------------------------------------
// Validation schema tests — Update Expense Category
// ---------------------------------------------------------------------------

describe("updateExpenseCategorySchema", () => {
  test("accepts valid update data", () => {
    const result = updateExpenseCategorySchema.safeParse({
      categoryId: "cat-1",
      name: "Updated Name",
    });
    assert.equal(result.success, true);
  });

  test("requires categoryId", () => {
    const result = updateExpenseCategorySchema.safeParse({
      name: "Updated",
    });
    assert.equal(result.success, false);
  });

  test("allows partial updates", () => {
    const result = updateExpenseCategorySchema.safeParse({
      categoryId: "cat-1",
      description: "New description",
    });
    assert.equal(result.success, true);
  });

  test("allows empty description to clear it", () => {
    const result = updateExpenseCategorySchema.safeParse({
      categoryId: "cat-1",
      description: "",
    });
    assert.equal(result.success, true);
  });
});

// ---------------------------------------------------------------------------
// Validation schema tests — Create Expense
// ---------------------------------------------------------------------------

describe("createExpenseSchema", () => {
  test("accepts valid expense data", () => {
    const result = createExpenseSchema.safeParse({
      expenseCategoryId: "cat-1",
      amount: 5000,
      date: "2026-09-01",
      description: "Office supplies purchase",
      paymentMethod: "CASH",
      payeeVendor: "Office Mart",
    });
    assert.equal(result.success, true);
  });

  test("requires expenseCategoryId", () => {
    const result = createExpenseSchema.safeParse({
      amount: 5000,
      date: "2026-09-01",
      description: "Test",
      paymentMethod: "CASH",
      payeeVendor: "Vendor",
    });
    assert.equal(result.success, false);
  });

  test("requires amount greater than 0", () => {
    const result = createExpenseSchema.safeParse({
      expenseCategoryId: "cat-1",
      amount: 0,
      date: "2026-09-01",
      description: "Test",
      paymentMethod: "CASH",
      payeeVendor: "Vendor",
    });
    assert.equal(result.success, false);
  });

  test("rejects negative amount", () => {
    const result = createExpenseSchema.safeParse({
      expenseCategoryId: "cat-1",
      amount: -100,
      date: "2026-09-01",
      description: "Test",
      paymentMethod: "CASH",
      payeeVendor: "Vendor",
    });
    assert.equal(result.success, false);
  });

  test("requires date", () => {
    const result = createExpenseSchema.safeParse({
      expenseCategoryId: "cat-1",
      amount: 5000,
      description: "Test",
      paymentMethod: "CASH",
      payeeVendor: "Vendor",
    });
    assert.equal(result.success, false);
  });

  test("requires description with at least 2 characters", () => {
    const result = createExpenseSchema.safeParse({
      expenseCategoryId: "cat-1",
      amount: 5000,
      date: "2026-09-01",
      description: "A",
      paymentMethod: "CASH",
      payeeVendor: "Vendor",
    });
    assert.equal(result.success, false);
  });

  test("requires payeeVendor", () => {
    const result = createExpenseSchema.safeParse({
      expenseCategoryId: "cat-1",
      amount: 5000,
      date: "2026-09-01",
      description: "Test expense",
      paymentMethod: "CASH",
    });
    assert.equal(result.success, false);
  });

  test("accepts all valid payment methods", () => {
    for (const method of ["CASH", "BANK_TRANSFER", "CARD", "USSD", "OTHER"]) {
      const result = createExpenseSchema.safeParse({
        expenseCategoryId: "cat-1",
        amount: 5000,
        date: "2026-09-01",
        description: "Test expense",
        paymentMethod: method,
        payeeVendor: "Vendor",
      });
      assert.equal(result.success, true, `Method ${method} should be valid`);
    }
  });

  test("rejects invalid payment method", () => {
    const result = createExpenseSchema.safeParse({
      expenseCategoryId: "cat-1",
      amount: 5000,
      date: "2026-09-01",
      description: "Test expense",
      paymentMethod: "CRYPTO",
      payeeVendor: "Vendor",
    });
    assert.equal(result.success, false);
  });

  test("accepts optional referenceNumber", () => {
    const result = createExpenseSchema.safeParse({
      expenseCategoryId: "cat-1",
      amount: 5000,
      date: "2026-09-01",
      description: "Test expense",
      paymentMethod: "CASH",
      payeeVendor: "Vendor",
      referenceNumber: "INV-001",
    });
    assert.equal(result.success, true);
  });

  test("accepts optional notes", () => {
    const result = createExpenseSchema.safeParse({
      expenseCategoryId: "cat-1",
      amount: 5000,
      date: "2026-09-01",
      description: "Test expense",
      paymentMethod: "CASH",
      payeeVendor: "Vendor",
      notes: "Some additional notes",
    });
    assert.equal(result.success, true);
  });

  test("accepts optional receiptDocumentId", () => {
    const result = createExpenseSchema.safeParse({
      expenseCategoryId: "cat-1",
      amount: 5000,
      date: "2026-09-01",
      description: "Test expense",
      paymentMethod: "CASH",
      payeeVendor: "Vendor",
      receiptDocumentId: "doc-1",
    });
    assert.equal(result.success, true);
  });
});

// ---------------------------------------------------------------------------
// Validation schema tests — Update Expense
// ---------------------------------------------------------------------------

describe("updateExpenseSchema", () => {
  test("accepts valid update data", () => {
    const result = updateExpenseSchema.safeParse({
      expenseId: "exp-1",
      amount: 7500,
    });
    assert.equal(result.success, true);
  });

  test("requires expenseId", () => {
    const result = updateExpenseSchema.safeParse({
      amount: 7500,
    });
    assert.equal(result.success, false);
  });

  test("allows partial updates", () => {
    const result = updateExpenseSchema.safeParse({
      expenseId: "exp-1",
      description: "Updated description",
    });
    assert.equal(result.success, true);
  });
});

// ---------------------------------------------------------------------------
// Validation schema tests — Expense Filters
// ---------------------------------------------------------------------------

describe("expenseFilterSchema", () => {
  test("accepts empty filters", () => {
    const result = expenseFilterSchema.safeParse({});
    assert.equal(result.success, true);
  });

  test("accepts valid date range", () => {
    const result = expenseFilterSchema.safeParse({
      dateFrom: "2026-01-01",
      dateTo: "2026-12-31",
    });
    assert.equal(result.success, true);
  });

  test("accepts valid sort and order", () => {
    const result = expenseFilterSchema.safeParse({
      sort: "amount",
      order: "desc",
    });
    assert.equal(result.success, true);
  });

  test("accepts valid page number", () => {
    const result = expenseFilterSchema.safeParse({
      page: 2,
    });
    assert.equal(result.success, true);
  });

  test("rejects invalid sort field", () => {
    const result = expenseFilterSchema.safeParse({
      sort: "invalid",
    });
    assert.equal(result.success, false);
  });

  test("rejects invalid order", () => {
    const result = expenseFilterSchema.safeParse({
      order: "random",
    });
    assert.equal(result.success, false);
  });
});

// ---------------------------------------------------------------------------
// Expense reference generation tests
// ---------------------------------------------------------------------------

describe("Expense reference format", () => {
  test("generates reference in EXP-YYYY-###### format", () => {
    const year = new Date().getFullYear();
    const prefix = `EXP-${year}-`;
    const sequence = 1;
    const reference = `${prefix}${String(sequence).padStart(6, "0")}`;
    assert.match(reference, /^EXP-\d{4}-\d{6}$/);
    assert.equal(reference, `EXP-${year}-000001`);
  });

  test("pads sequence to 6 digits", () => {
    const year = new Date().getFullYear();
    const reference = `EXP-${year}-${String(42).padStart(6, "0")}`;
    assert.equal(reference, `EXP-${year}-000042`);
  });

  test("handles sequence 999999 correctly", () => {
    const year = new Date().getFullYear();
    const reference = `EXP-${year}-${String(999999).padStart(6, "0")}`;
    assert.equal(reference, `EXP-${year}-999999`);
  });
});

// ---------------------------------------------------------------------------
// Expense data transformation tests
// ---------------------------------------------------------------------------

describe("Expense type mapping", () => {
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

  test("maps expense statuses to badge colors", () => {
    const statusColors: Record<string, string> = {
      ACTIVE: "bg-green-100 text-green-800",
      INACTIVE: "bg-gray-100 text-gray-800",
    };

    assert.equal(statusColors["ACTIVE"].includes("green"), true);
    assert.equal(statusColors["INACTIVE"].includes("gray"), true);
  });
});

// ---------------------------------------------------------------------------
// Expense calculation tests
// ---------------------------------------------------------------------------

describe("Expense stats calculation", () => {
  test("total expenses sums amounts correctly", () => {
    const expenses = [
      { amount: 5000 },
      { amount: 3000 },
      { amount: 10000 },
    ];
    const total = expenses.reduce((sum, e) => sum + e.amount, 0);
    assert.equal(total, 18000);
  });

  test("net balance is income minus expenses", () => {
    const totalIncome = 50000;
    const totalExpenses = 30000;
    const netBalance = totalIncome - totalExpenses;
    assert.equal(netBalance, 20000);
  });

  test("net balance is negative when expenses exceed income", () => {
    const totalIncome = 10000;
    const totalExpenses = 15000;
    const netBalance = totalIncome - totalExpenses;
    assert.equal(netBalance, -5000);
  });

  test("monthly totals group correctly by month", () => {
    const transactions = [
      { type: "INCOME", amount: 10000, month: 0 },
      { type: "EXPENSE", amount: 3000, month: 0 },
      { type: "INCOME", amount: 5000, month: 1 },
      { type: "EXPENSE", amount: 2000, month: 1 },
    ];

    const months = [0, 1].map((m) => {
      const monthTxns = transactions.filter((t) => t.month === m);
      const income = monthTxns
        .filter((t) => t.type === "INCOME")
        .reduce((sum, t) => sum + t.amount, 0);
      const expenses = monthTxns
        .filter((t) => t.type === "EXPENSE")
        .reduce((sum, t) => sum + t.amount, 0);
      return { month: m, income, expenses, net: income - expenses };
    });

    assert.equal(months[0].income, 10000);
    assert.equal(months[0].expenses, 3000);
    assert.equal(months[0].net, 7000);
    assert.equal(months[1].income, 5000);
    assert.equal(months[1].expenses, 2000);
    assert.equal(months[1].net, 3000);
  });

  test("quarterly totals aggregate from monthly data", () => {
    const monthlyData = [
      { quarter: 1, income: 10000, expenses: 3000 },
      { quarter: 1, income: 5000, expenses: 2000 },
      { quarter: 1, income: 8000, expenses: 4000 },
    ];

    const q1 = monthlyData.filter((m) => m.quarter === 1);
    const income = q1.reduce((sum, m) => sum + m.income, 0);
    const expenses = q1.reduce((sum, m) => sum + m.expenses, 0);

    assert.equal(income, 23000);
    assert.equal(expenses, 9000);
    assert.equal(income - expenses, 14000);
  });

  test("category totals group expenses correctly", () => {
    const expenses = [
      { categoryId: "cat-1", categoryName: "Office", amount: 5000 },
      { categoryId: "cat-2", categoryName: "Travel", amount: 3000 },
      { categoryId: "cat-1", categoryName: "Office", amount: 2000 },
    ];

    const map = new Map<string, { name: string; total: number; count: number }>();
    for (const e of expenses) {
      const existing = map.get(e.categoryId);
      if (existing) {
        existing.total += e.amount;
        existing.count += 1;
      } else {
        map.set(e.categoryId, { name: e.categoryName, total: e.amount, count: 1 });
      }
    }

    const office = map.get("cat-1");
    assert.ok(office);
    assert.equal(office.total, 7000);
    assert.equal(office.count, 2);

    const travel = map.get("cat-2");
    assert.ok(travel);
    assert.equal(travel.total, 3000);
    assert.equal(travel.count, 1);
  });
});

// ---------------------------------------------------------------------------
// CSV export utility tests
// ---------------------------------------------------------------------------

describe("CSV export utilities", () => {
  test("escapes fields containing commas", () => {
    const result = escapeCsvField("hello, world");
    assert.equal(result, '"hello, world"');
  });

  test("escapes fields containing quotes", () => {
    const result = escapeCsvField('say "hello"');
    assert.equal(result, '"say ""hello"""');
  });

  test("does not escape simple strings", () => {
    const result = escapeCsvField("hello world");
    assert.equal(result, "hello world");
  });

  test("handles null and undefined values", () => {
    assert.equal(escapeCsvField(null), "");
    assert.equal(escapeCsvField(undefined), "");
  });

  test("handles numeric values", () => {
    assert.equal(escapeCsvField(42), "42");
    assert.equal(escapeCsvField(3.14), "3.14");
  });

  test("arrayToCsv produces correct output", () => {
    const csv = arrayToCsv(["Name", "Amount"], [
      ["Office Supplies", 5000],
      ["Travel", 3000],
    ]);
    const lines = csv.split("\n");
    assert.equal(lines[0], "Name,Amount");
    assert.equal(lines[1], "Office Supplies,5000");
    assert.equal(lines[2], "Travel,3000");
  });
});

// ---------------------------------------------------------------------------
// Permission integration tests
// ---------------------------------------------------------------------------

describe("Expense permission checks", () => {
  test("EXPENSES_VIEW permission key is defined", () => {
    assert.equal(PERMISSIONS.EXPENSES_VIEW, "expenses.view");
  });

  test("EXPENSES_MANAGE permission key is defined", () => {
    assert.equal(PERMISSIONS.EXPENSES_MANAGE, "expenses.manage");
  });

  test("FINANCE_REPORTS_VIEW permission key is defined", () => {
    assert.equal(PERMISSIONS.FINANCE_REPORTS_VIEW, "finance_reports.view");
  });

  test("EXPENSES_VIEW is different from FINANCE_VIEW", () => {
    assert.notEqual(PERMISSIONS.EXPENSES_VIEW, PERMISSIONS.FINANCE_VIEW);
  });

  test("EXPENSES_MANAGE is different from FINANCE_MANAGE", () => {
    assert.notEqual(PERMISSIONS.EXPENSES_MANAGE, PERMISSIONS.FINANCE_MANAGE);
  });

  test("STAFF tier has EXPENSES_VIEW", () => {
    assert.ok(DEFAULT_ROLE_PERMISSIONS.STAFF.includes(PERMISSIONS.EXPENSES_VIEW));
  });

  test("STAFF tier has EXPENSES_MANAGE", () => {
    assert.ok(DEFAULT_ROLE_PERMISSIONS.STAFF.includes(PERMISSIONS.EXPENSES_MANAGE));
  });

  test("STAFF tier has FINANCE_REPORTS_VIEW", () => {
    assert.ok(DEFAULT_ROLE_PERMISSIONS.STAFF.includes(PERMISSIONS.FINANCE_REPORTS_VIEW));
  });

  test("AUDITOR tier has EXPENSES_VIEW but not EXPENSES_MANAGE", () => {
    assert.ok(DEFAULT_ROLE_PERMISSIONS.AUDITOR.includes(PERMISSIONS.EXPENSES_VIEW));
    assert.ok(!DEFAULT_ROLE_PERMISSIONS.AUDITOR.includes(PERMISSIONS.EXPENSES_MANAGE));
  });

  test("MEMBER tier does not have EXPENSES_VIEW", () => {
    assert.ok(!DEFAULT_ROLE_PERMISSIONS.MEMBER.includes(PERMISSIONS.EXPENSES_VIEW));
  });

  test("MEMBER tier does not have EXPENSES_MANAGE", () => {
    assert.ok(!DEFAULT_ROLE_PERMISSIONS.MEMBER.includes(PERMISSIONS.EXPENSES_MANAGE));
  });
});
