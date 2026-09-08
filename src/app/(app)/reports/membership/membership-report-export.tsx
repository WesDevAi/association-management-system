"use client";

import { useTransition } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MembershipReport } from "@/server/services/report-service";
import { arrayToCsv, downloadCsv } from "@/lib/csv-export";

interface MembershipReportExportProps {
  report: MembershipReport;
}

export function MembershipReportExport({ report }: MembershipReportExportProps) {
  const [isPending, startTransition] = useTransition();

  function handleExport() {
    startTransition(() => {
      const headers = ["Name", "Email", "Membership #", "Status", "Role", "Branch", "Joined"];
      const rows = report.recentRegistrations.map((m) => [
        m.fullName,
        m.email,
        m.membershipNumber,
        m.status,
        m.roleName,
        m.branchName ?? "Unassigned",
        m.joinedAt instanceof Date ? m.joinedAt.toISOString().split("T")[0] : String(m.joinedAt),
      ]);

      const summaryRows: (string | number | null | undefined)[][] = [
        [""],
        ["SUMMARY"],
        ["Total Members", report.totalMembers],
        ["Active", report.active],
        ["Pending", report.pending],
        ["Inactive", report.inactive],
        ["Suspended", report.suspended],
        ["Expelled", report.expelled],
        ["Alumni", report.alumni],
        [""],
        ["MEMBERS BY BRANCH"],
        ...report.membersByBranch.map((b) => [b.branchName, b.count]),
        [""],
        ["MEMBERS BY ROLE"],
        ...report.membersByRole.map((r) => [r.roleName, r.count]),
        [""],
        ["RECENT REGISTRATIONS"],
      ];

      const csv = arrayToCsv(headers, [...summaryRows, ...rows]);
      downloadCsv(`membership-report-${new Date().toISOString().split("T")[0]}.csv`, csv);
    });
  }

  return (
    <Button variant="outline" size="sm" onClick={handleExport} disabled={isPending}>
      <Download className="mr-2 size-4" />
      Export CSV
    </Button>
  );
}
