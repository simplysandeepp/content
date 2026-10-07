# port-content

The single source of truth for every portfolio template on sandeepp.in.
Each template repo (v4.port, v5.port, …) is code only and pulls this repo in at build time.

## Layout

| Path | What | Ends up in the template at |
|---|---|---|
| `content/projects/*.md` | Projects (filename = URL slug) | `content/projects/` |
| `content/blog/*.md` | Blog posts | `content/blog/` |
| `content/experience/*.md` | Experience entries | `content/experience/` |
| `content/certifications.md` | Certifications (frontmatter list) | `content/certifications.md` |
| `content/data/*.json` | Datasets behind charts (e.g. `aegis-eval.json`) | `content/data/` |
| `public/projects/` | Project screenshots — auto-matched by slug | `public/projects/` |
| `public/logos/` | Certification brand logos | `public/logos/` |
| `content/data/about-me.json` | Hobbies + fun facts (terminal `fun-fact`, `hobbies`) | `content/data/` |
| `content/data/this-or-that.json` | *Optional* — enables the "This or That" game on About | `content/data/` |
| `content/data/day-in-life.json` | *Optional* — enables the "A day in my life" story on About | `content/data/` |
| `content/now.md` | *Optional* — enables the `/now` page | `content/now.md` |
| `templates/` | Fill-in starters for the optional files above (not synced) | — |
| `cv/main.tex` | LaTeX CV source (not synced to templates) | — |

## Editing

1. Edit or add a file, commit, push to `main`.
2. `Publish content` validates everything (`npm run validate`), then calls every template's Vercel Deploy Hook.
3. A few minutes later every template is live with the change.

Locally, templates read a sibling checkout of this repo (`../port-content`) — no token needed.
`npm run dev` in a template re-syncs content each time it starts; run `npm run content` there to re-sync without restarting.

## Optional sections

"This or That", "A day in my life" and `/now` stay hidden until their file exists.
Copy the starter from `templates/`, fill in the real answers, remove the `_howto` line, push.

## Frontmatter contract

`scripts/validate.mjs` enforces the fields every template relies on:

- **projects:** `title`, `description`, `date`, `tags` (list)
- **blog:** `title`, `description`, `date`
- **experience:** `company`, `role`, `start`, `end`
- **certifications:** `title`, `issuer`, `issued`

Templates ignore fields they don't use. Any new field must be optional so older templates keep building.

## Secrets

| Secret | Purpose |
|---|---|
| `VERCEL_DEPLOY_HOOKS` | One Vercel Deploy Hook URL per line — one per template |

Templates read this repo with a read-only fine-grained token stored as `CONTENT_TOKEN` in each Vercel project.

## Automation

- `publish.yml` — on push: validate → rebuild all templates.
- `refresh.yml` — every 6h: refresh cert logos, compress new screenshots, commit, rebuild.
