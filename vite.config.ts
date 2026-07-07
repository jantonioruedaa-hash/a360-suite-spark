// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

const backendUrl = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "https://iwvcecgmuhwtfjofookx.supabase.co";
const backendPublishableKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_PUBLISHABLE_KEY ?? "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3dmNlY2dtdWh3dGZqb2Zvb2t4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5NDcwMTMsImV4cCI6MjA5MzUyMzAxM30.4KEifzpG__JeXpL7OfypMR2WLz7179yhcoaUKfQFWjQ";

export default defineConfig({
  // nitro: preset tells the Nitro deploy plugin which runtime to target at build time.
  // "vercel" → outputs to .vercel/output/ (picked up automatically by Vercel CI/CD).
  nitro: { preset: "node-server" },
  vite: {
    define: {
      "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(backendUrl),
      "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(backendPublishableKey),
    },
  },
});
