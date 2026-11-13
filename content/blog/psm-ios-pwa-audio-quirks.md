---
title: "iOS PWA Audio Quirks — Seeking Before Metadata, a Locked Volume and a Seek Bar That Lied"
description: "A list of the specific iOS Safari behaviours that bit PSM, an offline music PWA: currentTime writes ignored before metadata loads, a read-only volume, stale state after interruptions, and a seek bar that needed its own clock."
metaDescription: "iOS Safari PWA audio gotchas and fixes — seek before loadedmetadata, locked volume, visibilitychange resync, Media Session handlers and a custom seek bar."
date: "2026-11-13"
tags: ["PWA", "iOS", "Web Audio", "Media Session API", "TypeScript", "Zustand", "Dev Log"]
published: true
---

Most of the commits after PSM's first one are not features. They are small fixes for how `HTMLAudioElement` behaves in iOS Safari. These are the ones I'd want someone to tell me about up front. All of it is from one device and one iOS version range, so treat it as field notes.

## 1. `currentTime` Writes Are Silently Ignored Before Metadata

Restoring "resume where you left off" sounds trivial: set `audio.currentTime = saved`. On iOS, before `loadedmetadata` has fired, that assignment does nothing and gives no error. The track starts from 0 while the UI claims it is at 1:42.

The fix in `load()` is a small ordered sequence: set `src` and call `load()`, wait for `loadedmetadata` (with a 4s timeout so it can never hang), write `currentTime`, wait for the `seeked` event, and **only then** call `play()`. The `once(event, timeout)` helper resolves on whichever comes first, so a missing event degrades to "starts from 0" rather than "never plays".

## 2. Two Clocks Is One Too Many

Before play, the audio element has no source, so `audio.currentTime` is 0 even though the saved position is 1:42. If the seek bar reads the element, it snaps to zero and then jumps when playback begins — "bar and audio start from different seconds" was literally a commit message.

The solution is a single exported `clock()`:

```ts
let pendingStart: number | null = null
export const clock = () => pendingStart ?? audio.currentTime
```

While a restored position is pending, it is the source of truth; once the element has actually seeked, `pendingStart` is cleared and the element takes over. The UI asks `clock()` and never has to know which phase it is in.

## 3. Don't Trust a Native Range Input for Seeking

The first seek bar was a native `<input type="range">`. Two problems: dragging inside a swipe-to-dismiss sheet fought with the sheet's gesture, and the thumb value did not track the live audio clock smoothly. It was replaced by a pointer-driven bar: pointer events set the position during the drag, the sheet ignores swipes that begin on the slider, and the rendered position comes from `clock()`. A later fix was purely visual — the knob was off-centre because two transforms were stacked; moving to a single translate fixed it.

## 4. Volume Is Read-Only

On iOS, `audio.volume` is locked at 1; only hardware buttons change loudness. PSM feature-detects it once:

```ts
audio.volume = 0.5
const canSetVolume = audio.volume === 0.5
audio.volume = 1
```

The store exposes `canSetVolume`, and the UI decides whether to show a slider. In practice I later removed the slider altogether — a control that does nothing on the target platform is worse than no control.

## 5. Interruptions Leave React State Stale

A phone call, Siri, or another app grabbing audio makes iOS pause the element without telling your store first. Coming back, the UI says "playing" while the audio is silent. A `visibilitychange` listener re-reads `!audio.paused` and `clock()` and writes them into the store, rather than assuming the last known state is still true. The same listener refreshes the optional screen wake lock.

## 6. A Blocked `play()` Isn't Always an Error

`audio.play()` returns a promise that rejects with `AbortError` whenever a new load interrupts it — which is normal when someone skips tracks quickly. Only non-abort rejections flip `playing` to false. A `loadToken` counter also guards every `await` in `load()` so a slow earlier load can't overwrite a newer track's state.

## 7. Lock Screen Controls

The Media Session API gives lock-screen and Control Center buttons. PSM sets metadata (title, artist, album, artwork — the embedded cover or the app icon as a fallback), handlers for play, pause, previous, next and seek, and pushes `setPositionState` on `durationchange` and about once a second. Handler registration is wrapped in `try/catch` because unsupported actions throw on some engines.

## Small Performance Notes

Two pragmatic changes helped scrolling: removing `backdrop-filter` blur layers that caused visible flicker on iOS, and virtualising long song lists. I didn't profile rigorously; those were "it felt better on the device" fixes.

If there is a common thread, it is: on iOS PWAs, **verify the browser did what you asked**, with events, instead of assuming a property write took effect.
