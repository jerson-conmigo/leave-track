import type { Metadata } from "next";
import { CircleCheck, ShieldCheck, Smartphone } from "lucide-react";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { Brand } from "@/components/layout/brand";
import { getSession } from "@/lib/auth/session";
import { repository } from "@/lib/data/repositories";

export const metadata: Metadata = { title: "Sign in" };

const HIGHLIGHTS = [
  { icon: CircleCheck, text: "Request time off and track approval in one place" },
  { icon: ShieldCheck, text: "Managers only ever see their own team" },
  { icon: Smartphone, text: "Works just as well on your phone" },
];

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  if (await getSession()) redirect("/dashboard");
  const { next } = await searchParams;
  const users = await repository.listUsers();

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <section
        aria-hidden
        className="relative hidden flex-col justify-between bg-primary p-12 text-primary-foreground lg:flex"
      >
        <p className="text-lg font-semibold">LeaveTrack</p>
        <div>
          <h2 className="max-w-md text-3xl leading-tight font-semibold tracking-tight">
            Time off, without the email chains.
          </h2>
          <ul className="mt-8 flex flex-col gap-4">
            {HIGHLIGHTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sm">
                <Icon className="size-5 shrink-0 opacity-90" />
                {text}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-sm opacity-80">Self-service leave for the whole team.</p>
      </section>

      <main className="flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-sm">
          <Brand className="mb-8 lg:hidden" />
          <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
          <p className="mt-1 mb-6 text-sm text-muted-foreground">
            Welcome back. Sign in to manage your leave.
          </p>
          <LoginForm
            mockUsers={users.map((u) => ({ id: u.id, name: u.name, role: u.role }))}
            next={typeof next === "string" ? next : undefined}
          />
        </div>
      </main>
    </div>
  );
}
