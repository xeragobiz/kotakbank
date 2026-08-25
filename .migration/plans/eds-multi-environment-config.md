# New Banking EDS Website — Repoless Setup + Security Model for Azure DevOps ↔ Adobe Edge Delivery

## 🔐 Security answer (for the bank's security team): Does Adobe have access to Azure DevOps?

**No. Adobe has no access to Azure DevOps — none.** No credentials, no network path, no app installation, no inbound connection into your Azure tenant or your network. This is the single most important point for the security review, and it holds because of *how* the link is built.

### Why Adobe never touches Azure DevOps
Adobe's **Code Sync is a GitHub App** — it can only read a **GitHub** repository. Azure DevOps is not a supported Code Sync source. So when Azure DevOps is your code system-of-record, the link is a **one-way mirror** with a hard boundary in the middle:

```
[Azure DevOps: SoR]  --push-->  [GitHub mirror repo]  <--read--  [Adobe Code Sync GitHub App]  ==>  Edge CDN (.aem.page/.live)
   (your tenant)     you own        (Microsoft)         Adobe reads ONLY this           Adobe delivery
```

- **Azure → GitHub is a push YOU initiate.** An Azure Pipeline pushes mirror branches to GitHub using a credential **you** create and store in **your** Azure Key Vault. Azure calls out to GitHub; nothing calls *into* Azure.
- **GitHub → Adobe is Adobe reading GitHub only.** Adobe's Code Sync GitHub App is installed **on the GitHub mirror repo** and can read *that repo's contents* + receive push webhooks. Its scope is confined to that one repo, granted and revocable by your GitHub org admin.
- **Adobe's access boundary stops at GitHub.** Adobe has no visibility of, or path to, Azure DevOps, its PRs, pipelines, work items, other repos, or your network.

### The trust boundaries, stated precisely (what the security team will want)
| Actor | Can access | Cannot access | Credential holder |
|---|---|---|---|
| **Azure DevOps** (your SoR) | Its own repos/PValidPR/pipelines; pushes out to GitHub | — | You (Azure) |
| **Azure→GitHub mirror pipeline** | The GitHub mirror repo (push) | Adobe systems | You — token in Azure Key Vault |
| **GitHub mirror repo** (Microsoft) | Holds a copy of the **front-end** code; Adobe app reads it | Azure DevOps internals | GitHub org admin controls app install |
| **Adobe Code Sync (GitHub App)** | **Only** the GitHub mirror repo's contents + push events | **Azure DevOps entirely**; your network; other repos | Adobe (scoped GitHub App) |
| **Adobe Edge/CDN** | Delivers the built front-end publicly | Your source control | Adobe |

### Three facts that de-risk this for a bank
1. **EDS front-end code is public by design.** It's client-side JS/CSS/HTML served from the CDN. The GitHub mirror holds only this front-end — **no secrets, no back-end, no core-banking code** should ever be in it. So even the copy that lands in GitHub is not sensitive if repo hygiene is enforced.
2. **The flow is outbound-only from your side.** Adobe (and GitHub) never initiate inbound connections to Azure DevOps or your network. Firewall/egress rules can be documented accordingly.
3. **Access is scoped and revocable.** The Code Sync GitHub App is limited to the mirror repo and can be uninstalled by your GitHub org admin at any time; the mirror credential lives in your Key Vault and is rotatable.

### What this means / the honest caveat
- If the security team's requirement is *"Adobe must not access our source control"* — **satisfied**: Adobe only ever reads the **GitHub mirror**, never Azure DevOps.
- If the requirement is *"our front-end code must never leave our tenant / must not reside in GitHub (Microsoft public cloud)"* — then **GitHub-hosting the mirror is the item to assess**, because Code Sync mandates a GitHub repo. There is **no supported way to feed EDS front-end delivery without a GitHub repo** (Cloud Manager Git and Azure DevOps are not Code Sync sources). This is a platform constraint to raise explicitly, not something to engineer around. (Verify against current Adobe/aem.live docs during execution.)
- **Content** (authored pages, potentially sensitive pre-release rates/offers/legal copy) travels the **separate content plane** (AEM author → aem.live Admin API), **never through git at all** — so source-control access questions don't touch content.

