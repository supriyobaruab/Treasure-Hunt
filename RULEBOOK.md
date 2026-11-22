# Campus Quest — Treasure Hunt Rulebook

## 1. Overview

Campus Quest is a team-based QR treasure hunt. Each team races independently through the same 5 rounds, solving a riddle at each stop to find the next checkpoint and scanning its QR code to unlock the following clue.

## 2. Teams

- Each team logs in with a **Team ID** and **password** (e.g. `THT-001` / `team123`).
- A team has a roster of members, but **any member can scan** — there's no PIN or "pick your name" step. The team account itself, not an individual member, is what matters.
- Teams are registered by the organizer (admin) before the event, via **Teams** in the admin panel.

## 3. Rounds

- The hunt has **5 rounds**. Each round has a location, a riddle, and a point value (10 points by default).
- Rounds are the same for every team (same riddles, same locations) — what differs is the **QR code** placed at each location.

## 4. Per-team QR codes — how recognition works

This is the core mechanic: **every team gets its own unique QR code for every round.** Team A's Round 1 code is a different physical QR code than Team B's Round 1 code, even though both are placed near the same riddle's answer location (or in nearby, separate spots the organizer sets up for each team).

### Token format

Each QR code encodes a short text token with this pattern:

```
<TEAM-ID>-R<ROUND-NUMBER>
```

Examples:
- `THT-001-R1` → Team `THT-001`, Round 1
- `THT-001-R2` → Team `THT-001`, Round 2
- `THT-002-R1` → Team `THT-002`, Round 1

The token is **not stored anywhere** — it's computed on the fly from the team's ID and the round's number (`` `${team.id}-R${round.id}`.toUpperCase() ``). This means:
- No database of tokens to keep in sync.
- Any team + any round combination always has a predictable, valid code.
- The admin's "Checkpoints & QR codes" page generates these on demand — pick a team, and it renders that team's 5 QR codes (one per round) ready to print.

### How a scan is matched

When someone scans or types in a token, the app:

1. **Searches every team × every round combination** for one whose computed token (`<team.id>-R<round.id>`) matches what was scanned.
2. If nothing matches → *"That QR code is not recognized."*
3. If a match is found but it belongs to a **different team** than the one currently logged in → *"This QR code belongs to another team."* The scan is rejected — teams cannot use each other's QR codes, even if they find them.
4. If the match belongs to the **logged-in team** but isn't their current/next round (they're out of order, or skipped ahead) → *"This is not your next checkpoint. Follow the riddles in order."*
5. If the match belongs to the logged-in team but they've already completed that round → *"Your team has already completed this checkpoint."*
6. Otherwise → the round is marked complete, the team's score increases by that round's points, and they advance to the next round.

In short: **a QR code's team ownership is baked directly into the code itself** (via the team ID embedded in the token), so the system doesn't need a lookup table — it just recomputes what *should* be on each team's code and compares.

### Why this matters for setup

- When printing QR codes for a physical event, make sure **each team's codes go to that team's assigned path/locations only** — if Team A's Round 3 code ends up where Team B is searching, Team B's scan will be rejected with "This QR code belongs to another team," which will confuse players. Keep each team's QR set physically separate (e.g. color-coded or hidden at team-specific spots).
- If you add a new team mid-event, their QR codes for all 5 rounds are available immediately — no extra setup step, since tokens are generated, not stored.

## 5. Scoring

- Each round is worth its configured point value (10 by default).
- Total score = sum of points from completed rounds.
- The leaderboard ranks teams by score, then by number of rounds completed (as a tiebreaker).

## 6. Winning

- A team finishes the hunt once they've completed all 5 rounds.
- The team with the highest score (and fastest completion, if you choose to track time separately) wins.

## 7. Organizer setup checklist

1. **Create teams** (admin → Teams): set Team ID, name, password, and member names.
2. **Set up rounds** (admin → Checkpoints & QR codes): the 5 default rounds are seeded, or add/edit more as needed.
3. **Generate & print QR codes**: on the Checkpoints page, select each team one at a time and download its 5 PNG QR codes.
4. **Place QR codes**: physically place each team's codes at their designated round locations, keeping teams' codes separate from one another.
5. **Reset demo data** (admin → Overview → Reset demo) before the real event starts, to clear any test progress.
