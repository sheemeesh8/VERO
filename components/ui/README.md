# `components/ui` — reference React components (Zoom Parallax, Wheel Carousel)

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


---

## Wheel Carousel (`wheel-carousel.tsx`, `wheel-carousel-demo.tsx`)

Kept here as the **reference** for the requested 21st.dev component, exactly as
delivered. Like Zoom Parallax, it can't run in this repo as-is (no React, no
Tailwind, no `@/lib/utils`, and `framer-motion` / `next-themes` have no
`package.json` to be installed into). The demo is named `wheel-carousel-demo.tsx`
because `demo.tsx` already belongs to Zoom Parallax.

It ships as a **vanilla port**:

- `assets/wheel-carousel.js` — `VeroWheelCarousel(el, options)`: the same arc
  maths, drag / mouse-wheel / arrow-key input, momentum, snapping to the nearest
  item, edge fade and `prefers-reduced-motion` handling. framer-motion is replaced
  by a `requestAnimationFrame` loop; next-themes isn't needed (the site is light
  only, using the component's light palette).
- Two opt-in additions: `loop: false` runs the items in a line instead of round a
  circle, and `render(item, index)` draws each item's HTML.
- styles: the `.vwc*` rules in `assets/home.css`.

**Where it's used:** the feed's *What's on* calendar (`feed.html`). It carries the
coming 61 days as dates instead of words, with no photo panel, a yellow dot on a
day with events (`assets/events-data.js`), and the chosen day's events below.

To use the `.tsx` directly you'd need the React + TypeScript + Tailwind + shadcn
setup described above, plus:

```bash
npm install framer-motion next-themes
```

and a `ThemeProvider` from `next-themes` around the app (the component calls
`useTheme()`; with `mode="light"` / `"dark"` / `"custom"` the provider is optional).

---

## Lumina interactive list (`lumina-interactive-list.tsx`)

Kept here as the **reference** for the requested 21st.dev component, exactly as
delivered (demo: `lumina-interactive-list-demo.tsx`, since `demo.tsx` belongs to
Zoom Parallax). It can't run in this repo as-is: no React / TypeScript / Tailwind
build, and it loads GSAP and three.js r128 from cdnjs at runtime.

It ships as a **vanilla port**, `assets/lumina-hero.js` —
`VeroLumina(el, { slides, interval, duration, mono, mount, onChange })`:

- the same "glass bubble" WebGL transition (the component's glass shader — its
  other effects were only cross-fade stubs), the per-slide letter entrances
  (six, as in the component), the counter and the progress-line navigation;
- **no three.js or GSAP**: one full-screen quad on raw WebGL1, tweens on
  `requestAnimationFrame`, letter entrances in CSS — about 12 KB instead of
  ~600 KB of libraries, and it draws only while a transition runs;
- pauses off screen and in background tabs; cross-fades without WebGL or with
  `prefers-reduced-motion`; `mono: true` renders the photos black and white.
- styles: `assets/lumina-hero.css` (shared), placed per page in `assets/home.css` (`.hm-lu*`) and `events.html`.

**Where it's used:** the home feed's hero (`feed.html` — welcome / the
collection / new arrivals, replacing the old video slider) and the events
page's opening hero (`events.html`). The slides
are the next six events (title → the event's page, date · time · place as the
description) over the site's own editorial photos in `assets/hero/` — no
external images. The index.css tokens from the prompt (`--color-bg`,
`--color-accent`, PP Neue Montreal …) aren't added: the hero uses the site's
own palette and type.

To use the `.tsx` directly you'd need the React + TypeScript + Tailwind + shadcn
setup described above, plus `npm install tw-animate-css` for the `@import` in
the prompt's index.css, and the component's own CSS for `.slider-wrapper`,
`.slide-*` and `.slides-navigation` (not included in the prompt).
