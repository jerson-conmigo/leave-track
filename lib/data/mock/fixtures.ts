import type {
  AccrualRun,
  AuditLogEntry,
  LeaveBalance,
  LeavePolicy,
  LeaveRequest,
  LeaveType,
  User,
} from "@/lib/data/types";

/**
 * Day 0 mock data. IDs are IDENTICAL to supabase/seed.sql so swapping the mock
 * repository for the real one on Day 1 keeps every cookie/session/URL valid.
 * Keep the two files in sync when editing either.
 */

export const LEAVE_TYPE_IDS = {
  Vacation: "10000000-0000-4000-8000-000000000001",
  Sick: "10000000-0000-4000-8000-000000000002",
  Unpaid: "10000000-0000-4000-8000-000000000003",
} as const;

export const USER_IDS = {
  carla: "00000000-0000-4000-8000-000000000001",
  ben: "00000000-0000-4000-8000-000000000011",
  maya: "00000000-0000-4000-8000-000000000012",
  ana: "00000000-0000-4000-8000-000000000101",
  jordan: "00000000-0000-4000-8000-000000000102",
  priya: "00000000-0000-4000-8000-000000000103",
  sam: "00000000-0000-4000-8000-000000000104",
  lena: "00000000-0000-4000-8000-000000000105",
  diego: "00000000-0000-4000-8000-000000000106",
} as const;

export const LAST_ACCRUAL_AT = "2026-11-01T02:00:00.000Z";

/** Mirrors the seeded accrual_runs row (defaults for the audit columns). */
export const accrualRuns: AccrualRun[] = [
  {
    period: "2026-11-01",
    ranAt: LAST_ACCRUAL_AT,
    trigger: "manual",
    usersAccrued: 0,
    daysAccrued: 0,
    rates: [],
  },
];

export const leaveTypes: LeaveType[] = [
  { id: LEAVE_TYPE_IDS.Vacation, name: "Vacation", tracksBalance: true },
  { id: LEAVE_TYPE_IDS.Sick, name: "Sick", tracksBalance: true },
  { id: LEAVE_TYPE_IDS.Unpaid, name: "Unpaid", tracksBalance: false },
];

export const users: User[] = [
  {
    id: USER_IDS.carla,
    name: "Carla Diaz",
    email: "carla.diaz@leavetrack.test",
    role: "hr_admin",
    managerId: null,
  },
  {
    id: USER_IDS.ben,
    name: "Ben Ortiz",
    email: "ben.ortiz@leavetrack.test",
    role: "manager",
    managerId: USER_IDS.carla,
  },
  {
    id: USER_IDS.maya,
    name: "Maya Chen",
    email: "maya.chen@leavetrack.test",
    role: "manager",
    managerId: USER_IDS.carla,
  },
  {
    id: USER_IDS.ana,
    name: "Ana Reyes",
    email: "ana.reyes@leavetrack.test",
    role: "employee",
    managerId: USER_IDS.ben,
  },
  {
    id: USER_IDS.jordan,
    name: "Jordan Lee",
    email: "jordan.lee@leavetrack.test",
    role: "employee",
    managerId: USER_IDS.ben,
  },
  {
    id: USER_IDS.priya,
    name: "Priya Nair",
    email: "priya.nair@leavetrack.test",
    role: "employee",
    managerId: USER_IDS.ben,
  },
  {
    id: USER_IDS.sam,
    name: "Sam Okafor",
    email: "sam.okafor@leavetrack.test",
    role: "employee",
    managerId: USER_IDS.maya,
  },
  {
    id: USER_IDS.lena,
    name: "Lena Fischer",
    email: "lena.fischer@leavetrack.test",
    role: "employee",
    managerId: USER_IDS.maya,
  },
  {
    id: USER_IDS.diego,
    name: "Diego Alvarez",
    email: "diego.alvarez@leavetrack.test",
    role: "employee",
    managerId: USER_IDS.maya,
  },
];

/** [userKey, vacation balance, sick balance] — matches seed.sql. */
const BALANCE_ROWS: [keyof typeof USER_IDS, number, number][] = [
  ["carla", 14.5, 8],
  ["ben", 12, 6],
  ["maya", 9.75, 7],
  ["ana", 11.25, 5],
  ["jordan", 6.5, 3],
  ["priya", 15, 9],
  ["sam", 3.75, 4],
  ["lena", 8, 6.5],
  ["diego", 10, 2],
];

export const leaveBalances: LeaveBalance[] = BALANCE_ROWS.flatMap(([key, vacation, sick], i) => [
  {
    id: `50000000-0000-4000-8000-${String(i * 2 + 1).padStart(12, "0")}`,
    userId: USER_IDS[key],
    leaveTypeId: LEAVE_TYPE_IDS.Vacation,
    balance: vacation,
    updatedAt: LAST_ACCRUAL_AT,
  },
  {
    id: `50000000-0000-4000-8000-${String(i * 2 + 2).padStart(12, "0")}`,
    userId: USER_IDS[key],
    leaveTypeId: LEAVE_TYPE_IDS.Sick,
    balance: sick,
    updatedAt: LAST_ACCRUAL_AT,
  },
]);

