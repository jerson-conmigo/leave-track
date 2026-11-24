import { FileQuestion } from "lucide-react";
import Link from "next/link";
import { StatusScreen } from "@/components/layout/status-screen";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <StatusScreen
      icon={FileQuestion}
      code="404"
      title="Page not found"
      description="The page you're looking for doesn't exist or has moved."
      action={
        <Button asChild>
          <Link href="/dashboard">Back to dashboard</Link>
        </Button>
      }
    />
  );
}
