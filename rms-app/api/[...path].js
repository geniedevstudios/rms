import proxyToStudio from "../server/studio-proxy.mjs";

export default function handler(req, res) {
  return proxyToStudio(req, res);
}