export const leavePolicies: LeavePolicy[] = BALANCE_ROWS.flatMap(([key], i) => [
  {
    id: `40000000-0000-4000-8000-${String(i * 2 + 1).padStart(12, "0")}`,
    userId: USER_IDS[key],
    leaveTypeId: LEAVE_TYPE_IDS.Vacation,
    accrualPerMonth: 1.25,
  },
  {
    id: `40000000-0000-4000-8000-${String(i * 2 + 2).padStart(12, "0")}`,
    userId: USER_IDS[key],
    leaveTypeId: LEAVE_TYPE_IDS.Sick,
    accrualPerMonth: 1,
  },
]);

const req = (
  n: number,
  userId: string,
  leaveTypeId: string,
  startDate: string,
  endDate: string,
  reason: string,
  createdAt: string,
  decision?: { status: "approved" | "rejected"; by: string; at: string; reason?: string },
): LeaveRequest => ({
  id: `20000000-0000-4000-8000-${String(n).padStart(12, "0")}`,
  userId,
  leaveTypeId,
  startDate,
  endDate,
  reason,
  status: decision?.status ?? "pending",
  decidedBy: decision?.by ?? null,
  decidedAt: decision?.at ?? null,
  decisionReason: decision?.reason ?? null,
  isDeleted: false,
  createdAt,
});

const { Vacation, Sick, Unpaid } = LEAVE_TYPE_IDS;
const u = USER_IDS;

export const leaveRequests: LeaveRequest[] = [
  req(
    1,
    u.ana,
    Vacation,
    "2026-12-21",
    "2026-12-31",
    "Year-end holiday with family",
    "2026-11-18T09:12:00.000Z",
  ),
  req(2, u.ana, Sick, "2026-10-06", "2026-10-07", "Flu", "2026-10-06T07:40:00.000Z", {
    status: "approved",
    by: u.ben,
    at: "2026-10-06T10:02:00.000Z",
  }),
  req(3, u.ana, Vacation, "2026-08-10", "2026-08-14", "Summer trip", "2026-07-20T14:30:00.000Z", {
    status: "approved",
    by: u.ben,
    at: "2026-07-21T08:15:00.000Z",
  }),
  req(
    4,
    u.jordan,
    Vacation,
    "2026-12-01",
    "2026-12-05",
    "Visiting parents",
    "2026-11-19T11:05:00.000Z",
  ),
  req(
    5,
    u.jordan,
    Unpaid,
    "2026-11-30",
    "2026-11-30",
    "Moving apartments",
    "2026-11-20T16:45:00.000Z",
  ),
  req(
    6,
    u.priya,
    Vacation,
    "2026-11-16",
    "2026-11-20",
    "Conference + rest days",
    "2026-11-02T13:20:00.000Z",
    {
      status: "rejected",
      by: u.ben,
      at: "2026-11-03T09:00:00.000Z",
      reason: "Overlaps the Q4 release freeze — please pick another week",
    },
  ),
  req(7, u.sam, Vacation, "2027-01-04", "2027-01-08", "Ski week", "2026-11-21T08:30:00.000Z"),
  req(
    8,
    u.lena,
    Sick,
    "2026-11-19",
    "2026-11-19",
    "Dentist appointment",
    "2026-11-19T06:55:00.000Z",
    { status: "approved", by: u.maya, at: "2026-11-19T08:10:00.000Z" },
  ),
  req(9, u.diego, Vacation, "2026-12-14", "2026-12-16", "Long weekend", "2026-11-22T10:00:00.000Z"),
  req(10, u.ben, Vacation, "2026-12-28", "2026-12-31", "Holidays", "2026-11-15T12:00:00.000Z"),
];

/** One `submitted` row per request, plus one decision row for decided requests. */
export const auditLog: AuditLogEntry[] = leaveRequests.flatMap((r, i) => {
  const rows: AuditLogEntry[] = [
    {
      id: `30000000-0000-4000-8000-${String(i * 2 + 1).padStart(12, "0")}`,
      leaveRequestId: r.id,
      actorId: r.userId,
      action: "submitted",
      occurredAt: r.createdAt,
    },
  ];
  if (r.status !== "pending" && r.decidedBy && r.decidedAt) {
    rows.push({
      id: `30000000-0000-4000-8000-${String(i * 2 + 2).padStart(12, "0")}`,
      leaveRequestId: r.id,
      actorId: r.decidedBy,
      action: r.status,
      occurredAt: r.decidedAt,
    });
  }
  return rows;
});
