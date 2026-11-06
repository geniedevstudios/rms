import { notificationConfig } from "./server/notifications/service.mjs";
import { resolve } from "node:path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { createApi } from "./server/api.mjs";
import { cloudinaryConfig } from "./server/cloudinary.mjs";
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [
      react(),
      {
        name: "rms-content-api",
        configureServer(server) {
          let worker;
          server.middlewares.use(
            createApi({
              cloudinary: cloudinaryConfig(env),
              onWorkerCreated: (timer) => {
                clearInterval(worker);
                worker = timer;
                server.httpServer?.once("close", () => clearInterval(timer));
              },
              notificationsConfig: notificationConfig({ ...env, PAYSTACK_SECRET_KEY: env.PAYSTACK_SECRET_KEY || loadEnv(mode, resolve(process.cwd(), "../rms-app"), "PAYSTACK_").PAYSTACK_SECRET_KEY }),
              password: env.RMS_ADMIN_PASSWORD || undefined,
              supabase: {
                url: env.SUPABASE_URL || loadEnv(mode, resolve(process.cwd(), "../rms-app"), "VITE_SUPABASE_").VITE_SUPABASE_URL,
                secret: env.SUPABASE_SECRET_KEY,
              },
              email: env.RMS_ADMIN_EMAIL || undefined,
              resend:
                env.RESEND_API_KEY && env.RESEND_FROM
                  ? { apiKey: env.RESEND_API_KEY, from: env.RESEND_FROM }
                  : null,
            }),
          );
        },
      },
    ],
  };
});
