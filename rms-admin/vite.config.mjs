import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { createApi } from './server/api.mjs';
import { cloudinaryConfig } from './server/cloudinary.mjs';
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return { plugins: [react(), { name: 'rms-content-api', configureServer(server) { server.middlewares.use(createApi({ cloudinary: cloudinaryConfig(env) })); } }] };
});
