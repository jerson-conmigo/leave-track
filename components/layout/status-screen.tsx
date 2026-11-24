import type { LucideIcon } from "lucide-react";

type StatusScreenProps = {
  icon: LucideIcon;
  code?: string;
  title: string;
  description: string;
  action?: React.ReactNode;
};

/** Full-page status (404 / 403 / error). */
export function StatusScreen({ icon: Icon, code, title, description, action }: StatusScreenProps) {
  return (
    <main className="flex min-h-[60dvh] items-center justify-center p-4">
      <div className="max-w-md text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-accent text-accent-foreground">
          <Icon className="size-7" aria-hidden />
        </div>
        {code ? <p className="mt-4 font-mono text-sm text-muted-foreground">{code}</p> : null}
        <h1 className="mt-1 text-xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
      </div>
    </main>
  );
}
