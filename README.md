# Brook Hill Events

The umbrella hub for **The Brook Hill Alliance** summer events. A single landing
page that routes students to each category.

Live: https://brookhill-events.web.app
Project: `brookhill-disco-2026` (separate Hosting site `brookhill-events`)

## Sections
| Card | Status | Links to |
|---|---|---|
| 🪩 Discos | Live | https://brookhill-disco-2026.web.app/ |
| 🏀 Recreation | Coming soon | — |
| 🎲 Social Games | Coming soon | — |
| ✨ More to come | Placeholder | — |

Static site (plain HTML/CSS, no build step). To add or activate a section, edit
the relevant `.card` in `public/index.html`: give it the `live` class, wrap it in
an `<a href="…">`, and swap the pill to `pill go` / `● Live`.

## Deploy
```bash
firebase deploy --only hosting
```
