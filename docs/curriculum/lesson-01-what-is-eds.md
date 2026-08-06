# Lesson 01 — What EDS Is and Why It Exists

> Tier 1 · Foundations · Prerequisites: none

## 1. Theory

**Adobe Edge Delivery Services (EDS)** is a way of building and serving websites where the **content lives in ordinary documents** (Google Docs, Microsoft Word, or a document-authoring UI) or in a Git repository, and the **presentation lives in a GitHub repo** of vanilla JavaScript and CSS. A globally distributed edge network stitches the two together and serves finished HTML in milliseconds.

You will hear several names for the same thing:
- **Edge Delivery Services (EDS)** — the current Adobe product name.
- **Adobe Helix** — the internal/engineering name; you still see it in file names (`helix-query.yaml`) and hostnames (`*.aem.page`).
- **Franklin** — the former community nickname.
- **`aem.live`** — the documentation and delivery domain.

The single most important idea: **content and code are decoupled and independently published.** An author edits a document and hits "Preview"; a developer pushes code to GitHub. Neither blocks the other. The edge combines them on request.

### The mental model in one sentence

> Authors write **semantic content**; developers write **decoration** (JS/CSS) that progressively enhances that content into a designed, interactive page.

### What EDS is *not*

This trips up everyone with a traditional AEM background. EDS has:
- **No Java, no Maven, no OSGi, no Sling, no HTL/Sightly templates.**
- **No application server** you deploy a WAR/JAR to.
- **No Dispatcher**, no `.content.xml`, no JCR repository you code against.
- **No build step / no transpilation** — the JS and CSS you commit is what the browser runs.

If a task tells you to write a Sling Model or an HTL template, you are in the wrong technology. (Lesson 08 maps each traditional concept to its EDS equivalent.)

## 2. Architecture

At the highest level there are three planes:

```
 ┌─────────────────┐        ┌──────────────────────┐        ┌─────────────────────┐
 │  CONTENT PLANE  │        │     CODE PLANE        │        │   DELIVERY PLANE     │
 │                 │        │                       │        │                      │
 │  Google Docs /  │        │  GitHub repo          │        │  Edge / CDN          │
 │  Word / SharePt │        │   blocks/  scripts/   │        │   *.aem.page (prev)  │
 │  or Document    │  --->  │   styles/  models/    │  --->  │   *.aem.live (live)  │
 │  Authoring (DA) │        │   head.html fstab.yaml│        │                      │
 │  or AEM author  │        │                       │        │  serves final HTML   │
 └─────────────────┘        └──────────────────────┘        └─────────────────────┘
        │                            │                                 ▲
        │  "Preview"/"Publish"       │  git push → AEM Code Sync       │
        └────────────────────────────┴─────────────────────────────────┘
                              combined at the edge on request
```

- **Content source** is mounted via `fstab.yaml` (a Google Drive folder, SharePoint site, a Document Authoring org/repo, or an AEM author instance).
- **Code** is a GitHub repo. **AEM Code Sync** (a GitHub App) watches pushes and publishes them to the edge automatically — there is no manual deploy.
- **Two environments per branch:** `https://<branch>--<repo>--<owner>.aem.page/` (preview) and `.aem.live/` (production, from `main`).

### Request lifecycle (simplified)

1. Browser requests `/products/811`.
2. Edge fetches the content source's rendered **semantic HTML** for that path (cached).
3. `head.html` loads `aem.js` + `scripts.js` + `styles.css`.
4. `scripts.js` runs a three-phase decoration (eager → lazy → delayed, Lesson 07): it finds **sections** and **blocks** in the DOM, loads each block's JS/CSS on demand, and calls its `decorate()` function.
5. The page is progressively enhanced in place. First paint is fast because raw content is already valid HTML.

## 3. Engineering rationale

**Why decouple content from code?**
- **Speed of authoring.** Marketers edit a doc and preview instantly, with zero developer involvement and no deployment.
- **Speed of delivery.** Because base content is already valid HTML, the Largest Contentful Paint (LCP) element can render before most JS runs. EDS targets **Lighthouse 100**.
- **Simplicity of the code plane.** No server, no build, no framework churn. The skill set is "web platform," not "a specific CMS's Java API." Code is trivially reviewable in a PR.

**Why the edge/CDN model?** Content is effectively static once published, so it caches beautifully and scales without an app tier. Dynamic behavior is pushed to the client (progressive enhancement) or to small edge functions — not a monolith.

**The trade-off:** you give up server-side rendering of complex, per-request personalization *by default*. Personalization becomes a client-side or edge concern (Lesson 15). For content/marketing sites — EDS's target — that trade is overwhelmingly worth it.

## 4. Examples

**The same heading, three ways it exists in the pipeline.**

Author types in a doc:
```
# Welcome to Kotak811
```

Content source delivers semantic HTML (`/page.plain.html`):
```html
<h1>Welcome to Kotak811</h1>
```

After `scripts.js` decorates the page, it's wrapped in section structure the CSS can target:
```html
<main>
  <div class="section">
    <div class="default-content-wrapper">
      <h1 id="welcome-to-kotak811">Welcome to Kotak811</h1>
    </div>
  </div>
</main>
```

Notice: **the author never saw HTML**, and the developer never had to build a "heading component." The platform did the plumbing.

## 5. Hands-on exercises

1. **Explore a live EDS site.** Open any `*.aem.live` site. Append `.plain.html` to a page path and view source — see the raw semantic HTML before decoration. Then append `.md` to see the markdown-ish source.
2. **Name-mapping drill.** For each term, write its EDS reality: *Dispatcher, HTL, Sling Model, OSGi service, Maven build.* (Answers: none/edge CDN; JS `decorate()`; JS `decorate()`; ES module; there is no build except JSON aggregation.)
3. **Draw the three planes** from memory and label the arrows (`git push → Code Sync`, `Preview → edge`).

## 6. Common mistakes

- **Assuming a build step.** Newcomers look for `webpack`/`vite`. There is none; the browser runs your source directly.
- **Bringing AEMaaCS habits.** Trying to create `.content.xml`, `pom.xml`, or HTL templates. These don't belong here and will confuse tooling.
- **Confusing preview and live.** `.aem.page` = preview (per branch); `.aem.live` = published production (from `main`).
- **Editing generated/aggregate files by hand** (you'll meet these in Lesson 04).

## 7. Review questions

1. In one sentence, what does EDS decouple, and what stitches the two together?
2. What publishes your code to the edge, and what triggers it?
3. Why can EDS render the LCP element before most JavaScript executes?
4. List three traditional AEM technologies that do **not** exist in EDS.
5. What's the difference between `*.aem.page` and `*.aem.live`?

## 8. Best practices

- **Always inspect delivered markup** (`curl .../path.plain.html`) before writing code — never assume the DOM.
- **Keep the code plane minimal.** Every KB ships to the browser; there's no bundler to hide behind.
- **Treat content authors as first-class users.** The whole model exists to empower them; design blocks with authoring ergonomics in mind (Lesson 09).
- **Learn the platform, not a framework.** HTML/CSS/JS fundamentals *are* the EDS skill set.

## 9. Anti-patterns

- **Force-fitting a SPA framework** (React/Angular) as the primary rendering layer — it defeats the fast-by-default architecture and tanks LCP.
- **Server-think:** building request-time logic that assumes an app server. There isn't one.
- **Reintroducing a heavyweight build pipeline** to "modernize" the repo — it adds fragility and drift with no benefit here.
- **Copy-pasting AEMaaCS code** and expecting it to run.

---

**Next:** [Lesson 02 — The Content-First Authoring Model →](lesson-02-content-authoring.md)
