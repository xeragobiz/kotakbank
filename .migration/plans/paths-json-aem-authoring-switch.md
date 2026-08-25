# `paths.json`, AEM Authoring & Using Adobe Cloud Manager Git (incl. "BYOG")

## 1 · What `paths.json` Is

`paths.json` is a **path-mapping / routing configuration file** in Edge Delivery Services (EDS). It translates between where content physically lives in the content source and the clean public URLs your site serves.

- Sits in the repo root alongside `fstab.yaml`.
- Defines `mountpoint → path` rewrite rules (strip an org/site prefix, remove an index folder, rewrite a source folder to a friendly URL).
- Most commonly needed with **Document Authoring (DA / da.live)** and Google Drive / SharePoint sources.

**Do you need it when switching to AEM authoring? No.** This repo has no `paths.json`; `fstab.yaml` mounts an AEM author via `franklin.delivery` (`type: "markup"`), which resolves content paths directly. Add one only for a specific rewrite the mountpoint can't express.

---

## 2 · Cloud Manager Git for EDS delivery — No

Cloud Manager's Git + pipelines belong to the *traditional* AEMaaCS stack (Maven build → deploy Java/OSGi/HTL to servers). EDS has **no build, no artifact, no deploy target** — the branch *is* the environment, and code reaches the edge only through **AEM Code Sync**. A Cloud Manager pipeline has nothing to build or deploy here. (This project uses AEMaaCS only as a *content source* via `fstab.yaml`, not for code deploy.)

---

## 3 · "Can we bring Cloud Manager Git as BYOG (Bring Your Own Git)?"

**Short answer: No — Code Sync is not a Bring-Your-Own-Git platform, and Cloud Manager Git cannot be registered as its source.**

### Why "BYOG" doesn't apply to Code Sync
- **AEM Code Sync is a GitHub App.** It installs onto a GitHub org/repo and reacts to **GitHub** push/PR webhooks. There is no configuration where you point it at an arbitrary Git remote (GitLab, Bitbucket, Azure Repos, or Adobe's Cloud Manager Git) and have it publish to the edge.
- **Cloud Manager Git is a managed Git for the Cloud Manager build pipeline**, not a Code Sync source. It's designed to feed a Maven pipeline, not the EDS edge. So it can't be "brought" as the Git behind an EDS site.
- **"BYO" in the aem.live world refers to other things** — chiefly **BYO CDN** (put your own CDN like Akamai/Fastly/CloudFront in front of `.aem.live`) and BYO DNS/domain. It does **not** mean bring-your-own source-Git for Code Sync. Don't conflate BYO CDN with a BYOG code source; they solve different problems.

### The only supported pattern: mirror into GitHub
Because Code Sync accepts GitHub only, any other Git (Cloud Manager Git, Azure DevOps, GitLab) can be your **system-of-record**, but it must **mirror one-way into the GitHub repo Code Sync watches** (`xeragobiz/kotakbank`):

- Enterprise Git = system-of-record (developers, PRs, branch policies, CI).
- A push-triggered mirror pushes the env branches (`dev`/`uat`/`stage`/`main`) to GitHub.
- GitHub is downstream/mirror-only — nobody edits it directly; if it diverges, upstream wins.
- Mirror credential lives in a secret vault — never committed, never pasted in chat.

This is exactly the pattern documented for Azure DevOps in `docs/handbook/12-environments-and-promotion.md`; it applies identically if Cloud Manager Git is the mandated source-of-record.

**Bottom line:** you cannot make Code Sync consume Cloud Manager Git as a BYOG source. Keep Cloud Manager Git (if policy requires it) as an upstream system-of-record and **mirror to GitHub → Code Sync → edge.** Practically, though, if there's no hard policy forcing Cloud Manager Git, using GitHub directly is simpler and removes the mirror entirely.

> Verify against current aem.live docs before building the mirror: if Adobe has since shipped a supported non-GitHub Code Sync source or a generic webhook path, prefer that and drop the mirror. As of this repo's guidance, GitHub-only holds.

---

## Checklist

- [ ] Confirm no `paths.json` is needed (none exists; `fstab.yaml` mountpoint handles routing)
- [ ] Acknowledge Cloud Manager Git + pipelines are the traditional-AEMaaCS deploy model, not used for EDS delivery
- [ ] Acknowledge Code Sync is **GitHub-App based** — no Bring-Your-Own-Git source; Cloud Manager Git cannot be registered as its source
- [ ] Don't conflate **BYO CDN/DNS** (supported) with BYO source-Git (not supported)
- [ ] If Cloud Manager Git (or any non-GitHub Git) must be system-of-record, design a **one-way mirror** to `xeragobiz/kotakbank` on GitHub
- [ ] Mirror only the env branches (`dev`/`uat`/`stage`/`main`), fast-forward-only; GitHub stays downstream/read-only
- [ ] Store the mirror credential in a secret vault — never committed, never in chat
- [ ] Re-verify against current aem.live whether a non-GitHub Code Sync source now exists before building the mirror
- [ ] Consider whether GitHub-direct (no mirror) is acceptable — simplest path if no policy forces Cloud Manager Git

## Notes

- Explanatory plan — no file changes proposed. **Executing** anything (mirror pipeline, `paths.json`, `fstab.yaml` edits) requires **Execute mode**.
- Branch-per-environment model and mirror mechanics: `docs/handbook/12-environments-and-promotion.md`.
