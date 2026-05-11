import { defineConfig } from "@solidjs/start/config";
import tsconfigPaths from "vite-tsconfig-paths";
import lucidePreprocess from "vite-plugin-lucide-preprocess";

const basePath = process.env.BASE_PATH?.trim();
const normalizedBasePath =
  !basePath || basePath === "/"
    ? "/"
    : `/${basePath.replace(/^\/+|\/+$/g, "")}/`;

export default defineConfig({
  server: {
    experimental: {
      websocket: true,
    },
    baseURL: normalizedBasePath,
  },
  vite: {
    plugins: [lucidePreprocess(), tsconfigPaths()],
    optimizeDeps: {
      // these are required for solid-markdown to work
      include: ["solid-markdown > micromark", "solid-markdown > unified"],
    },
  },
}).addRouter({
  name: "ws",
  type: "http",
  handler: "./src/ws/jobs.ts",
  target: "server",
  base: "/ws/jobs",
});
