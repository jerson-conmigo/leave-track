import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { PolicyTable } from "@/components/policies/policy-table";
import { requireRole } from "@/lib/auth/session";
import { repository } from "@/lib/data/repositories";

export const metadata: Metadata = { title: "Leave policies" };

export default async function PoliciesPage() {
  await requireRole("hr_admin");
  const policies = await repository.listPolicies();

  return (
    <>
      <PageHeader
        title="Leave policies"
        description="Monthly accrual per employee and leave type. Unpaid leave has no policy."
      />
      <PolicyTable policies={policies} />
    </>
  );
}
