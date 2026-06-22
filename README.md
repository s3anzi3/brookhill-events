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