## Can Adobe Cloud Manager Git be the EDS code repo instead of GitHub? — No
`git.cloudmanager.adobe.com/...` is the **AEMaaCS / Cloud Manager (Java app)** repo; **Code Sync does not read it.** EDS front-end delivery requires a **GitHub repo + Code Sync app**. (Carried forward from the prior turn.)

## The open decision — code SoR pattern (given GitHub is mandatory for Code Sync)
1. **GitHub-direct (simplest).** Devs work in GitHub; Adobe reads it. Fewest moving parts; Adobe still only sees that repo.
2. **Azure DevOps SoR → mirror to GitHub (this security model).** Keeps SoR/PRs/CI/audit in Azure (in your tenant); GitHub is a delivery-only mirror; Adobe reads only GitHub. **Best fit if the bank mandates Azure DevOps as SoR.**
3. **Cloud Manager Git SoR → mirror to GitHub.** Only if mandated to keep code in Adobe-hosted git.

## Decisions Locked
1. **EDS front-end code → GitHub + Code Sync** (mandatory). With **Azure DevOps as SoR**, use **Option 2** (mirror), giving the security posture above.
2. **Adobe access boundary = the GitHub mirror only** (never Azure DevOps / your network).
3. **Content source → two Universal Editor authors** (non-prod backs Dev/UAT/Stage; prod backs Prod). Prod↔non-prod content wall preserved.
4. **Publish tooling → UE + Admin API; Sidekick optional** — needs the UE→Admin-API reverse binding (carried forward).

## Known identities
- **Org:** `xeragoapacptrsd` · **Site:** `sample-eds` · **Live host:** `main--sample-eds--xeragoapacptrsd.aem.live` (a GitHub+Code-Sync source already backs the live site).
- `git.cloudmanager.adobe.com/xeragoapacptrsd/sample-eds` = AEMaaCS app repo, **not** the EDS Code Sync source.

## Environment Topology

| Tier | Code branch (GitHub, mirrored from Azure) | Content source (UE author) | Delivery host | Public? |
|---|---|---|---|---|
| **Dev** | `dev` | Non-prod author — `/dev` | `dev--sample-eds--xeragoapacptrsd.aem.page` | gated |
| **UAT** | `uat` | Non-prod author — `/uat` | `uat--…aem.page/.live` | gated |
| **Stage** | `stage` | Non-prod author — `/stage` | `stage--…aem.page/.live` | gated |
| **Prod** | `main` | Prod author — `/` | `main--…aem.live` → **custom domain** | public |

- **Code:** Azure DevOps SoR → mirror env branches to GitHub → Code Sync publishes each to its edge host.
- **Content:** non-prod author → prod author (content package / Content Transfer Tool / author-to-author copy) — never through git.

## 🔧 Carried-forward fix — UE Publish must call the aem.live Admin API (not `/bin/replicate`)
- Attach the **Edge Delivery Services config** (org `xeragoapacptrsd` + site `sample-eds` + ref) to the content tree so UE Publish routes to `admin.hlx.page/preview|live/...`.
- `head.html` `urn:adobe:aue:system:aemconnection` meta must resolve to the correct author per tier.
- Remove the root-path (`/`) reference that caused the `jcr:propertyDefinition[2]` 400.
- Interim: publish via Sidekick / Admin API until UE routing is fixed.

## Setup Workstreams

### A. Code plane (Azure DevOps → GitHub mirror → Code Sync)
- Identify the GitHub repo already backing the live site; confirm Code Sync app scope (that repo only).
- Stand up Azure→GitHub mirror pipeline: branch-scoped (`dev`/`uat`/`stage`/`main`), ff-only, credential in **Azure Key Vault**, never in-band; document as outbound-only.
- Branch protection + review + CI (lint, `build:json`) in Azure as promotion gates.

### B. Repoless / site configuration (replaces `fstab.yaml`)
- Per-tier site configs via Admin API (content source, access/auth, prod domain). No committed `fstab.yaml`/`.hlxignore`/`helix-*.yaml` per site. Config-as-code stored in Azure DevOps.

### C. Content plane (two authors + UE)
- Provision/confirm non-prod + prod authors; attach per-tier Edge Delivery config; wire UE entry points; Sidekick optional. Content-promotion runbook (non-prod→prod, four-eyes).

### D. Access, compliance & SEO (banking-critical)
- Gate all non-prod (auth/IP allowlist) + `noindex`. Prod-only: custom domain, real sitemap/robots, BYO-CDN + push-invalidation, WAF/security headers. Segregation of duties on prod publish.

