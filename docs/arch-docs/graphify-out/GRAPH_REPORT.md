# Graph Report - arch-docs  (2026-11-26)

## Corpus Check
- 8 files · ~4,230 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 57 nodes · 49 edges · 9 communities
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `f4d37cb6`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Revision v1.1 — EPIC 2 (2026-11-26)
- Architecture Document — LeaveTrack v1.0
- ADR-LeaveTrack-E002 — Monthly Accrual: Idempotency, Catch-up, and Triggering
- ADR-LeaveTrack-E001 — Auth & Session Strategy
- ADR-LeaveTrack-E003 — Data Access: postgres.js over the pooled URL, behind a SQL port
- ADR-LeaveTrack-E004 — Real Authentication: Supabase Auth with signed sessions
- ADR-LeaveTrack-E005 — Approval Routing: direct manager, HR for managers, HR peer for HR
- ADR-LeaveTrack-E006 — Balance Ledger and Negative-Balance Resolutions
- ADR-LeaveTrack-E007 — Notifications: transactional outbox plus in-app inbox

## God Nodes (most connected - your core abstractions)
1. `Revision v1.1 — EPIC 2 (2026-11-26)` - 9 edges
2. `Architecture Document — LeaveTrack v1.0` - 8 edges
3. `ADR-LeaveTrack-E002 — Monthly Accrual: Idempotency, Catch-up, and Triggering` - 6 edges
4. `ADR-LeaveTrack-E001 — Auth & Session Strategy` - 5 edges
5. `ADR-LeaveTrack-E003 — Data Access: postgres.js over the pooled URL, behind a SQL port` - 5 edges
6. `ADR-LeaveTrack-E004 — Real Authentication: Supabase Auth with signed sessions` - 5 edges
7. `ADR-LeaveTrack-E005 — Approval Routing: direct manager, HR for managers, HR peer for HR` - 4 edges
8. `ADR-LeaveTrack-E006 — Balance Ledger and Negative-Balance Resolutions` - 4 edges
9. `ADR-LeaveTrack-E007 — Notifications: transactional outbox plus in-app inbox` - 4 edges
10. `Context` - 1 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Communities (9 total, 0 thin omitted)

### Community 0 - "Revision v1.1 — EPIC 2 (2026-11-26)"
Cohesion: 0.22
Nodes (9): API additions (planned), Considered and not adopted, Data model additions (planned), Deployment changes, EPIC 2 decisions (adopted 2026-11-26), Open Questions (updated), Revision v1.1 — EPIC 2 (2026-11-26), Security changes (+1 more)

### Community 1 - "Architecture Document — LeaveTrack v1.0"
Cohesion: 0.25
Nodes (7): API Design (selected), Architecture Document — LeaveTrack v1.0, Data Model, Deployment Topology, Open Questions, Security, Stack

### Community 2 - "ADR-LeaveTrack-E002 — Monthly Accrual: Idempotency, Catch-up, and Triggering"
Cohesion: 0.29
Nodes (6): ADR-LeaveTrack-E002 — Monthly Accrual: Idempotency, Catch-up, and Triggering, Consequences, Context, Decision, Options considered, Policy changes vs catch-up

### Community 3 - "ADR-LeaveTrack-E001 — Auth & Session Strategy"
Cohesion: 0.33
Nodes (5): ADR-LeaveTrack-E001 — Auth & Session Strategy, Consequences, Context, Decision, Options Considered

### Community 4 - "ADR-LeaveTrack-E003 — Data Access: postgres.js over the pooled URL, behind a SQL port"
Cohesion: 0.33
Nodes (5): ADR-LeaveTrack-E003 — Data Access: postgres.js over the pooled URL, behind a SQL port, Consequences, Context, Decision, Options considered

### Community 5 - "ADR-LeaveTrack-E004 — Real Authentication: Supabase Auth with signed sessions"
Cohesion: 0.33
Nodes (5): ADR-LeaveTrack-E004 — Real Authentication: Supabase Auth with signed sessions, Consequences, Context, Decision, Options considered

### Community 6 - "ADR-LeaveTrack-E005 — Approval Routing: direct manager, HR for managers, HR peer for HR"
Cohesion: 0.40
Nodes (4): ADR-LeaveTrack-E005 — Approval Routing: direct manager, HR for managers, HR peer for HR, Consequences, Context, Decision

### Community 7 - "ADR-LeaveTrack-E006 — Balance Ledger and Negative-Balance Resolutions"
Cohesion: 0.40
Nodes (4): ADR-LeaveTrack-E006 — Balance Ledger and Negative-Balance Resolutions, Consequences, Context, Decision

### Community 8 - "ADR-LeaveTrack-E007 — Notifications: transactional outbox plus in-app inbox"
Cohesion: 0.40
Nodes (4): ADR-LeaveTrack-E007 — Notifications: transactional outbox plus in-app inbox, Consequences, Context, Decision

## Knowledge Gaps
- **40 isolated node(s):** `Context`, `Options Considered`, `Decision`, `Consequences`, `Context` (+35 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 48 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Revision v1.1 — EPIC 2 (2026-11-26)` connect `Revision v1.1 — EPIC 2 (2026-11-26)` to `Architecture Document — LeaveTrack v1.0`?**
  _High betweenness centrality (0.060) - this node is a cross-community bridge._
- **Why does `Architecture Document — LeaveTrack v1.0` connect `Architecture Document — LeaveTrack v1.0` to `Revision v1.1 — EPIC 2 (2026-11-26)`?**
  _High betweenness centrality (0.055) - this node is a cross-community bridge._
- **What connects `Context`, `Options Considered`, `Decision` to the rest of the system?**
  _40 weakly-connected nodes found - possible documentation gaps or missing edges._