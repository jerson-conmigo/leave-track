"use client";

import "./globals.css";

/** Last-resort boundary when the root layout itself fails. Must render <html>. */
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-dvh items-center justify-center p-4">
        <main className="max-w-sm text-center">
          <h1 className="text-xl font-semibold">LeaveTrack is unavailable</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Something went wrong while loading the app. Please try again.
          </p>
          <button
            type="button"
            onClick={reset}
            className="mt-6 inline-flex h-11 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