### E. Security & governance artifacts (for the bank's review)
- **Data-flow diagram** with trust boundaries (the diagram above, formalized) showing Adobe's access stops at the GitHub mirror.
- **Repo-hygiene control:** secret-scanning + PR gate so no secrets/back-end code ever reach the GitHub mirror (front-end is public by design).
- **Egress statement:** flows are outbound from your tenant; no inbound Adobe/GitHub access to Azure DevOps or your network.
- **Access-revocation runbook:** uninstall Code Sync GitHub App / rotate Key Vault mirror credential.

## Deliverables
1. **Architecture + security doc** (Azure→GitHub→Code-Sync data-flow with trust boundaries, "Adobe has no Azure DevOps access" statement, repoless content plane, two-author wiring, UE↔Admin-API binding, access/compliance matrix, promotion/rollback runbooks, diagrams).
2. **Config-as-code manifest** — per-tier Admin API `config` payloads, in Azure DevOps.
3. **Runbooks** — content promotion, UE Publish troubleshooting, access-revocation.

## Checklist / Todo List
- [ ] **Produce the security data-flow diagram + trust-boundary statement** for the bank: Adobe reads **only** the GitHub mirror; **no access to Azure DevOps / your network**; flows outbound-only.
- [ ] Document **Adobe Code Sync GitHub App scope** (mirror repo only) + revocation path (uninstall app, rotate Key Vault credential).
- [ ] **Confirm the platform constraint** on aem.live/Adobe docs: EDS front-end delivery requires GitHub + Code Sync (Azure DevOps / Cloud Manager Git are not Code Sync sources).
- [ ] Raise the **residency point** with security: the front-end code copy resides in GitHub (Microsoft); confirm acceptable, since front-end is public and holds no secrets.
- [ ] Enforce **repo hygiene**: secret-scanning + PR gate; no secrets/back-end/core-banking code in the mirror.
- [ ] Confirm **content plane is git-independent** (authored content never enters GitHub) — reassures security re: sensitive content.
- [ ] Identify the GitHub repo already backing `sample-eds`; confirm Code Sync app install + scope.
- [ ] Stand up Azure→GitHub mirror pipeline (branch-scoped, ff-only, Key Vault credential, outbound-only); branch protection + CI in Azure.
- [ ] Create `dev`/`uat`/`stage` branches; confirm each delivers to its edge host; `main` = prod.
- [ ] Attach Edge Delivery Services config to content tree so UE Publish → `admin.hlx.page` (not `/bin/replicate`); verify `aemconnection` meta + UE auth; remove root-path (`/`) reference; re-test UE Preview/Publish.
- [ ] Confirm tier count, non-prod folder-scoping, prod custom domain + CDN.
- [ ] Create per-tier site configs via Admin API; store config-as-code in Azure DevOps.
- [ ] Provision/confirm non-prod + prod authors; bind each config to its author/path.
- [ ] Non-prod gating + `noindex`; prod-only domain, sitemap/robots, CDN invalidation, security headers.
- [ ] Define code-promotion (Azure branch chain → mirror) + content-promotion (non-prod→prod) runbooks; four-eyes on prod.
- [ ] Write architecture + security doc + runbooks + diagrams; add MEMORY.md pointer.
- [ ] Self-review: no committed `fstab.yaml`/`.hlxignore`/`helix-*.yaml` per site; Code Sync on GitHub (not Azure/CM Git); no secrets in mirror; no in-band credentials.

---
*This artifact is the plan, extended with the **security model** the bank asked for. Bottom line for the security team: **Adobe has zero access to Azure DevOps** — Adobe's Code Sync reads only a GitHub mirror repo; the Azure→GitHub link is an outbound push using a credential you hold in Azure Key Vault; content never traverses git at all. The one item genuinely needing the bank's sign-off is that EDS mandates a **GitHub** mirror for front-end delivery (a copy of public front-end code resides in GitHub). Producing the docs/diagrams and running the fixes are modification actions and **require Execute mode** — plan mode is read-only. The GitHub-required constraint and Code Sync app scope should be reconfirmed against current Adobe/aem.live docs during execution.*

*Optional: enabling the **project-management** plugin would let me generate a formal, shareable handover/security-architecture PDF for the bank's review — say the word and I'll enable it (no settings changed without your go-ahead).*
