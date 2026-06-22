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
Gated by a **real Firebase Auth account** — no password in the source. Staff sign
in with a **username + password** (no email). Firebase's email/password provider
needs an email-format id, so the page appends a fixed internal domain
(`@brookhill-staff.local`, set in `staff.html` as `USER_DOMAIN`) behind the
scenes — no real email is involved or shown. A single account signs in;
`onAuthStateChanged` decides whether the dashboard shows. Lists every upcoming
session per category with the roster of who's reserved (name + group), updating
live. Merges `data.js` (so empty sessions still show) with the `rsvps` snapshot.
Linked discreetly from the hub footer and `noindex`'d. Sign out via the topbar.

**One-time setup** (Firebase console → project `brookhill-disco-2026`):
1. **Authentication → Sign-in method → Email/Password → Enable.**
2. **Authentication → Users → Add user** → for the email enter
   `<username>@brookhill-staff.local` (e.g. `brookhill@brookhill-staff.local`),
   and set a password.

Staff then log in with just that `<username>` and password. That account is the
only way into the dashboard.

> ⚠️ Still to do (see ROADMAP): the reservation docs remain **publicly readable**
> by Firestore rules — the public schedule pages and the disco DJ dashboard rely
> on that. They hold first names + group only (no DOB). Real login closes the
> front door; making the name data itself staff-only is the next step and would
> also touch the shared rules the disco app uses.

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
