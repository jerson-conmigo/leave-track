import type { Metadata } from "next";
import { ApprovalQueue } from "@/components/approvals/approval-queue";
import { PageHeader } from "@/components/layout/page-header";
import { requireRole } from "@/lib/auth/session";
import { repository } from "@/lib/data/repositories";

export const metadata: Metadata = { title: "Approvals" };

export default async function ApprovalsPage() {
  const session = await requireRole("manager");
  // Scoped to direct reports in the data layer — never filtered client-side (BR-02).
  const requests = await repository.listTeamRequests(session.userId, { status: "pending" });

  return (
    <>
      <PageHeader
        title="Approvals"
        description="Pending leave requests from your direct reports."
      />
      <ApprovalQueue requests={requests} />
    </>
  );
}
