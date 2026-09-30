# Camping Helper

Public, mobile-first trip page for the June Lake / Mammoth camping trip.

Current trip: **June Lake / Mammoth · Oct 9–11, 2026**

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

The page uses Leaflet with the standard OpenStreetMap basemap for a lightweight day-by-day route overview.

- Day routes are schematic polylines connecting the planned stops in fixed order.
- They are intentionally not turn-by-turn navigation.
- Existing Google Maps links remain the source for actual driving navigation.
- No Google Maps API key is required.

## Hosting

GitHub Pages deploys from `main` through `.github/workflows/pages.yml`.
