# Travel Page Skill — Reusable Notes

This document records the parts of **Travel-Plan-Page** that are useful for this project.

It is a condensed engineering summary, not a verbatim copy of the upstream skill.

Source:

- https://github.com/do-tongxue/Travel-Plan-Page
- reviewed commit: `ed869d21b19b7afb4a33fef97715c1091f087563`

## Useful ideas to retain

### Structured input first

The strongest reusable idea is to make one structured trip-data file the source of truth.

Benefits:

- easy to regenerate UI
- easier to validate
- easier to edit future trips
- map and itinerary can share place IDs
- reduces duplicate hardcoded facts

For this project, use a simplified schema rather than copying the full upstream schema.

### Separate trip facts from UI framework

Trip-specific changes should usually modify data, not framework code.

Framework code should handle:

- itinerary rendering
- date formatting
- map marker creation
- filtering/highlighting
- responsive navigation
- public external links

Trip data should handle:

- title/dates
- places
- coordinates
- day schedules
- route membership
- public notes

### Stable place IDs

Every place should have a stable ID.

Example:

```json
{
  "id": "convict-lake",
  "name": "Convict Lake",
  "lat": 37.5947,
  "lng": -118.852
}
```

Itinerary items should reference the ID instead of duplicating coordinates and map metadata.

This makes it possible for a click on an itinerary item to:

- select a map marker
- pan/zoom the map
- open the corresponding info window
- highlight the day's route

### Itinerary structure

A day should be a first-class object, with ordered schedule items.

Prefer:

```json
{
  "date": "2026-10-03",
  "title": "Fall-color day",
  "items": [
    {
      "time": "08:00",
      "type": "drive",
      "text": "Drive to Rock Creek",
      "placeId": "rock-creek"
    }
  ]
}
```

Do not infer extra To-Dos or facts that were not part of the actual plan.

### Mobile-first rendering

Useful UI conventions from the upstream project:

- concise hero/header
- day cards
- expandable details
- visually clear timestamps
- route/place labels
- map interaction available without dominating the itinerary
- simple static assets with minimal runtime complexity

### Local-first state

If editable browser state is added later, default to local browser storage.

Do not add cloud persistence unless it solves a real requested problem.

For the current project there is no need for shared runtime state.

## Google Maps adaptation

The upstream project mostly uses Google Maps URLs / iframe embeds.

For `camping_helper`, use the same user-facing principle but upgrade the main map to Google Maps JavaScript API.

### Main map

Use Maps JavaScript API for:

- map canvas
- markers
- info windows
- marker/day selection
- route overlays if useful

### External navigation

Use Google Maps URLs for opening navigation/search in the Google Maps app/site.

Google Maps URLs do not require an API key.

Typical search pattern:

```text
https://www.google.com/maps/search/?api=1&query=<encoded query>
```

Prefer place-specific URLs/IDs when available.

### Key handling

A browser Maps API key is visible to users by design.

Required protection:

- restrict by HTTP referrer
- restrict to required Maps APIs
- monitor usage/quota
- rotate if restrictions are misconfigured or abused

Do not embed unrestricted general-purpose Google Cloud credentials.

## Third-party/network behavior

Expected network behavior for the intended implementation:

### Google

When the interactive map is loaded, browser requests go to Google Maps infrastructure.

Map queries, coordinates, and normal browser/network metadata may be sent to Google as part of map operation.

This is accepted for the current project.

### No automatic cloud database

Do not include the upstream optional Cloudflare D1 mode.

The reviewed upstream code only sends runtime data to D1 when explicitly configured for D1 mode; this project will not enable that path.

### No analytics by default

Do not add Google Analytics, telemetry, trackers, or similar services unless explicitly requested.

## Privacy decisions for this repository

The site is public and current planned content is non-sensitive.

Allowed:

- scenic destinations
- campground names
- trip dates
- coordinates
- public driving plans
- public day schedules

Not allowed without a separate decision:

- reservation identifiers
- PINs
- private tickets
- personal contact details
- private documents
- authentication tokens

## What not to import from the upstream project

Do not bring in complexity that is not needed:

- ledger
- Cloudflare D1 functions
- migration/database code
- ticket/PDF subsystem
- large country/province boundary library
- fixed decorative map-template system
- advanced data migration framework
- legacy compatibility layers

The goal is to reuse the good generation and information-architecture ideas while keeping this repository small.
