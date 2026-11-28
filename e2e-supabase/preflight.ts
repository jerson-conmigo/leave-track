import { spawnSync } from "node:child_process";

/**
 * Preflight for the real-Supabase e2e (TASK-024 A4). The app MUST run on the port in
 * supabase/config.toml [auth] site_url (http://localhost:3000): the invite and reset
 * emails build their links from it. A dev server already on that port would otherwise
 * fail the run with a confusing error, so check first and say what to do.
 *
 * Synchronous (a tiny child process) so it can run while the Playwright config loads,
 * before anything is built. Portable: no lsof. Two checks, because a server bound only to
 * 127.0.0.1 does NOT stop a new listener on all interfaces (macOS):
 *   1. connect to 127.0.0.1 and ::1 — anything answering there is what the suite would hit
 *      at http://localhost:<port>;
 *   2. then try to listen on the port the way `next start` does.
 */
const PROBE = `
const net = require("node:net");
const port = Number(process.argv[1]);
const answers = (host) => new Promise((resolve) => {
  const socket = net.connect({ host, port });
  socket.setTimeout(1000);
  socket.once("connect", () => { socket.destroy(); resolve(true); });
  socket.once("timeout", () => { socket.destroy(); resolve(false); });
  socket.once("error", () => resolve(false));
});
(async () => {
  for (const host of ["127.0.0.1", "::1"]) {
    if (await answers(host)) { process.stdout.write("EADDRINUSE"); process.exit(0); }
  }
  const server = net.createServer();
  server.once("error", (e) => { process.stdout.write(e.code || "ERROR"); process.exit(0); });
  server.listen(port, () => server.close(() => { process.stdout.write("FREE"); process.exit(0); }));
})();
`;

/** "FREE", "EADDRINUSE", or another error code from trying to listen on `port`. */
export function probePort(port: number): string {
  const res = spawnSync(process.execPath, ["-e", PROBE, String(port)], {
    encoding: "utf8",
    timeout: 10_000,
  });
  return (res.stdout || "").trim() || `probe failed (${res.error?.message ?? res.status})`;
}

export function assertPortFree(port: number, probe: (port: number) => string = probePort): void {
  const result = probe(port);
  if (result === "FREE") return;
  const why =
    result === "EADDRINUSE"
      ? `Port ${port} is already in use (often \`npm run dev\` or another \`next start\`).`
      : `Port ${port} could not be checked (${result}).`;
  throw new Error(
    `${why} The Supabase e2e must run on ${port}: supabase/config.toml [auth] site_url ` +
      `(http://localhost:${port}) builds the invite and reset links. Stop the process using ` +
      `it (macOS/Linux: lsof -i :${port}), then run npm run test:e2e:supabase again.`,
  );
}
