import type { Metadata } from "next";
import { Info } from "lucide-react";
import { ALL_EMPLOYEES, AuditFilters } from "@/components/audit/audit-filters";
import { AuditTable } from "@/components/audit/audit-table";
import { PageHeader } from "@/components/layout/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { requireRole } from "@/lib/auth/session";
import { repository } from "@/lib/data/repositories";
import type { AuditFilter } from "@/lib/data/types";
import { getSql } from "@/lib/db/postgres";

export const metadata: Metadata = { title: "Audit report" };

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function AuditPage({ searchParams }: PageProps<"/audit">) {
  await requireRole("hr_admin");
  const params = await searchParams;
  const employee = one(params.employee);
  const from = one(params.from);
  const to = one(params.to);

  const filter: AuditFilter = {
    employeeId: employee && employee !== ALL_EMPLOYEES ? employee : undefined,
    from: from && DATE.test(from) ? from : undefined,
    to: to && DATE.test(to) ? to : undefined,
  };

  const [users, entries] = await Promise.all([
    repository.listUsers(),
    repository.listAudit(filter),
  ]);

  return (
    <>
      <PageHeader
        title="Audit report"
        description="Every request and decision — who, what, and when. Records are retained for at least 3 years."
      />
      <div className="flex flex-col gap-6">
        {/* B13 / TASK-015: in Postgres mode this report still reads the mock — say so,
            so HR never mistakes an incomplete report for a complete one. */}
        {getSql() ? (
          <Alert role="status">
            <Info aria-hidden />
            <AlertTitle>Recent decisions may be missing from this report</AlertTitle>
            <AlertDescription>
              Approvals and rejections are being recorded in the database, but this report
              doesn&apos;t read from it yet. Full history arrives with the audit-report update
              (TASK-015).
            </AlertDescription>
          </Alert>
        ) : null}
        <AuditFilters employees={users.map((u) => ({ id: u.id, name: u.name }))} value={filter} />
        <section aria-label="Results">
          <AuditTable entries={entries} />
        </section>
      </div>
    </>
  );
}
