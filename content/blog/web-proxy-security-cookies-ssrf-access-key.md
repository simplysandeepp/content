---
title: "Securing a Self-Hosted Web Proxy — SSRF Guards, Cookie Namespacing and an HttpOnly Access Key"
description: "The security decisions in Vrows, a web proxy on Cloudflare Workers: blocking private and loopback targets (SSRF), isolating per-site cookies under a prefixed name, protecting the proxy with an HttpOnly key cookie, and filtering ad requests where browser blockers can't reach."
metaDescription: "Security design for a Cloudflare Workers web proxy — SSRF blocklist, per-domain cookie namespacing, HttpOnly access key cookie and proxy-level ad filtering."
date: "2026-10-10"
tags: ["Security", "SSRF", "Cloudflare Workers", "Cookies", "Web Proxy", "Dev Log"]
published: true
---

A web proxy is, by construction, a server that fetches whatever URL a client tells it to. That is the definition of a risky feature, so the security design has to come first and not be added at the end. These are the controls in Vrows, and where each one stops being enough.

## 1. Don't Fetch What You Shouldn't (SSRF)

Server-side request forgery is when an attacker makes your server fetch internal resources. The proxy defends with `isBlockedHost()`, applied to the first target **and every redirect hop**. It rejects:

- `localhost`, `*.localhost`, `*.local`, `*.internal`
- IPv4 literals in loopback (`127/8`), private (`10/8`, `172.16/12`, `192.168/16`), link-local (`169.254/16`, the cloud metadata range), shared CGNAT (`100.64/10`), `0/8` and multicast/reserved (`≥ 224`)
- IPv6 loopback, unspecified, unique-local (`fc00::/7`), link-local (`fe80::/10`) and IPv4-mapped addresses

It also only allows `http` and `https`, and blocks any target that is the proxy's own host, which prevents recursion.

**Limit:** this checks the hostname string, so a public DNS name that resolves to a private address would not be caught here. On Cloudflare Workers, subrequests to private ranges generally aren't routable anyway, which is why I consider this adequate for that platform — but the same logic on a normal server would need to validate the **resolved IP**.

## 2. Keep Sites' Cookies Apart

A proxy serves many sites from one origin, so by default every site's cookies would land in the same cookie jar and be readable by every other proxied page. The fix is namespacing: the Worker stores each upstream cookie under the name

```
vr~<domain>~<name>
```

When a request comes in, the Worker reads only cookies whose domain matches the target host (exact or a subdomain), strips the prefix, and builds the upstream `Cookie` header. On the way back, upstream `Set-Cookie` headers are converted into prefixed cookies for the browser (with a long max-age). The result: a page from one site cannot see or overwrite another's cookies, and the browser's own cookie jar never contains raw upstream names.

**Limit:** the cookies still live under one origin, so any script running in that origin could read them. That's inherent to the design, which is why page scripts from proxied sites should be considered hostile.

## 3. A Key for the Proxy Itself

If the proxy is open, anyone who finds the URL can use it. Setting a `PROXY_KEY` secret turns on authentication:

- `/api/login` compares the supplied key and, if correct, sets a cookie named `vrk` that is `HttpOnly`, `Secure` and `SameSite=Lax`.
- Because it's `HttpOnly`, the key never appears in a URL or in script-readable storage — a proxied page's JavaScript can't steal it.
- All proxy and search routes check that cookie and answer 401 otherwise.

Without a secret configured the proxy stays open. That is a convenience default for local testing; the README says plainly that anyone with the address can use it.

**Limit:** the key is compared with `!==`, not a constant-time comparison, and there is no rate limiting on login attempts. A long random key makes that acceptable for a single-user tool, but it is something I'd tighten.

## 4. Ad and Tracker Filtering Where the Browser Can't

Browser extensions can't see through a proxy: every request is to the same origin, so host-based rules have nothing to match. The Worker does the filtering itself — a set of known ad/tracker hostnames, a few URL path patterns, and, for one video site, trimming ad fields out of the JSON API responses. Matching requests get a harmless empty response of the right type (an empty script, stylesheet, 1×1 GIF or blank document, chosen from `Sec-Fetch-Dest`) so pages don't show errors. A switch (`ADBLOCK=off`) disables it for debugging, since over-blocking is the usual cause of "this page is broken".

## 5. Reduce What Leaks

Most browser request headers (cookie, origin, referer, `sec-*`) are dropped before the upstream request, and `Referer`/`Origin` are re-created from the proxied page. Only a short allow-list of response headers is forwarded back, and the final URL after redirects is reported in a custom header to help debugging.

## Summary

| Risk | Control | Remaining gap |
|---|---|---|
| Fetching internal addresses | Hostname blocklist on every hop | No resolved-IP check |
| Cross-site cookie leakage | Per-domain prefixed cookies | Shared origin |
| Open proxy | HttpOnly key cookie | No rate limit, non-constant compare |
| Ads and trackers | Proxy-side filtering | List needs maintenance |

None of these make a proxy "safe" to expose to the public. They make a **personal, key-protected** proxy reasonable to run — and the gaps are the things I'd close first.
