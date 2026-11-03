import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { paystackApi } from "./server/paystack";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [react(), paystackApi(env.PAYSTACK_SECRET_KEY)],
  };
});
