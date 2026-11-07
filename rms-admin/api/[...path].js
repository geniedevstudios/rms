import { runStudio } from "../server/vercel.mjs";

export default function handler(req, res) {
  return runStudio(req, res);
}
