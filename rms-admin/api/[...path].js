import { runStudio } from "./studio.mjs";

export default function handler(req, res) {
  return runStudio(req, res);
}
