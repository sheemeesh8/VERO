# `components/ui` — Zoom Parallax

## Important: this repo is **not** a shadcn / React / TypeScript project

VERO is a **static, vanilla HTML + CSS + JavaScript** site. There is no
`package.json`, no bundler, no Tailwind and no TypeScript toolchain. The React
files in this folder (`zoom-parallax.tsx`, `demo.tsx`) are kept **only as the
canonical reference** for the component that was requested, so the design intent
stays documented in one place.

The effect is actually shipped to the live site as a **vanilla port**:

- `zoom-parallax.css` (repo root) — styling + tile positions
- `zoom-parallax.js`  (repo root) — scroll-driven scaling (replaces framer-motion)
- wired into `feed.html` to drive the **hero → feed** transition.

If you ever want to pull in more 21st.dev / shadcn components and use the
original `.tsx` files directly, set up a proper project first:

### Why `components/ui`?

shadcn's convention puts primitives in `components/ui` and the CLI writes there
by default (`aliases.ui` in `components.json`). Keeping that exact path means any
future `npx shadcn@latest add <component>` drops files next to these without
extra config, and imports like `@/components/ui/zoom-parallax` resolve the way
every shadcn tutorial and generator expects.

### Setup (only needed if you migrate to a React build)

```bash
# 1. Scaffold a TypeScript + Tailwind app (Vite example)
npm create vite@latest vero-app -- --template react-ts
cd vero-app

# 2. Tailwind
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# 3. shadcn
npx shadcn@latest init            # choose: components -> components/ui

# 4. Dependencies used by this component
npm install framer-motion @studio-freight/lenis clsx tailwind-merge
```

Then set the `@/*` path alias in `tsconfig.json` so `@/components/ui/...` and
`@/lib/utils` resolve.
