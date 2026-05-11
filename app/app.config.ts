import { defineConfig } from "@solidjs/start/config";
import tsconfigPaths from "vite-tsconfig-paths";
import lucidePreprocess from "vite-plugin-lucide-preprocess";
import {
  DESIGN_SYSTEM_COLORS_KEY,
  DESIGN_SYSTEM_EFFECTS_KEY,
  DESIGN_SYSTEM_LAYOUT_KEY,
  DESIGN_SYSTEM_MOTION_KEY,
  DESIGN_SYSTEM_TYPOGRAPHY_KEY,
  DOCS_ONLY_COMPONENT_LINKS,
  ERROR_OVERLAY_COMPONENT_KEY,
  SIMPLE_COMPONENT_LINKS,
} from "./src/components/comps-explorer/compsExplorer.shared";
import { recipes } from "./src/theme/recipes";

const basePath = process.env.BASE_PATH?.trim();
const forceSsgPrerender = process.env.CI_SSG_PRERENDER === "true";
const normalizedBasePath =
  !basePath || basePath === "/"
    ? "/"
    : `/${basePath.replace(/^\/+|\/+$/g, "")}/`;

const recipeComponentKeys = Object.keys(recipes).map((key) =>
  key === "switchRecipe" ? "switch" : key,
);
const componentExplorerKeys = Array.from(
  new Set([
    DESIGN_SYSTEM_COLORS_KEY,
    DESIGN_SYSTEM_LAYOUT_KEY,
    DESIGN_SYSTEM_TYPOGRAPHY_KEY,
    DESIGN_SYSTEM_MOTION_KEY,
    DESIGN_SYSTEM_EFFECTS_KEY,
    ERROR_OVERLAY_COMPONENT_KEY,
    ...SIMPLE_COMPONENT_LINKS.map((item) => item.key),
    ...DOCS_ONLY_COMPONENT_LINKS.map((item) => item.key),
    ...recipeComponentKeys,
  ]),
);
const componentExplorerRoutes = componentExplorerKeys.map(
  (componentKey) => `/comps/${componentKey}`,
);
const ciPrerenderConfig = forceSsgPrerender
  ? {
      routes: ["/", "/comps", ...componentExplorerRoutes],
      crawlLinks: true,
    }
  : undefined;

export default defineConfig({
  server: {
    experimental: {
      websocket: true,
    },
    baseURL: normalizedBasePath,
    ...(ciPrerenderConfig ? { prerender: ciPrerenderConfig } : {}),
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
