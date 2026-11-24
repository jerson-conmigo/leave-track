"use client";

import { TriangleAlert } from "lucide-react";
import { StatusScreen } from "@/components/layout/status-screen";
import { Button } from "@/components/ui/button";

/** Route-segment error boundary. Server-side details are logged, never shown. */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <StatusScreen
      icon={TriangleAlert}
      title="Something went wrong"
      description={
        error.digest
          ? `We couldn't load this page. If it keeps happening, share reference ${error.digest} with support.`
          : "We couldn't load this page. Please try again."
      }
      action={<Button onClick={reset}>Try again</Button>}
    />
  );
}
