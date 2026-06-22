# Brook Hill Events

The umbrella hub for **The Brook Hill Alliance** summer events. A single landing
page that routes students to each category.

Live: https://brookhill-events.web.app
Project: `brookhill-disco-2026` (separate Hosting site `brookhill-events`)

## Sections
| Card | Status | Links to |
|---|---|---|
| 🪩 Discos | Live | https://brookhill-disco-2026.web.app/ |
| 🏀 Recreation | Live + reservations | `recreation.html` |
| 🎲 Social Rooms | Live + reservations | `social-rooms.html` |
| ✨ More to come | Placeholder | — |

Static site (plain HTML/CSS, no build step). To add or activate a section, edit
the relevant `.card` in `public/index.html`: give it the `live` class, wrap it in
an `<a href="…">`, and swap the pill to `pill go` / `● Live`.

## Reservations (roster check-in)
Recreation and Social Rooms sessions show a live "going" count and a **Reserve a
spot** button. Reserving verifies the student SERVER-SIDE against the camp roster:

- `public/reserve.js` collects first name + DOB (+ optional group) and calls the
  disco app's already-deployed `verifyStudent` Cloud Function. The roster never
  reaches the browser.
- On a match it writes `sessions/{sessionId}/rsvps/{studentId}` in the **shared**
  `brookhill-disco-2026` Firestore (`public/firebase-config.js` — not secret).
- One `collectionGroup('rsvps')` listener drives the live counts per page.
- A student who already checked in (here or in the disco app) is remembered via
  `localStorage` and reserves in one tap; tapping again cancels.

`sessionId` = `category_date_time` (e.g. `recreation_2026-06-24_25pm`), computed
identically in `reserve.js` and `schedule.js`.

### My Reservations (`my-reservations.html`)
A student sees everything they've reserved across categories, with one-tap
**Cancel spot**. Linked from the hub and from each schedule page's topbar. If the
device isn't checked in yet, it offers a roster check-in (`BHAReserve.identify`).
Filters `collectionGroup('rsvps')` by the remembered `studentId` + `status: going`.

### Staff dashboard (`staff.html`)
Password-gated (`hoboken`, stored in `localStorage`) page listing every upcoming
session per category with the roster of who's reserved (name + group), updating
live. Merges `data.js` (so empty sessions still show) with the `rsvps` snapshot.
Linked discreetly from the hub footer and `noindex`'d.

> ⚠️ The gate is **client-side convenience, not security** — same posture as the
> disco DJ portal. Reservation docs are publicly readable by Firestore rules and
> hold first names + group only (no DOB). Keep the staff link off public posters.

### ⚠️ Security rules live in the disco repo
The `sessions/*/rsvps` write rules were added to **`brookhill-disco/firestore.rules`**
(same database). They must be deployed from that repo, or reservations are denied:
```bash
cd ../brookhill-disco
firebase deploy --only firestore:rules
```

## Deploy
```bash
firebase deploy --only hosting          # from this repo (brookhill-events)
```
