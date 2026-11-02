import { mkdir, cp, rm } from "node:fs/promises";
await rm("dist", { recursive: true, force: true });
await mkdir("dist", { recursive: true });
for (const entry of ["index.html", "src", "public", "server", "package.json"])
  await cp(entry, `dist/${entry}`, { recursive: true });
console.log(
  "Built dist/. Run node dist/server/server.mjs to serve the page and waitlist API.",
);
