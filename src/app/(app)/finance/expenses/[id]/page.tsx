import { notFound } from "next/navigation";
import Link from "next/link";
import { requirePermission } from "@/server/permissions/guards";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { getExpense } from "@/server/services/expense-service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, ExternalLink, FileText } from "lucide-react";
import { format } from "date-fns";

const methodLabels: Record<string, string> = {
  CASH: "Cash",
  BANK_TRANSFER: "Bank Transfer",
  CARD: "Card",
  USSD: "USSD",
  OTHER: "Other",
};

export default async function ExpenseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const context = await requirePermission(PERMISSIONS.EXPENSES_VIEW);
  const associationId = context.membership.associationId;

  const expense = await getExpense(associationId, id);

  if (!expense) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Link href="/finance/expenses">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Expense {expense.reference}
          </h1>
          <p className="text-sm text-muted-foreground">
            Detailed view of this expense record.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Expense Information</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-medium text-muted-foreground">Reference</dt>
                  <dd className="mt-1 font-mono text-sm">{expense.reference}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-muted-foreground">Amount</dt>
                  <dd className="mt-1 text-lg font-semibold">
                    ₦{Number(expense.amount).toLocaleString()}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-muted-foreground">Date</dt>
                  <dd className="mt-1 text-sm">{format(expense.date, "MMMM d, yyyy")}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-muted-foreground">Category</dt>
                  <dd className="mt-1 text-sm">{expense.categoryName}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-muted-foreground">Payment Method</dt>
                  <dd className="mt-1 text-sm">
                    {methodLabels[expense.paymentMethod] ?? expense.paymentMethod}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-muted-foreground">Payee/Vendor</dt>
                  <dd className="mt-1 text-sm">{expense.payeeVendor}</dd>
                </div>
                {expense.referenceNumber && (
                  <div>
                    <dt className="text-xs font-medium text-muted-foreground">Reference Number</dt>
                    <dd className="mt-1 text-sm">{expense.referenceNumber}</dd>
                  </div>
                )}
                <div className="sm:col-span-2">
                  <dt className="text-xs font-medium text-muted-foreground">Description</dt>
                  <dd className="mt-1 text-sm">{expense.description}</dd>
                </div>
                {expense.notes && (
                  <div className="sm:col-span-2">
                    <dt className="text-xs font-medium text-muted-foreground">Notes</dt>
                    <dd className="mt-1 text-sm whitespace-pre-wrap">{expense.notes}</dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>

          {expense.financialTransaction && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Financial Transaction</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <dt className="text-xs font-medium text-muted-foreground">Transaction ID</dt>
                    <dd className="mt-1 font-mono text-xs">{expense.financialTransaction.id}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-muted-foreground">Type</dt>
                    <dd className="mt-1">
                      <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900 dark:text-red-100">
                        {expense.financialTransaction.type}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-muted-foreground">Amount</dt>
                    <dd className="mt-1 text-sm">
                      ₦{Number(expense.financialTransaction.amount).toLocaleString()}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-muted-foreground">Category</dt>
                    <dd className="mt-1 text-sm">{expense.financialTransaction.category}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Metadata</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="flex flex-col gap-3 text-sm">
                <div>
                  <dt className="text-xs font-medium text-muted-foreground">Recorded By</dt>
                  <dd className="mt-1">{expense.recordedByName ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-muted-foreground">Created</dt>
                  <dd className="mt-1">{format(expense.createdAt, "MMM d, yyyy 'at' h:mm a")}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-muted-foreground">Currency</dt>
                  <dd className="mt-1">{expense.currency}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {expense.receiptDocument && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Receipt</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <FileText className="size-8 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{expense.receiptDocument.title}</p>
                    {expense.receiptDocument.fileType && (
                      <p className="text-xs text-muted-foreground">
                        {expense.receiptDocument.fileType}
                      </p>
                    )}
                  </div>
                </div>
                <a
                  href={expense.receiptDocument.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  View Document
                  <ExternalLink className="size-3" />
                </a>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
