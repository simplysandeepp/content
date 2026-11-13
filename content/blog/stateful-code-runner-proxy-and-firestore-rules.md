---
title: "Running User Code Safely From a Browser IDE — A Server-Side Proxy, Schema Validation and Firestore Rules I Had to Revisit"
description: "Security and architecture notes from Stateful's online compiler: keeping the execution-API credentials on the server, validating requests with zod, normalising a third-party response, per-user Firestore rules for saved files — and the privilege-escalation gap I found when I re-read those rules."
metaDescription: "Building a browser code runner — proxying a code-execution API, zod request validation, response normalisation, Firestore per-user and admin rules and a role self-escalation pitfall."
date: "2026-07-22"
tags: ["Security", "Express", "Zod", "Firebase", "Firestore", "TypeScript", "Dev Log"]
published: true
---

An online IDE is mostly a UI over an execution service. The interesting engineering is everything around that call: where credentials live, what you validate, how you store users' files, and who is allowed to read them. This post covers those parts of Stateful's compiler, and one mistake I noticed on review.

## Never Put the Execution Key in the Browser

The frontend does not call the code-execution provider directly. It calls a small Express route on our own backend, which holds the provider's client id and secret in environment variables and forwards the request. If the keys were in client-side code, anyone could extract them from the bundle and spend the quota.

The route is intentionally tiny:

1. **Validate** the body with a `zod` schema: `language` (string), `code` (string), optional `input` (string).
2. **Map** the language to the provider's identifier and version index through a lookup table covering Python, Java, C, C++, JavaScript, Go and Rust. An unknown language returns `400 Unsupported language`.
3. **Check configuration.** If the credentials are missing, return a clear `500 Server misconfiguration` and log it — a better failure than a confusing upstream 401.
4. **Forward** to the provider, and pass through non-OK statuses with the provider's message and details.
5. **Normalise** the response to the shape the UI already understands (`run.stdout`, `run.output`, `run.status` set to "Accepted" or "Error", and a friendly message when a program produces no output).

Two small design points: a `ZodError` is caught separately and returned as `400` with the validation details (client errors shouldn't look like server errors), and normalising the response means swapping providers later changes one route, not every component.

## What This Does *Not* Protect

The proxy protects the credentials; it does not protect the quota. As written there is no per-user rate limit or authentication check on the route, so anyone who finds the endpoint can run code against our account. A production version needs Firebase ID-token verification on the route and a rate limit per user, plus a maximum code size in the schema. Sandboxing itself is delegated to the provider, which is the correct place for it — never run untrusted code on your own server unless you are prepared to build a real sandbox.

## Saving Files: Per-User Rules in Firestore

Users can save compiler files in the cloud. The data model puts them under `users/{userId}/compiler_files/{fileId}`, and Firestore security rules grant access if the requester's `auth.uid` matches the `userId` in the path, or the requester is an admin. There is also a collection-group rule that lets admins read all `compiler_files` for a cohort-style overview, and a `user_progress` document per user with the same owner-or-admin rule.

Putting the owner id in the document **path** is the idiom to remember: the rule becomes a one-line equality check, with no need to query the document first.

## The Gap I Found on Review

The admin helper reads the caller's role from their own `users/{uid}` document:

```
function isAdmin() { ... get(/users/$(request.auth.uid)).data.role == 'admin'; }
```

But the rule for that same document says:

```
match /users/{userId} {
  allow read, write: if request.auth.uid == userId || isAdmin();
}
```

Because users may **write** their own `users/{uid}` document, a signed-in user could set `role: 'admin'` on themselves and become an admin. It's a classic privilege-escalation hole, and it comes from storing authorisation data in a place the subject can edit.

The fixes, in order of preference:

1. Use **custom claims** (`admin: true`) set from a trusted backend with the Admin SDK, and check `request.auth.token.admin` in rules. Claims aren't user-writable.
2. If the role must stay in a document, move it to a collection only the backend can write (`allow write: if false`), or restrict user writes so the `role` field can't change (`request.resource.data.role == resource.data.role`).
3. Also note `get()` in a rule costs an extra read each time it runs; claims avoid that cost too.

## Takeaways

1. Keep third-party credentials on the server and validate inputs at the boundary.
2. A proxy hides keys; it doesn't replace authentication and rate limiting.
3. Put ownership in the path so security rules stay simple.
4. **Never store authorisation data where the user can edit it.** Re-read your rules as an attacker would; I only noticed this one when I did.
