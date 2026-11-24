import { Filter } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AuditFilter, User } from "@/lib/data/types";

export const ALL_EMPLOYEES = "all";

type AuditFiltersProps = {
  employees: Pick<User, "id" | "name">[];
  value: AuditFilter;
};

/**
 * URL-driven filters: a plain GET form, so the report is shareable/bookmarkable
 * and works without client JS. The page reads `searchParams`.
 */
export function AuditFilters({ employees, value }: AuditFiltersProps) {
  return (
    <form
      method="get"
      action="/audit"
      aria-label="Filter audit report"
      className="grid gap-4 rounded-lg border bg-card p-4 shadow-xs sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_auto] lg:items-end"
    >
      <div className="grid gap-2 sm:col-span-2 lg:col-span-1">
        <Label htmlFor="audit-employee">Employee</Label>
        <Select name="employee" defaultValue={value.employeeId ?? ALL_EMPLOYEES}>
          <SelectTrigger id="audit-employee" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_EMPLOYEES}>All employees</SelectItem>
            {employees.map((e) => (
              <SelectItem key={e.id} value={e.id}>
                {e.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="audit-from">From</Label>
        <Input id="audit-from" name="from" type="date" defaultValue={value.from} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="audit-to">To</Label>
        <Input id="audit-to" name="to" type="date" defaultValue={value.to} min={value.from} />
      </div>
      <div className="flex gap-2 sm:col-span-2 lg:col-span-1">
        <Button type="submit" className="flex-1 lg:flex-none">
          <Filter aria-hidden />
          Apply
        </Button>
        <Button variant="outline" asChild className="flex-1 lg:flex-none">
          <Link href="/audit">Reset</Link>
        </Button>
      </div>
    </form>
  );
}
