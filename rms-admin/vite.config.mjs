import { notificationConfig } from "./server/notifications/service.mjs";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { createApi } from "./server/api.mjs";
import { cloudinaryConfig } from "./server/cloudinary.mjs";
import { r2Config } from "./server/r2.mjs";
import { calendarConfig } from "./server/calendar.mjs";
import { createShippo } from "./server/shippo.mjs";
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
              r2: r2Config(env),
              onWorkerCreated: (timer) => {
                clearInterval(worker);
                worker = timer;
                server.httpServer?.once("close", () => clearInterval(timer));
              },
              notificationsConfig: notificationConfig(env),
              password: env.RMS_ADMIN_PASSWORD || undefined,
              supabase: {
                url: env.SUPABASE_URL,
                secret: env.SUPABASE_SECRET_KEY,
              },
              email: env.RMS_ADMIN_EMAIL || undefined,
              calendar: calendarConfig(env),
              shippo: createShippo(env),
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
