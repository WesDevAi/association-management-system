"use client";

import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import type { MemberBalance } from "@/server/services/finance-service";

interface BalancesTableProps {
  balances: MemberBalance[];
}

export function BalancesTable({ balances }: BalancesTableProps) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return balances.filter((b) => {
      return (
        !search ||
        b.memberName.toLowerCase().includes(search.toLowerCase()) ||
        b.membershipNumber.toLowerCase().includes(search.toLowerCase()) ||
        (b.email && b.email.toLowerCase().includes(search.toLowerCase()))
      );
    });
  }, [balances, search]);

  return (
    <div className="flex flex-col gap-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search members..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="rounded-md border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-3 text-left font-medium">Member</th>
              <th className="px-4 py-3 text-left font-medium">Member #</th>
              <th className="px-4 py-3 text-right font-medium">Total Paid</th>
              <th className="px-4 py-3 text-right font-medium">Pending</th>
              <th className="px-4 py-3 text-right font-medium">Payments</th>
              <th className="px-4 py-3 text-left font-medium">Last Payment</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((balance) => (
              <tr
                key={balance.membershipId}
                className="border-b border-border/50 last:border-0"
              >
                <td className="px-4 py-3">
                  <div className="font-medium">{balance.memberName}</div>
                  {balance.email && (
                    <div className="text-xs text-muted-foreground">{balance.email}</div>
                  )}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {balance.membershipNumber}
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="font-medium text-green-600 dark:text-green-400">
                    ₦{Number(balance.totalPaid).toLocaleString()}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span
                    className={
                      Number(balance.totalPending) > 0
                        ? "font-medium text-amber-600 dark:text-amber-400"
                        : "text-muted-foreground"
                    }
                  >
                    ₦{Number(balance.totalPending).toLocaleString()}
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-muted-foreground">
                  {balance.paymentCount}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {balance.lastPaymentDate
                    ? format(balance.lastPaymentDate, "MMM d, yyyy")
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
            {balances.length === 0
              ? "No active members found."
              : "No members match your search."}
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Showing {filtered.length} of {balances.length} member(s)
      </p>
    </div>
  );
}
