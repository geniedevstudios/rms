import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { paystackApi } from "./server/paystack";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [react(), paystackApi(env.PAYSTACK_SECRET_KEY, env.RMS_CONTENT_ORIGIN || "http://127.0.0.1:5175")],
    server: { proxy: {
      "/api/cms/published": { target: env.RMS_CONTENT_ORIGIN || "http://127.0.0.1:5175", changeOrigin: true },
      "/api/cms/checkouts": { target: env.RMS_CONTENT_ORIGIN || "http://127.0.0.1:5175", changeOrigin: true },
      "/api/cms/orders": { target: env.RMS_CONTENT_ORIGIN || "http://127.0.0.1:5175", changeOrigin: true },
      "/api/cms/consultations": { target: env.RMS_CONTENT_ORIGIN || "http://127.0.0.1:5175", changeOrigin: true },
      "/api/cms/account": { target: env.RMS_CONTENT_ORIGIN || "http://127.0.0.1:5175", changeOrigin: true },
      "/api/cms/newsletter": { target: env.RMS_CONTENT_ORIGIN || "http://127.0.0.1:5175", changeOrigin: true },
      "/uploads": { target: env.RMS_CONTENT_ORIGIN || "http://127.0.0.1:5175", changeOrigin: true },
      "/media": { target: env.RMS_CONTENT_ORIGIN || "http://127.0.0.1:5175", changeOrigin: true },
    } },
  };
});
