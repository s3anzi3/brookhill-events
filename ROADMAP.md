# Brook Hill Events — Roadmap

The hub is live with roster-verified reservations on Recreation and Social Rooms.
This is the running list of what could come next, roughly in priority order.

## Near term
- [ ] **DJ/staff reservation dashboard** — a password-gated page (reuse the disco
      portal's "tap logo 5×" + password pattern) that lists each session with its
      roster of who reserved. Reads `sessions/*/rsvps` via `collectionGroup`.
- [ ] **Capacity caps + waitlist** — optional `max` per session in `data.js`; lock
      the button when full, offer a waitlist slot.
- [ ] **Cancel confirmation** — a small "Cancel your spot?" confirm instead of the
      current one-tap toggle, to avoid accidental cancels.
- [ ] **Per-session detail** — what's actually happening (e.g. "3v3 basketball",
      "movie night: TBD"). Add a `title`/`desc` field to `data.js` slots.

## Medium term
- [ ] **More categories** — activate the ✨ "More to come" hub card for new event
      types (trips, workshops). Each is a schedule page + `data.js` block; the
      reservation plumbing is already generic (just pass a new `category`).
- [ ] **Auto-regenerate `data.js`** — script the export from St. John's Master
      Program.xlsx (ActivityCalendar tab) so schedule changes are one command.
      Source: `Desktop\Work Summer 2026\Source`.
- [ ] **"My reservations" view** — show a checked-in student everything they've
      reserved across categories, with quick cancel.
- [ ] **Reminders** — opt-in day-of notification (would need email/SMS or web push).

## Hardening / nice-to-have
- [ ] **Real staff auth** — the disco portal password is client-side; if the
      dashboard ships, gate writes/reads on Firebase Auth.
- [ ] **Rules consolidation** — the `sessions/*/rsvps` rules live in the disco repo
      (shared DB). Consider a single source-of-truth rules file if this grows.
- [ ] **Analytics** — simple count of reservations per session over time.

## Notes
- Reservations reuse the disco app's `verifyStudent` Cloud Function and the shared
  `brookhill-disco-2026` Firestore. See `README.md` for the architecture.
- Roster groups currently: `1C-NIA`, `1G`. Coverage window 2026-06-17 → 06-30 per
  the disco roster; extend `functions/roster.js` in the disco repo if it grows.
