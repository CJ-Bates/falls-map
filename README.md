# The Falls at Lions Den — Guest Map

A mobile-first PWA that helps guests of [The Falls at Lions Den](https://www.thefallsatlionsden.com/) navigate the property — cabins, lakes, trails, firepits, pavilions, and more.

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS 4** for styling
- **MapLibre GL JS 5** for the map
- Deployed on **Vercel**

## Local development

```bash
npm install
npm run dev
# open http://localhost:3000
```

## Project layout

```
src/
  app/          # routes (page.tsx is the map)
  components/   # PropertyMap, DetailPanel
  data/         # cabins, pois, property — the content layer
public/
  manifest.webmanifest   # PWA manifest
```

Content is hand-edited in `src/data/`. Photos are pulled live from the booking platform's CDN.

## Roadmap

- v0.1 (current): Map view with cabin + POI pins, GPS, detail panels
- v0.2: Illustrated map overlay, /cabins, /trails, /manual screens, offline cache
- v1.0: Direct booking, in-app concierge, local guide

Built with care by Claude + CJ Bates, May 2026.
