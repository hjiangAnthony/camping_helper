# Camping Helper

Public, mobile-first trip page for camping and road-trip planning.

Current trip: **Eastern Sierra · Oct 9–11, 2026**

- SJC → CA-120 / Tioga Pass → Oh Ridge Campground
- June Lake Loop
- Mammoth Lakes Basin
- Return via Tioga Pass

## Structure

- `trip-data.json` — canonical trip content
- `index.html` — page shell
- `styles.css` — responsive visual design
- `app.js` — rendering, day tabs, place/map interactions
- `dev/` — development scope and reusable skill notes
- `archive/route-comparison-osm.html` — archived earlier OSM route-comparison prototype

## Maps

The current page uses Google Maps embed URLs and Google Maps URLs for place preview and navigation. This does **not** require a stored API key.

The next map upgrade can use Google Maps JavaScript API for markers, InfoWindows, and richer route interactions. Any browser API key should be restricted to the GitHub Pages origin and to the specific enabled Maps APIs.

## Hosting

GitHub Pages deploys from `main` through `.github/workflows/pages.yml`.
