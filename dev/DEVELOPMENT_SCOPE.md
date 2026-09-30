# Camping Helper — Development Scope

## Goal

Build a lightweight public travel-planning website for camping / road-trip planning.

The site should be easy to update from structured trip data and optimized for mobile use during a trip.

## Current use case

Eastern Sierra fall trip planning around:

- US-120 / Tioga Pass
- US-108 / Sonora Pass
- US-395
- June Lake / Oh Ridge
- nearby scenic stops and day plans

The architecture should remain generic enough to support future camping trips.

## In scope

### 1. Data-driven travel page

Use a structured data file as the source of truth instead of hardcoding trip content into HTML.

Preferred responsibilities:

- `trip-data.json`: trip facts, places, days, route metadata
- `index.html`: page shell
- `styles.css`: presentation
- `app.js`: rendering and interaction
- map-related JS: Google Maps integration

Public trip data may include:

- attraction / campground names
- latitude / longitude
- dates
- day-by-day schedules
- public notes
- driving legs
- public URLs

### 2. Mobile-first trip UI

Borrow the useful presentation ideas from Travel-Plan-Page:

- compact trip hero
- daily itinerary timeline
- collapsible day cards
- clear place labels
- map + itinerary coordination
- lightweight responsive layout
- fast static hosting

Do not duplicate the upstream visual system mechanically; adapt it for this project.

### 3. Google Maps

Primary map implementation should use Google Maps rather than static diagram templates.

Expected capabilities:

- interactive map
- markers for places
- marker info windows
- route / day grouping
- links that open Google Maps navigation/search
- optional Directions/Routes integration if needed later

Maps JavaScript API will require a browser-visible API key.

Security requirements for the key:

- HTTP referrer restriction to the production site, e.g. `https://hjianganthony.github.io/camping_helper/*`
- API restriction to only the enabled Google Maps APIs
- never use an unrestricted Google Cloud API key
- do not treat the browser key as a secret; treat restrictions as the security boundary

Start with Maps JavaScript API only. Add Places or Routes APIs only when functionality actually needs them.

### 4. GitHub Pages deployment

Target deployment:

- repository: `hjiangAnthony/camping_helper`
- production branch: `main`
- hosting: GitHub Pages
- public site

Static deployment is preferred. Avoid unnecessary backend services.

## Explicitly out of scope for now

Do not add these unless requested later:

- Cloudflare D1
- shared/multi-user database state
- ledger / expense splitting
- ticket/PDF storage
- booking confirmations
- reservation numbers
- personal contact information
- authentication
- analytics / telemetry
- hidden third-party data collection
- complex CMS/admin UI

## Privacy model

The repository and published site are public.

Current accepted public content:

- attractions
- campground names
- coordinates
- route information
- trip schedule
- general trip notes

Do not commit:

- API secrets
- unrestricted API keys
- passwords
- private keys
- booking PINs
- confirmation numbers
- personal phone/email
- private PDFs
- government IDs
- other sensitive personal data

Third-party requests that are expected:

- Google Maps requests when maps are loaded or used
- normal GitHub Pages asset delivery

Any new third-party service that receives trip data should be called out before being added.

## Engineering principles

1. Keep trip facts separate from rendering logic.
2. Prefer static hosting and browser-side rendering.
3. Keep the public dependency surface small.
4. Avoid remote scripts unless they are necessary and trusted.
5. Make external network behavior obvious in code.
6. Keep map integration replaceable behind a small adapter/module.
7. Keep place IDs stable so map markers and itinerary items can reference the same place.
8. Do not duplicate the same trip facts in multiple files unless generated automatically.

## Suggested data shape

```json
{
  "trip": {
    "title": "Eastern Sierra Fall Trip",
    "startDate": "2026-10-02",
    "endDate": "2026-10-04"
  },
  "places": [
    {
      "id": "oh-ridge",
      "name": "Oh Ridge Campground",
      "lat": 37.7992,
      "lng": -119.0713
    }
  ],
  "days": [
    {
      "date": "2026-10-03",
      "title": "June Lake / fall color day",
      "items": []
    }
  ]
}
```

## Near-term implementation plan

1. Preserve the existing working route-map deployment.
2. Refactor page assets into separate files if needed.
3. Introduce `trip-data.json` as the canonical trip-content source.
4. Build itinerary rendering from structured data.
5. Replace the current Leaflet map with Google Maps JavaScript API.
6. Add shared place IDs between itinerary items and map markers.
7. Add per-day map filtering/highlighting.
8. Validate mobile layout.
9. Keep GitHub Pages deployment automatic from `main`.
