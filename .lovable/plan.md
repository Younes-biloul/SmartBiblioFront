## Plan

### 1. Import the repo
- Download the GitHub repo `Younes-biloul/smart-biblio-viz` as a tarball via `curl` to `/tmp` and extract it.
- The source repo is a Vite + React + React Router app. The current project is a TanStack Start scaffold. To preserve the source app's logic exactly, replace the TanStack scaffold with the Vite/React Router setup from the repo:
  - Copy `src/`, `public/`, `index.html`, `vite.config.ts`, `tailwind.config.*`, `postcss.config.*`, `components.json`, `tsconfig*.json`, `eslint.config.*` from the repo into the project.
  - Replace `package.json` with the repo's (keeping the project name) and install deps with `bun install`.
  - Remove TanStack-only files: `src/routes/`, `src/router.tsx`, `src/start.ts`, `src/server.ts`, `src/routeTree.gen.ts`, `src/lib/api/`, `src/lib/config.server.ts`, `.lovable/project.json` template hint stays.
- Do NOT modify any app logic, components, hooks, or routes after the copy.

### 2. Add i18n (i18next + react-i18next)
- Install: `i18next`, `react-i18next`, `i18next-browser-languagedetector`.
- Create `src/i18n/index.ts` initializing i18next with:
  - `fallbackLng: "en"`, `lng: "en"` (English as default)
  - Resources for `en`, `fr`, `ar`
  - Language detector configured but defaulting to English on first load
- Create translation JSON files: `src/i18n/locales/en.json`, `fr.json`, `ar.json` containing every user-facing string found in the copied app (headings, buttons, labels, placeholders, toasts, nav, table headers, empty states, etc.).
- Import `./i18n` in `src/main.tsx` once so it initializes app-wide.
- Replace hardcoded strings throughout components with `const { t } = useTranslation(); t("key")` — no logic changes, only string swaps.
- Add a small language switcher component (dropdown with EN / FR / AR) and place it where the existing app already has a header/nav. When Arabic is selected, set `document.documentElement.dir = "rtl"`; otherwise `"ltr"`.

### 3. Force light mode
- Ensure `<html>` does not carry the `dark` class on load. If the repo has a theme provider (e.g. `next-themes`), set `defaultTheme="light"` and `enableSystem={false}`. Otherwise remove any `dark` class from `index.html` / root.

### 4. Verify
- Run the build (auto) and load the preview.
- Confirm: app renders in English + light mode by default, switching to FR translates strings, switching to AR translates + flips to RTL, and no app behavior changed.

### Technical notes
- The current project's `.lovable/project.json` says `tanstack_start_ts_2026-06-08`. Replacing the framework files works fine — Lovable serves whatever `package.json` + `vite.config.ts` define.
- Translation key scheme: namespaced by area, e.g. `nav.home`, `dashboard.title`, `book.addButton`, `toast.saveSuccess`.
- Arabic font: rely on system fonts unless the repo already loads one.

### Open question
The repo contents are unknown until cloned. If after extraction the app uses Supabase, env vars, or other backend pieces, I will copy those configs verbatim but will NOT wire new secrets — I'll flag anything missing for you to provide.
