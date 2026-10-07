---
title: "Building Camio: A Self-Hosted Security Camera From Scratch, and Everything That Broke Along the Way"
description: "The full build log of Camio — a private, multi-camera, multi-user security camera platform running on my own hardware over Tailscale. Architecture decisions, a self-run security audit, and a debugging story about a CSP header that silently broke login on my phone."
metaDescription: "Full build log of Camio, a self-hosted security camera app: architecture, a self-run security audit, and a debugging story about a CSP bug that broke mobile login."
date: "2026-08-28"
tags: ["Camio", "Next.js", "MediaMTX", "Tailscale", "Security", "WebRTC", "Dev Log"]
published: true
---

This is the build log for **Camio** — a self-hosted security camera application I built from a single sentence of intent: *"I want to watch my room from my phone, from anywhere, without paying a company a monthly fee to route my own video through their servers."* What follows is everything that went into making that true: the architecture decisions, the security audit I ran against my own code before trusting it, and a debugging story that taught me more about the gap between "the server responds correctly" and "the feature actually works" than anything else I've built this year.

## The Constraint That Shaped Everything

Before any code, there was one hard constraint: my domain, `sandeepp.in`, already has 8–10 live projects deployed on Vercel across various subdomains. Any solution that required touching DNS at the registrar level — moving nameservers to a different provider, for instance — was off the table. One wrong record during a migration and I could take down projects that have nothing to do with this one.

That single constraint eliminated an entire category of "obvious" solutions. Cloudflare Tunnel, the standard answer to "expose a home server safely," requires your domain's nameservers to live on Cloudflare. Not an option here.

The alternative: **Tailscale**. It builds a private WireGuard mesh network between your own devices — no DNS changes, no router configuration, no public IP exposure of any kind. Your machine dials *out* to join the network; nothing dials in from the public internet, ever. It doesn't give you a public URL you can hand to a stranger, but that was never the goal — the goal was *my* phone reaching *my* camera, and nothing else needed to reach it at all.

This is the kind of decision that looks small in retrospect but actually determined the entire shape of the system: no public ingress meant the security model could be "nothing is exposed" rather than "everything is exposed but authenticated," which is a categorically stronger position to build from.

## Architecture: Three Processes, One Job Each

Camio runs as three independent processes that only know about each other through localhost ports and a shared configuration file:

```
camera(s) ──ffmpeg──▶ MediaMTX ──▶ WebRTC (WHEP) + HLS
                                         │
                    Next.js app: auth-guarded proxy + dashboard
                                         │
                         Tailscale private network (WireGuard)
                                         │
                            browser, anywhere, any network
```

**ffmpeg** captures raw frames from whatever camera is attached — `avfoundation` on macOS, `v4l2` on Linux — and encodes to H.264, publishing over RTSP to MediaMTX. This is the one piece of the system that's genuinely platform-specific, and the entire cross-platform story comes down to a single environment variable, `CAMERA_SOURCE`, that swaps which ffmpeg input driver gets used. Everything else in the codebase is identical between my Mac (development) and the Ubuntu machine (production).

**MediaMTX** is a single static binary that does the hard part of video streaming: it ingests the RTSP feed and re-serves it as both WebRTC (via the WHEP protocol, sub-second latency, the "feels live" experience) and HLS (a few seconds of latency, but works absolutely everywhere, on every network, with zero special client support). Writing either of these protocols from scratch would have been a multi-week project in itself; MediaMTX turns it into a YAML config file.

**The Next.js app** is the only thing exposed at all. It handles login, session management, and — critically — it's a **reverse proxy** in front of MediaMTX. This last point took a full iteration to get right.

## Why the Stream Is Proxied, Not Just Password-Protected

