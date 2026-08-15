# DM2find.ai

Astro 7 · Tailwind 4 · static build · Docker + Caddy · deployed by Coolify on Hetzner.

**Verified building: 143 pages in ~3.5 s.** 110 destinations, 12 data sources.

---

## The two rules this repo enforces at build time

1. **A destination marked `official` must name its `dataSource`.** Otherwise the build fails.
   This is what stops a scraped destination from ever rendering a national platform's licence
   attribution — a false attribution claim against a named public body.
2. **`slug` must be lowercase letters, digits and hyphens.** No tenant ids in URLs, no spaces
   (the old Grav site had `<option value="the hague">`, which was unreachable).

Try it: put `"slug": "Bad Slug!"` in `src/data/destinations.json` and run `npm run build`.

---

## Three identifier namespaces — never unify them

| Field | Example | Owned by |
|---|---|---|
| `slug` | `trento` | the public URL, SEO-facing |
| `tenantId` | `ittrento` | `chat.dm2find.ai/<tenantId>` |
| `voiceId` | `ittrento` | `/demo?city=<voiceId>` |

`chat.dm2find.ai/14` is a fine backend address. `/destinations/14` would never rank.

---

## Local

```bash
npm ci
npm run dev      # http://localhost:4321
npm run build    # → dist/
```

## Layout

```
src/content.config.ts        Zod schemas — the build gate
src/data/destinations.json   ← generated; see "Source of truth" below
src/data/sources.json        the 12 platforms + licence attribution + connector status
src/pages/
  index.astro                home, four doors
  destinations/index.astro   catalogue + filters (vanilla JS, no framework)
  destinations/[slug].astro  one page per destination
  countries/[country].astro  country hubs
  data/[source].astro        one page per data platform
  api/destinations/[slug].json.ts   machine-readable record per destination
  llms.txt.ts                for answer engines
Dockerfile / Caddyfile       the site container
redirect-app/                separate container: dm2find.com → DM2find.ai/travel
.github/workflows/deploy.yml build → GHCR → Coolify webhook
```

---

## Deploying on Hetzner with Coolify

**Build in GitHub Actions, not on the box.** Not for RAM — the box has ~10 GB free — but for
disk. It sits at ~84 % with Supabase and the chat backend on the same filesystem. A finished
image is 60–80 MB; a local build lineage costs 1.5–2 GB in layers and cache.

### 1. Push

```bash
git init && git add -A && git commit -m "Astro rebuild"
git remote add origin git@github.com:<you>/dm2find-web.git
git push -u origin main
```

The workflow builds and pushes `ghcr.io/<you>/dm2find-web:latest`. Make the package public,
or add a GHCR read token to Coolify.

### 2. Main site in Coolify

1. **+ New → Resource → Docker Image**
2. Image `ghcr.io/<you>/dm2find-web:latest`, port **80**
3. Domain `https://dm2find.ai` (add `www.dm2find.ai` too) — Coolify issues the certificate
4. Copy the **deploy webhook** into the repo as secret `COOLIFY_WEBHOOK`

Push to `main` → Actions builds → webhook fires → Coolify pulls and swaps the container.

### 3. Redirect app (do this one first — it is ten minutes and starts consolidating link equity)

1. **+ New → Resource → Dockerfile**, point it at `redirect-app/`
2. Domains `dm2find.com` and `www.dm2find.com`
3. Change **only** the apex and `www` DNS records

> `app.dm2find.com` is a white-label chatbotbuilder.ai deployment (Sijthoff, Nyenrode).
> Never make this a wildcard.

Keeping the redirect in its own container means it survives while the main site rebuilds.

### 4. Before cutting DNS for dm2find.ai

- [ ] Redirect map in `Caddyfile` extended from the full Grav URL inventory
- [ ] `/sitemap-index.xml` submitted in Search Console
- [ ] Every `chatUrl` returns 200 (see below)
- [ ] Leave the GoDaddy Grav install running until verified — no reason to rush it

```bash
# link check, run anywhere with network access to chat.dm2find.ai
node -e "const d=require('./src/data/destinations.json');(async()=>{for(const x of d){
  const r=await fetch(x.chatUrl,{method:'HEAD'}).catch(()=>({status:'ERR'}));
  if(r.status!==200)console.log(r.status,x.slug,x.chatUrl)}})()"
```

### 5. Housekeeping on the box

```bash
docker builder prune -af
docker image prune -a --filter "until=168h"   # the filter keeps Coolify's rollback images
```

---

## Source of truth

`src/data/destinations.json` is currently reverse-engineered from the old Grav pages and every
record is `_needsReview`. **Replace it with an export from the tenants table.** n8n is already
running on the box — a nightly job that regenerates this file and opens a PR is the right home
for it. Supabase is there too, so the file should be an *export*, not a second source of truth.

Until then, `inventory`, `languages` and `sampleQuestions` are empty and `region` is null.
