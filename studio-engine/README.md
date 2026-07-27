# VERO Studio Engine (standalone / spec-literal)

This folder is the **server-side + React** implementation of the two features,
matching the original specification (Node/`sharp` + Photoroom/Remove.bg for the
studio cover, a React `<PhotoGuide/>` for the shot guide).

> The **live VERO site is a vanilla static site** and already ships working,
> in-browser equivalents that need no server or API key:
> - `../studio.js` — studio cover engine (background removal via
>   `@imgly/background-removal`, canvas compositing) wired into the upload flow.
> - `../photo-guide.js` — `<vero-photo-guide>` web component, mounted in the
>   category chooser ("Guide" card) and the upload photo step.
>
> Use **this** folder if/when a backend + build pipeline exists. The two
> implementations share the same schema, dimensions, padding and shadow values.

## Feature 1 — Studio Background Engine

Pipeline: `removeBackground()` → `composeStudioCover()`.

- **Canvas:** `1080×1350` (4:5) or `1200×1200` (1:1)
- **Ground:** `#F4F4F2`
- **Padding:** 15% of the shorter edge, subject centred
- **Contact shadow:** black silhouette, blur `18`, opacity `0.18`, y-offset `+12`
- **Output:** `{ ok, processed_cover, original_cover }` (data URLs) — store both;
  the UI toggle flips between them.

### Run the API

```bash
cd studio-engine
npm install
PHOTOROOM_API_KEY=your_key npm start      # or REMOVEBG_API_KEY=your_key
```

```bash
curl -F "image=@piece.jpg" -F "ratio=4:5" \
     http://localhost:3001/api/studio-cover
```

Files:
- `src/removeBackground.js` — Photoroom / Remove.bg integration (provider chosen
  by which API key is set).
- `src/studioEngine.js` — `composeStudioCover()` + `buildProductCover()` (sharp).
- `src/server.js` — Express `POST /api/studio-cover`.

## Feature 2 — `<PhotoGuide/>` (React)

```jsx
import PhotoGuide from './react/PhotoGuide.jsx';

<PhotoGuide category={selectedCategory} filled={photos.length} />
// or precise: <PhotoGuide category="bags" done={[0, 2]} />
```

- `react/photoGuideData.js` — the six-category schema + three core tips.
- `react/PhotoGuide.jsx` — collapsible drawer; renders the shot slots for the
  current category with completed/missing cues.
- `react/PhotoGuide.css` — styles.

## Parity with the live site

| Spec value            | Both implementations |
|-----------------------|----------------------|
| Canvas 4:5 / 1:1      | 1080×1350 / 1200×1200 |
| Ground                | `#F4F4F2`            |
| Padding               | 15%                  |
| Shadow                | opacity 0.18, y +12, blur 18 |
| Guide categories      | shoes, tops, outerwear, bags, bottoms, accessories |
