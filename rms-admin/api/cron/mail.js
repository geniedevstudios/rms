import { runStudio } from "../../server/vercel.mjs";

export default function handler(req, res) {
  const search = new URL(req.url || "/", "http://localhost").search;
  req.url = "/api/cms/cron" + search;
  return runStudio(req, res);
}
