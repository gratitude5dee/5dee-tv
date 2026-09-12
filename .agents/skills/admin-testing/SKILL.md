---
name: test-5dee-admin-unconfigured
description: Test 5dee-tv dashboard missing-configuration states safely without spending FAL credits.
---

# Safe unconfigured admin testing

1. Inspect environment-variable presence (names/booleans only) and `dashboard/.env*`. Shared machines may inherit FAL_KEY even when the repo has no environment files.
2. Launch the dashboard from `dashboard/` with a free port. For missing-configuration tests explicitly unset FAL_KEY, NEXT_PUBLIC_CONVEX_URL, TWITCH_CLIENT_ID, TWITCH_CLIENT_SECRET, TWITCH_CHANNEL, NEXT_PUBLIC_TWITCH_CHANNEL, NEXT_PUBLIC_FAL_API_URL, CF_ACCESS_TEAM_DOMAIN, CF_ACCESS_AUD and ADMIN_AUTH_MODE in that process. Check env files cannot restore them.
3. Middleware behavior depends on server mode, so test the mode that matches the claim. The dev script permits unauthenticated access; a production `build` plus `start` fails closed with 401 on `/admin/**` and `/api/**` and names the required variables. `ADMIN_AUTH_MODE=edge-only` restores 200 and lets API routes return their own missing-credential responses, so pair both runs to prove the gate rather than a routing accident.
4. Killing the shell that ran the dev/start script can leave the Next child listening. When a restart reports EADDRINUSE, locate the `next-server` child of the owned `npm run` tree, confirm its working directory, and terminate that tree. Verify auth-mode variables by reading the new server process environment.
5. Use the four admin tabs. The Director card is the only Live Control content in current revisions; earlier revisions buried it under a legacy video-generation form. Its button is **Start Director**. Append a unique prompt, start, and verify an error plus restored Start control. Without credentials, the SDK may report an upstream auth error rather than a local missing-key message.
6. Capture console evidence per page with the browser console tool immediately after each fresh navigation, since it reports that load's messages. Expect only a React DevTools info message. Legacy LTX code produced a `FAL_KEY not configured` console error; if it reappears, check whether removed LTX components were reintroduced. Playwright may be importable while its browsers are absent, so prefer the running browser.
7. Keep configured coverage separate: Director Record appears only during a live session, and valid Cloudflare JWT acceptance needs real Access certificates. Fallback tests do not prove playback, recording, storage, or Twitch live data.

## Devin Secrets Needed

None for unconfigured testing. Configured coverage requires FAL_KEY, TWITCH_CLIENT_ID, TWITCH_CLIENT_SECRET, a Twitch channel, NEXT_PUBLIC_CONVEX_URL and a deployed streaming backend. Use only authorized test environments.
