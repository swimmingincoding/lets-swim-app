# World Aquatics Masters PWA Architecture & Rules

## 1. Data Pipeline
- Script: `scripts/parse_pdf.py` using PyMuPDF (`fitz`).
- Entry lists (`SWM_EntryList MEN.pdf`, `WOMEN.pdf`) contain seed times, clubs, and birth years but no competition dates/times.
- Official timeline document (`SW TIMELINE rev 030825 FINAL .pdf`) dictates true dates, starting times, sessions, and venues.
- Mapping: When new entry lists or timelines are provided, update `EVENT_SCHEDULE_MAP` and bump `version` in metadata.
- Output: `public/data/masters_data.json` (and edition-specific files like `masters_data_budapest_2027.json`).
- Sorting: Individual athlete entries must always be chronologically sorted (`day` ➡️ `time_est` ➡️ `order`), never arbitrary PDF order.

## 2. Cache Invariants & Offline PWA
- `CURRENT_DATA_VERSION` in `src/storage.js` must match the data version in `masters_data.json`.
- On startup, if `localData.metadata?.version !== CURRENT_DATA_VERSION`, purge stale IndexedDB and fetch fresh data via Network-First strategy (`cache: 'reload'`).
- Service Worker must precache built bundles (`dist/assets/index-*.js`, `css`) and use Network-First for JSON datasets.
- Provide a one-tap manual sync button (`🔄 동기화`) in UI for emergency client cache resets.
- Clean up legacy databases (e.g., `AquaMastersDB`) when migrating schemas.

## 3. UI & Design System
- Theme: World Aquatics Championship (Deep pool navy `#051329` ~ `#0a254a`, crystal azure `#38bdf8`, starting-block tabs, water-wave flow ribbon).
- Athlete cards must display entries in ascending chronological order (`day` and `time_est`).
- Multi-championship switcher in header allows switching between editions (e.g., 2025 Singapore archive vs 2027 Budapest upcoming).

## 4. Branding & Search Rules
- App Name: `Lets Swim World Masters` (Short name: `Lets Swim`).
- Club Priority: `★ LETS SWIM` (수영하자) must always lead quick filter chips.
- Search Synonym Engine: Korean club names (`수영하자`, `스윔온`, `매드88`) and lastnames (including `류` -> `RYU`, `김` -> `KIM`, `박` -> `PARK`, etc.) must map to official English team and athlete names.
