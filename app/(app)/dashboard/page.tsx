import type { Metadata } from "next";
import { ArrowRight, CalendarPlus, ClipboardCheck, Clock, ScrollText, Users } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { BalanceCard } from "@/components/leave/balance-card";
import { RequestList } from "@/components/leave/request-list";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireSession } from "@/lib/auth/session";
import { repository } from "@/lib/data/repositories";

export const metadata: Metadata = { title: "Dashboard" };

function StatCard(props: {
  icon: typeof Clock;
  label: string;
  value: number;
  href: string;
  cta: string;
}) {
  const Icon = props.icon;
  return (
    <Card className="gap-3 py-5">
      <CardHeader className="px-5">
        <CardDescription className="flex items-center gap-2">
          <Icon className="size-4" aria-hidden />
          {props.label}
        </CardDescription>
        <CardTitle className="text-3xl tabular-nums">{props.value}</CardTitle>
      </CardHeader>
      <CardContent className="px-5">
        <Link
          href={props.href}
          className="inline-flex min-h-11 items-center gap-1 rounded-sm text-sm font-medium text-primary hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none md:min-h-0"
        >
          {props.cta}
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      </CardContent>
    </Card>
  );
}

export default async function DashboardPage() {
  const session = await requireSession();
  const [balances, requests, team, stats] = await Promise.all([
    repository.getBalances(session.userId),
    repository.listMyRequests(session.userId),
    session.role === "manager"
      ? repository.listTeamRequests(session.userId, { status: "pending" })
      : null,
    session.role === "hr_admin" ? repository.getOrgStats() : null,
  ]);
  const firstName = session.name.split(" ")[0];

  return (
    <>
      <PageHeader
        title={`Hi, ${firstName}`}
        description="Here's your leave at a glance."
        action={
          <Button asChild className="w-full sm:w-auto">
            <Link href="/requests/new">
              <CalendarPlus aria-hidden />
              New request
            </Link>
          </Button>
        }
      />

      {team || stats ? (
        <section
          aria-label="Things that need you"
          className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {team ? (
            <StatCard
              icon={ClipboardCheck}
              label="Waiting for your approval"
              value={team.length}
              href="/approvals"
              cta="Review requests"
            />
          ) : null}
          {stats ? (
            <>
              <StatCard
                icon={Clock}
                label="Pending across the company"
                value={stats.pendingCount}
                href="/audit"
                cta="Open audit report"
              />
              <StatCard
                icon={ScrollText}
                label="Approved this month"
                value={stats.approvedThisMonth}
                href="/audit"
                cta="View history"
              />
              <StatCard
                icon={Users}
                label="People with a leave policy"
                value={stats.employeeCount}
                href="/policies"
                cta="Manage policies"
              />
            </>
          ) : null}
        </section>
      ) : null}

      <section aria-labelledby="balances-heading" className="mb-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 id="balances-heading" className="text-lg font-semibold">
            Your balance
          </h2>
          <Link
            href="/balance"
            className="inline-flex min-h-11 items-center text-sm font-medium text-primary hover:underline md:min-h-0"
          >
            Details
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {balances.map((b) => (
            <BalanceCard key={b.leaveType.id} balance={b} variant="compact" />
          ))}
        </div>
      </section>

      <section aria-labelledby="recent-heading">
        <div className="mb-3 flex items-center justify-between">
          <h2 id="recent-heading" className="text-lg font-semibold">
            Recent requests
          </h2>
          <Link
            href="/requests"
            className="inline-flex min-h-11 items-center text-sm font-medium text-primary hover:underline md:min-h-0"
          >
            View all
          </Link>
        </div>
        <RequestList requests={requests.slice(0, 3)} label="Recent leave requests" />
      </section>
    </>
  );
}
