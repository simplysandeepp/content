---
title: "How a Rewriting Web Proxy Works — Lessons From Building One on Cloudflare Workers"
description: "A technical walkthrough of Vrows: mapping real URLs to /p/<scheme>/<host>/… paths, rewriting HTML with HTMLRewriter, patching CSS and script navigation, following redirects inside the Worker, and the Referer trick that rescues pages which build URLs for the wrong origin."
metaDescription: "Build notes for a rewriting web proxy on Cloudflare Workers — URL mapping, HTMLRewriter, CSS and JS rewriting, internal redirect handling and Referer-based recovery."
date: "2026-10-10"
tags: ["Cloudflare Workers", "HTMLRewriter", "Web Proxy", "JavaScript", "HTTP", "Dev Log"]
published: true
---

I built **Vrows** to find out what actually happens inside a web proxy that has to keep a page working. Fetching a URL is the easy 10%. The remaining 90% is making sure nothing the page does escapes the proxy. This post covers the mechanics; a companion post covers the safety and privacy side.

## 1. Pick a URL Scheme That Keeps Relative URLs Working

Proxied pages live under:

```
/p/<scheme>/<host>/<path>?<query>
```

So `https://example.com/a/b.html` becomes `/p/https/example.com/a/b.html`. Because the real path structure is preserved, a relative reference such as `../img/x.png` still resolves correctly against the proxied page — the browser does the work. A query-string scheme (`/proxy?url=...`) would break every relative URL and require rewriting them all.

`proxyUrl()` and `realFromProxyPath()` are exact inverses of each other, and they're the only place that mapping lives.

## 2. Rewrite Markup With `HTMLRewriter`

Cloudflare's `HTMLRewriter` is a streaming, selector-based transformer: you attach handlers to elements and attributes and the response is transformed as it flows. The rewriter handles `href`, `src`, `action`, `poster`, `data-src`, `formaction` and the `srcset` family, skipping `#fragment`, `javascript:`, `mailto:`, `data:` and `blob:` values. A `<base href>` is honoured when resolving URLs and then removed, so the browser can't use it to resolve links outside the proxy, and a small client script is injected at the start of `<head>`.

Streaming matters: the page starts rendering before the whole body has been transformed.

## 3. CSS and JavaScript Need Their Own Passes

- **CSS** is rewritten with two regexes for `url(...)` and `@import`.
- **JavaScript** is the tricky one. Pages navigate with `location.href = '…'` or `location.assign(…)`, which would jump straight out of the proxy. The Worker rewrites those expressions to call a helper (`window.__vrNav || location`) that maps the destination back through the proxy. It is intentionally conservative: only files containing `location`, and only below a size cap (300 KB) are touched, because regex-rewriting minified code is risky and slow. Everything larger streams through unchanged.

I treat the JS rewrite as best-effort, not a guarantee. That's the honest limit of this approach; a heavy single-page app may still escape.

## 4. Follow Redirects in the Worker

The Worker calls `fetch` with `redirect: 'manual'` and walks the chain itself, up to 12 hops. Two reasons:

1. **Cookies must be applied on every hop.** Some sites bounce between domains based on cookies and region; handing the redirect to the browser would lose the cookie context and can loop forever.
2. **Every hop must be re-validated** against the blocked-address rules, not just the first URL.

The method rules follow the HTTP spec: a 303, or a 301/302 after a POST, becomes a GET with the body dropped. A tiny retry handles the occasional 525/526 that Cloudflare-fronted sites return to Worker subrequests.

## 5. The Referer Trick for Pages That Build the Wrong URL

Client-side code sometimes constructs a URL against *our* origin — for example `location.href = '/login'`. Our origin has no `/login`. The Worker looks at the `Referer`, recovers which real site the page was proxying, and answers with a 307 to that site's `/login` through the proxy. It is a small fallback that fixes a surprising number of "works in the browser, breaks in the proxy" cases.

Downloads started by the app carry a hint parameter naming the originating page, since many CDNs check the Referer. The Worker removes it again **without re-encoding the rest of the query**, because signed URLs break if their query is re-serialised.

## 6. Pass Through What You Don't Understand

HTML is rewritten, CSS and small JS are patched, JSON for one specific host is filtered, and **everything else streams through untouched**, keeping `content-length` so video can seek. A short allow-list of response headers is forwarded; most request headers (cookie, origin, referer, `sec-*`) are dropped and replaced with values describing the proxied page, not the proxy.

## What I Learned

- Preserve URL structure and half the problem disappears.
- Prefer a streaming transformer over buffering whole pages.
- Treat script rewriting as best-effort and cap it.
- Re-validate on every redirect hop, not just the first.
- Be explicit about what you *don't* support; the README lists heavy client-side sites and streaming protocols.
