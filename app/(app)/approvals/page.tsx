import type { Metadata } from "next";
import { ApprovalQueue } from "@/components/approvals/approval-queue";
import { PageHeader } from "@/components/layout/page-header";
import { requireRole } from "@/lib/auth/session";
import { repository } from "@/lib/data/repositories";
import { decideLeaveRequestAction } from "./actions";

export const metadata: Metadata = { title: "Approvals" };

export default async function ApprovalsPage() {
  const session = await requireRole("manager", "hr_admin");
  // Scoped in SQL (can_decide) to the requests this user may decide — never filtered
  // client-side (BR-02, BR-10; TASK-026).
  const requests = await repository.listTeamRequests(session.userId, { status: "pending" });

  return (
    <>
      <PageHeader
        title="Approvals"
        description="Pending leave requests that are waiting for your decision."
      />
      <ApprovalQueue requests={requests} onDecide={decideLeaveRequestAction} />
    </>
  );
}
