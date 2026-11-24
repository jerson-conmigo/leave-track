import type { Metadata } from "next";
import { ShieldX } from "lucide-react";
import Link from "next/link";
import { StatusScreen } from "@/components/layout/status-screen";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Access denied" };

export default function ForbiddenPage() {
  return (
    <StatusScreen
      icon={ShieldX}
      code="403"
      title="You don't have access to this page"
      description="This area is limited to a different role. If you think this is a mistake, contact HR."
      action={
        <Button asChild>
          <Link href="/dashboard">Back to dashboard</Link>
        </Button>
      }
    />
  );
}