My first instinct was: run MediaMTX, put a login page in front of the dashboard, done. But that leaves the actual video ports (RTSP, HLS, WebRTC, and MediaMTX's own control API) directly reachable on the network — protected by nothing except the fact that an attacker doesn't happen to know the port number. That's security by obscurity, and it's exactly the kind of thing an audit exists to catch.

The fix: MediaMTX binds every one of its ports to `127.0.0.1` only. It is *architecturally* impossible to reach it from outside the machine, full stop — there's no firewall rule to misconfigure, no port to accidentally leave open. The Next.js app is the sole client that talks to it, and every route that touches video re-verifies the session cookie *independently* of the global middleware, so even a middleware bug couldn't leak a frame.

The one asterisk: WebRTC media itself is peer-to-peer by design — you genuinely cannot proxy the video packets themselves through a middleman without defeating the entire point of WebRTC's low latency. So in the locked-down default configuration, only the WebRTC *signaling* is proxied (the SDP offer/answer handshake), and remote viewers automatically fall back to the fully-proxied HLS path, which has zero gaps — every single byte of that video passes through the authenticated app. If someone specifically wants real-time WebRTC for a remote viewer, that's an explicit, documented opt-in that exposes exactly one additional port on the private Tailscale network — never the public internet.

## Building It in Phases

I built this the way I build most projects when I'm working with an AI pairing partner: a strict branch-per-feature, PR-per-feature discipline, even solo. Every phase got its own branch, its own pull request with a description of what was verified (not just what was written), and a squash-merge into `main`. By the time the core app was "done," there were six merged PRs, each independently reviewable:

1. **Scaffold** — the Next.js app shell and the cross-platform config module that makes the Mac/Ubuntu split possible with one env var.
2. **Camera pipeline** — MediaMTX auto-download, the ffmpeg launcher, device enumeration.
3. **Authentication** — scrypt password hashing (via Node's built-in `crypto`, deliberately avoiding a bcrypt native dependency), signed session JWTs, middleware route guarding, login rate limiting.
4. **Live dashboard** — the WebRTC player with automatic HLS fallback, real camera status pulled from MediaMTX's control API (not faked).
5. **Stream guard** — the localhost lockdown and proxy architecture described above.
6. **24/7 run assets** — `systemd` units for Ubuntu with `Restart=always`, plus full Tailscale + deployment documentation.

That got me to a genuinely working v0.1.0. Then I did something I don't always see solo hobby projects do: I stopped and audited it like it wasn't mine.

## The Audit: Treating My Own Code Like a Stranger's

Before calling v0.1.0 "done," I ran a structured, three-dimensional review against the shipped code — security, correctness, and scalability — each pass independent of the others, so findings wouldn't get lost in a single pass trying to hold too many concerns in mind at once. Here's what actually surfaced, and why each one mattered.

### Security findings

**The rate limiter had a real, exploitable bypass.** The login endpoint capped failed attempts at 10 per 15 minutes — a reasonable anti-brute-force measure, except it was keyed on the value of the `X-Forwarded-For` HTTP header. That header is entirely client-controlled when there's no trusted reverse proxy sitting in front of the app (which, on a home Tailscale setup, there isn't). An attacker sending a different fake `X-Forwarded-For` value on every request gets a fresh rate-limit bucket every time — the cap never engages, and you're back to unlimited password guessing. I rewrote the limiter to key on the *account being logged into* instead, with IP-based limiting only activating behind an explicit `TRUSTED_PROXY=true` flag that documents exactly when it's safe to trust that header at all.

There was a second, subtler version of the same bug: with no proxy header present at all (the normal case), every legitimate login attempt from every device shared *one single bucket* — meaning ten failed attempts from any device, or an attacker deliberately hammering it, would lock out the real user for fifteen minutes. Keying on the account fixed both problems with the same change.

**The stream routes had a single point of failure.** Route protection lived entirely in Next.js middleware — which is the right *primary* defense, but it meant a middleware misconfiguration, a matcher regex bug, or (hypothetically) a future framework-level bypass would expose live video with nothing else standing in the way. I added a second, independent session check directly inside each video-serving route handler. It's a small amount of redundant code for something that should never be single-point-of-failure protected: the actual camera feed.

**An open redirect in the post-login flow.** The login page reads a `?next=` query parameter to send you back to whatever page you were trying to reach before being asked to log in — a completely standard pattern. The bug: it trusted that parameter without checking it stayed on the same site, so a crafted link like `/login?next=https://evil.example` would silently send a freshly-authenticated user off to an attacker's domain right after they'd just proven they trust this one. Fixed by only accepting same-origin relative paths.

**Missing response headers.** No Content-Security-Policy, no `X-Frame-Options`, no `Referrer-Policy`. Meant, among other things, that the entire live camera dashboard could be embedded in an invisible iframe on any other website — a classic clickjacking setup. Added a proper header set, including `frame-ancestors 'none'`.

### Correctness findings

**A stale-closure bug in the video player that would have been genuinely hard to catch by just watching it work once.** The `CameraPlayer` component tries WebRTC first and falls back to HLS if the connection doesn't establish within six seconds. That fallback timer read a piece of React state (`state === "connecting"`) from inside its `setTimeout` callback — but because of how the effect's dependency array was set up, that closure captured the state's value at the moment the effect first ran, and never saw any update after that. So even after WebRTC connected successfully and the UI correctly showed "LIVE," that stale six-second timer would still fire later, still see the frozen `"connecting"` value, and re-trigger the HLS fallback path anyway — spinning up a *second* video player instance on top of an already-working one, with the two silently fighting over the same `<video>` element and leaking the first player's resources.

The fix was to stop trusting React state inside a long-lived closure and instead use plain mutable flags scoped to the effect itself, which don't have this staleness problem. It's a good reminder that "the feature demonstrably works when I click it once" and "the code is correct" are not the same claim — this bug was invisible in casual testing and only showed up when I specifically traced through what happens *after* a successful connection, not just at the moment of connecting.

**An unhandled exception on a specific misconfiguration.** If `SESSION_PASSWORD_HASH` was set but `SESSION_SECRET` was missing or too short, a *correct* password would pass verification, and only then would the code try to sign a session token — and throw, unhandled, resulting in a generic server error with zero indication of what was actually wrong. Fixed by validating the full set of required configuration up front, before doing any password verification at all, with an error message that actually says what's missing.

### Scalability findings, and building what they pointed at

The scalability pass wasn't really about performance — it was about the fact that the app was hard-coded to exactly one camera and exactly one user account, with no path to more without a rewrite. Rather than leave that as a list of "future ideas," I built both:

**Multi-camera support**, designed so the *default* configuration (nothing set) still behaves exactly like the original single-camera app — no existing setup breaks. Opting in means setting one environment variable to a JSON array describing each camera's device index, label, and capture settings; the camera pipeline then spins up one independently-supervised ffmpeg process per camera, each with its own exponential-backoff crash recovery, so one flaky USB camera restarting doesn't take the rest of the system down with it. The web routes and dashboard grid follow the same pattern automatically.

**Multi-user support**, same philosophy: a JSON list of accounts (inline, or in a separate file kept out of the main config), falling back cleanly to the original single-user setup when unset. Login still runs a full password verification even for a username that doesn't exist — checked against a fixed dummy hash — specifically so that response timing can't be used to enumerate which usernames are valid.

I shipped all of this as v0.2.0, with release notes documenting every fix by name.

## The Bug That Only Showed Up on a Real Phone

Here's the part of this project that taught me the most, and it happened *after* I considered the security work "done."

Everything tested clean. Every endpoint I checked with `curl` returned exactly the response it should — correct status codes, correct cookies being set, correct JSON bodies. Then I actually tried to log in from my phone, over Tailscale, in a real mobile browser, for the first time since the security hardening had landed.

I tapped "Sign in." Nothing happened. No error message. No loading state. No network request in the server logs at all — not even a rejected one. The button visually existed and visually did nothing.

The instinct in this situation is to suspect the password, or the network path, or the cookie settings — all the usual login-flow suspects. I checked all of them and they were fine. The real signal was in what the server logs *didn't* show: two page loads of `/login`, and not a single `POST /api/auth/login`. Whatever was happening, the click wasn't even reaching the point of sending a request. That ruled out the entire server side of the problem — this was something failing before a request ever left the browser.

The cause, once I traced it: the Content-Security-Policy header I'd added during the audit specified `script-src 'self' 'unsafe-inline'` — deliberately restrictive, no `unsafe-eval`, because allowing arbitrary `eval()` execution is exactly the kind of thing a security-hardening pass is supposed to close off. What I hadn't accounted for: **Next.js's own development server relies on `eval()` internally**, for its hot-reload source-map machinery. A browser correctly enforcing that CSP — and mobile Safari does enforce it strictly — silently blocks every one of those `eval()`-wrapped module chunks from executing. The HTML painted fine. The CSS painted fine. Every script the page needed to actually *do* anything simply never ran, so React never hydrated, so no click handler was ever attached to that button.

It had genuinely never surfaced before because every single test I'd run since adding that CSP header had been a `curl` request — and `curl` doesn't run JavaScript and doesn't enforce a Content-Security-Policy. I had been thoroughly testing a system whose failure mode was specifically invisible to the tool I was testing it with.

The fix: allow `unsafe-eval` in the CSP, but *only* when `NODE_ENV !== 'production'`. The actual security posture that matters — the deployed, production build people will actually rely on — never needed `eval()` in the first place, so it keeps the fully-locked-down policy. Development mode gets exactly the permission it needs to function, and nothing more.

There was a second, smaller landmine hiding right behind the first one: Next.js 15's dev server also flags any request reaching it through something other than `localhost` as "cross-origin" for its internal asset routes — which is precisely what happens when you reach it via a Tailscale IP address instead. Currently just a console warning, soon to be an outright block in a future major version. Fixed the same way, with an explicit, environment-driven allow-list rather than hard-coding my own private IP address into a public repository.

The lesson that stuck: **a passing `curl` test proves the server responded correctly. It proves nothing about whether the feature works for an actual human, on an actual device, over the actual network path they'll really use.** The two failure modes — "the CSP is stricter than intended" and "the request never even fires" — were both entirely invisible to server-side testing, and both were only findable by reproducing the exact real-world conditions: a real mobile browser, over the real Tailscale connection, watching the real server logs in real time as the failure happened.

## Cleaning Up After Myself

Two smaller but genuinely important housekeeping passes came after the feature work:

**Rewriting Git history to remove internal planning documents from public view.** Early on, I'd committed a working roadmap file and some internal deployment notes directly into the repository before making it public — reasonable while private, not something that belongs in a public, portfolio-facing repo once it's live. Untracking them going forward wasn't enough, since the content would still sit in every earlier commit forever; I rewrote the full commit history to strip those files out entirely, then force-pushed the cleaned history.

**Making the repository properly licensed and clearly attributed.** Added an explicit All-Rights-Reserved license appropriate for a public-but-not-open-source personal project, and — since I'd been building this with AI pairing throughout — made a deliberate choice to also rewrite every commit message across the project's history to remove automated co-authorship trailers, so the commit history and GitHub's contributor graph reflect the project the way I wanted to present it publicly.

## What's Next: A Real Desktop Installer

Right now, running Camio means cloning the repository, running a few setup commands, and hand-editing a configuration file. That's a fine workflow for me, but it's a genuinely high barrier for the actual end goal — a piece of software someone can download and have running in under a minute, no terminal required.

The next phase, already scoped out in a fully detailed roadmap, is a companion project — **`camio-desktop`** — an Electron-based installer for Ubuntu Desktop and macOS that wraps this exact application (via a git submodule pinned to a released version, so the two projects never silently drift apart) with a real graphical first-run setup wizard: pick your camera from a dropdown, set a username and password, click through, done. It lives in the system tray, shows live camera status, and "Open Dashboard" just opens the same web app in your default browser — the actual product experience doesn't change, only how you get it running does.

It's being built as a genuinely separate, standalone repository — worth its own pinned spot on a GitHub profile — but engineered specifically so it can never drift out of sync with the app it's a wrapper around.

## Closing Thought

The single idea I'd take away from this whole build, more than any individual bug or architecture choice: **the gap between "this technically works" and "this actually works for the person using it" is where the real bugs live.** Every meaningful issue in this project — the rate-limiter bypass, the stale-closure double-player bug, and especially the CSP/`eval` mobile-login failure — was invisible to the exact kind of testing that feels most rigorous (curl requests, server logs, unit tests) and only findable by putting the real artifact in front of a real device on the real network path it was actually built for. That's not a reason to skip the rigorous testing — it's a reason to never let it be the *only* testing.

Camio is live, running 24/7 on my own hardware, watching a room I care about, over a network no cloud provider ever sees. Source is public at [github.com/simplysandeepp/camio](https://github.com/simplysandeepp/camio).
