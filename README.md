# EdPal — pre-launch landing page

A standalone static site for EdPal's early-access (waitlist) campaign. No build step, no
framework, no server-side code. Open it or serve it and it runs.

EdPal is a Kenya-based assessment platform that helps learners discover their strengths
and match them to the right careers. This page is aimed at learners aged 12–18 in Kenya,
their parents, and the teachers and schools who would pilot it.

---

## 1. File map

| File | Purpose |
|---|---|
| `index.html` | The landing page. Header, hero (classroom photo + results panel), credibility strip, problem, how it works with the demo video, capabilities, career-matching preview, audiences, roadmap, team, FAQ, waitlist, partner enquiry, footer, and three dialogs (two Tally forms + enlarged video). |
| `thanks.html` | Post-submit confirmation. Point Tally's "redirect on submit" here. |
| `privacy.html` | **Placeholder.** Explains what the waitlist collects and what the policy still has to cover. Not a policy. Linked from the form consent text and the footer. |
| `terms.html` | **Placeholder.** Lists what the real terms must settle. Linked from the footer. |
| `css/tokens.css` | Design tokens, dark theme, the fixed-dark hero tokens, the font stack and the type scale. Deviations from the product dashboard are annotated in the file. |
| `css/main.css` | Layout, components and all sections. Numbered sections at the top, responsive at 1200 / 900 / 640px. |
| `js/main.js` | Tally config + embeds, attribution, reduced-motion guard, theme toggle, mobile nav, FAQ accordion, all three modals, motion, footer year. |
| `assets/logo.png` | The real EdPal logo (540×411, transparent). From the product repo: `core/static/core/img/edpal-logo.png`. |
| `assets/hero.jpg` | Hero background photograph: a Kenyan secondary classroom. 1279×854, 111.6 KB. **Attribution still owed — see §5.** |
| `assets/EdPal.mp4` | Product demo. 16.2 s, 1280×532 (2.41:1), H.264 plus one audio track, 2.51 MB. |
| `assets/poster/poster.png` | Video poster frame. 1920×1080, 743 KB. **Has burnt-in video-editor chrome and a mouse cursor — see §5.** |
| `assets/screenshots/` | Empty. The hero uses the token-built results panel instead; see §6. |
| `assets/icons/` | Empty. All UI icons are inline SVG in `index.html`, so they inherit `currentColor` and cost nothing to load. |

---

## 2. Preview locally

```bash
cd edpal_landing
python -m http.server 8000
```

Then open <http://localhost:8000>.

Serve it over HTTP, not `file://`. Opening `index.html` directly may work for the
layout, but browsers block or mis-size cross-origin iframes from `file://`, so theTally forms inside `index.html` and the contact modal will not appear.

All asset paths are relative with no leading `/`, so the folder can be dropped at any
path on any host — `example.com/`, `example.com/edpal/`, a GitHub Pages subpath — without
edits. If the page later moves into the Django product, only the `href`/`src` values in
the four HTML files need touching; nothing else assumes a location.

---

## 3. Tally forms — the two form URLs

Two forms, one place to edit. Open `js/main.js` and set both URLs in the `TALLY` object
near the top. **Both forms now open in a modal**, so there is no form URL anywhere in the
HTML — the dialogs build their own iframes from this object.

```js
const TALLY = {
  waitlist: "https://tally.so/embed/Npepop",              // ← Form A, already set
  contact:  "https://tally.so/embed/jaOpMY"   // ← Form B, still to paste
};
```

**Status: the waitlist URL is filled in (`Npepop`). The contact/enquiry URL is still a
placeholder.** Get it from Tally: **Share → Embed**, copy the `https://tally.so/embed/XXXXXX`
URL, and paste it in whole.

While a URL is missing, the dialog does not show an empty box — it shows a written
fallback with a direct link to `hello@edpal.co.ke`. The same fallback appears if the Tally
widget is blocked or offline.

**Shell colours.** Tally renders its own light palette, so both dialog shells are a fixed
light surface with fixed dark text; they are deliberately **not** wired to the page theme
(see `css/main.css`, section 16). A page-themed shell would put dark chrome around a light
form in dark mode. If Tally is ever switched to render in dark, the shell tokens have to
change with it.

**Also do these two things in Tally:**

1. Set **redirect on submit** to `thanks.html` for both forms, so a submission lands on
   the confirmation page rather than Tally's own thank-you screen.
2. Add three **hidden fields** to each form, named exactly `source`, `utm_source` and
   `utm_campaign`. The page appends them to the embed URL; if the hidden fields do not
   exist in the Tally form, the values are simply dropped. `source` is
   `landing_waitlist` or `landing_enquiry`; the UTM values are read from the landing
   page's own query string and fall back to `direct`.

> **Unverified in this build:** I could not run the page against a live Tally account, and
> headless Chrome is blocked in the authoring sandbox, so neither embed has been seen
> rendering. Submit one test entry per form and check the response in Tally before launch.

### Form A — waitlist (modal, section 12)

Full name; email; *"I am a…"* (learner, parent/guardian, teacher, careers master, school
admin, other); phone/WhatsApp with `+254` default; county (Kenyan counties); school or
institution **only for teacher / careers master / school admin**; approximate number of
learners **same condition**; cohort (Form 1–4, KCSE candidate, gap year, other); how did
you hear about us; product-updates consent; and a required **privacy consent** checkbox
linking `privacy.html`. The two consents stay separate — early access must not depend on
agreeing to marketing.

### Form B — get in touch (modal, section 13)

Full name; email; organisation; reason for contact (feature request, partnership or
sponsorship, bring EdPal to our school, report a bug, join the team, media and press,
something else) driving conditional blocks:

| Reason | Follow-up questions |
|---|---|
| Feature request | feature area (assessments, career matching, analytics, accounts and profiles, finance, mobile/offline, integrations) + what problem it solves |
| Partnership / sponsorship | organisation type (school, university/TVET, NGO, county government, EdTech, employer, funder, other), partnership type, website or LinkedIn, intended timeline |
| Bring EdPal to our school | learner count, rollout timeline |
| Bug report | page URL, steps, expected vs actual, severity |
| Join the team | role of interest, portfolio URL |

All reasons end with an optional message field and the same required privacy consent.

---

## 4. Privacy

Tally is a third-party processor, so anything submitted through these forms leaves
EdPal's servers. Two rules are built into the page:

- **The waitlist stays thin.** Name, email, role, phone, county, and school details only
  for school-side roles. It does **not** collect grades, KCSE results, dates of birth or
  any other learner record.
- **Consent is stated on the page, not just in the form.** The waitlist section says what
  is being agreed to, that under-18s should submit with a guardian, and that the privacy
  consent links the Privacy Policy.

Do not add learner data fields to these forms without a published policy first.

---

## 5. Placeholders left for the team

Everything below is visible on the page or is required before launch. Nothing on this
list has been filled with a plausible-looking invented value.

**On the page, marked with brackets:**

| Placeholder | Where |
|---|---|
| `[target date]` | Roadmap, "Where we are now" — twice (piloting, public launch) |

**Silent, markup-only** — change `data-optional="pending"` to `data-optional="filled"` to show it:

| Placeholder | Where |
|---|---|
| `[count from DB]` | `index.html`, credibility strip, last item. For real careers / courses / institutions counts once the team has them. Hidden by default so no invented figure appears. |

**Comments in the markup (`TODO(team)`) — must be replaced, not deleted:**

| Placeholder | Where |
|---|---|
| **Hero photo attribution** | **Owed. Nothing is credited on the page yet because the photographer and source were not supplied.** Pexels and Unsplash both require attribution as a condition of use. Tell me the photographer name and photo URL and I will add a discreet credit — in the footer, or as a small line at the bottom of the hero. This is a licensing obligation, not a nicety. |
| `assets/logo.png` as the Open Graph image | `index.html` `<head>`. A 1200×630 image is needed; the logo is a stopgap so `og:image` is not empty. |
| Founder bio | `index.html`, team section — currently a factual one-liner about the role. |
| CTO bio | Same. |
| `hello@edpal.co.ke` | Footer, thanks page, both form fallbacks, privacy and terms pages. Confirm the mailbox works before launch. |
| Canonical URL `https://edpal.co.ke/` and `og:url` | `index.html` `<head>`. Was `href="#"`, which de-indexes the page; now set to a placeholder host that must be corrected to the live URL. |
| Social profile URLs | *Intentionally absent.* No verified profile URLs were supplied, so **no social icons exist anywhere on the page** — an icon pointing at `#` is worse than no icon. Add them only with real URLs. |

**Added by the team, not authored here — verify before launch:**

| Item | Why it needs checking |
|---|---|
| Cluster 7 cutoff figures (2025: 34.046, 2024: 32.452, 2023: 31.181) | These appeared in `index.html` outside this build. I did not write them and could not verify them against a KUCCPS source in this environment. If they are real, the illustrative note next to the table should say so and name the source; if they are examples, they need to be marked as such. |
| Tally waitlist URL `Npepop` | Wired into `TALLY.waitlist`. Test one submission end to end. |

**Fixed in the page, worth a second look:**

- The hero panel and the career-matching card are **illustrative**. Both carry a visible
  note saying so. Their numbers are examples; the career, cluster and course names come
  from the KUCCPS-aligned data set.

---

## 6. Assets

| Folder | Status |
|---|---|
| `assets/logo.png` | **Present and real.** 540×411, transparent, `#0A5599` with a teal `#00A5B9` P. Rendered at its natural aspect ratio with `object-fit: contain`, at 34px in the header and 30px in the footer. No tile, no background behind it. On the navy hero and in dark mode it gets `filter: brightness(1.7) saturate(1.2)`; on light surfaces it does not. |
| `assets/screenshots/` | **Empty.** No product screenshots were supplied, so the hero uses a product panel built from the real tokens instead — see below. |
| `assets/hero/` | **Empty.** Left empty deliberately. A stock photograph of students at a desk was not used. |
| `assets/icons/` | **Empty.** Every UI icon is inline SVG, `aria-hidden="true"` where decorative, 1.7–2px stroke, consistent size within each group. |

**When a real screenshot arrives**, replace `<figure class="panel">` in `index.html` with:

```html
<img src="assets/screenshots/results.png" width="1200" height="800" loading="eager"
     alt="EdPal results screen showing a score, subject grades and ranked career matches"
     style="border:1px solid var(--alt-border);border-radius:var(--alt-r-lg);box-shadow:var(--alt-shadow-lg)">
```

Keep the real `width`/`height`, keep `loading="eager"`, and **check that the screenshot
does not contradict the copy** — if it shows something EdPal cannot do, do not use it.

---

## 7. Launch blockers

1. **Privacy Policy** — `privacy.html` is a placeholder, not a policy. The required
   disclaimer in the footer and the text in that file should be removed once a real policy
   is published by someone qualified to write it.
2. **Terms of Use** — `terms.html` is a placeholder. It must at minimum state that
   KUCCPS-aligned means the data follows the KUCCPS course model, and that KUCCPS does not
   operate or endorse EdPal.
3. **Real roadmap dates** — the two `[target date]` placeholders.
4. **Real career / course / institution counts** — for the credibility strip and the
   `data-optional` slot.
5. **Confirmed guardian-consent wording** — the page currently says a parent or guardian
   should submit the form with an under-18. That sentence needs sign-off, and the
   published policy needs the matching clause.
6. **A real Open Graph image** in `assets/screenshots/`.
7. **The contact/enquiry Tally URL** pasted into `TALLY.contact` in `js/main.js` (the
   waitlist URL is already set), hidden fields added to both forms, redirect to
   `thanks.html` set, and one test submission per form.
8. **Confirmed contact mailbox** for `hello@edpal.co.ke`.
9. **Hero photo attribution** — see §5. Required by both Pexels and Unsplash.
10. **A clean poster frame** for the video, plus confirmation that the recording still
    matches the page. See §6.
11. **The cluster cutoff figures verified** against a KUCCPS source — see §5.

---

## 8. Design and implementation notes

- **Tokens** in `css/tokens.css` are copied from
  `accounts/static/accounts/css/dashboard_alt.css` in the EdPal product repo, so this page
  sits in the same lineage as the Pathfinder learner dashboard. Do not invent colours here.
- **One deliberate deviation, annotated in the file:** `--alt-text-2` and
  `--alt-text-muted` are darkened on this page only. The product values (`#667085`,
  `#98A2B3`) measure 4.48:1 and 2.43:1 against `--alt-surface-mut`, which fails WCAG AA
  for the 11.5–14px text they are used for here. The replacements measure 4.88:1 and
  4.73:1. The dashboard is untouched. If the product re-tunes these tokens, re-run the
  contrast check before copying them back.
- **Fonts** were changed on request from the system stack to **Plus Jakarta Sans**
  (headings, 500/600/700) plus **Nunito Sans** (body, 400/500/600), loaded from Google
  Fonts, with the system stack retained as fallback and JetBrains Mono still numbers-only.
  The reasoning is in `css/tokens.css`. The whole type scale was retuned for the new
  metrics. To go back to zero webfonts, remove the two families from the Google Fonts link
  and point `--alt-font` / `--alt-display` at the system stack — but expect to re-tune
  every size, because Nunito Sans has a smaller x-height than Segoe UI or Roboto.
- **Theme contract** matches the product exactly: `localStorage["reg_theme"]`, where
  `"light"` means light and anything else means dark, applied as `<html class="theme-dark">`.
  The anti-flash script is inline in `<head>` above the stylesheets, wrapped in
  `try/catch` because storage can be unavailable. The same script sets `html.js-motion`.
- **The hero** is the classroom photograph (`assets/hero.jpg`) with a directional scrim
  over it and the token-built results panel on top. The scrim is the only gradient on the
  site and it is functional: it holds white text at WCAG AA over a photograph whose left
  third measures 0.19 average luminance and 0.47 at the 90th percentile. The left 38% of
  the scrim is solid `#141C2F`. **Do not lighten it without re-running the contrast
  check** — the 11.5px status line only clears 4.5:1 against the solid region. There is a
  `@supports not (background: color-mix(...))` fallback for browsers without `color-mix`.
- **Motion** uses **anime.js v4** from jsDelivr (UMD build, pinned to 4.2.2, exposes
  `window.anime`). v4 changed the API from v3: `anime()` is now `animate()`. Six elements
  animate, each with its own distinct transition, as requested: the logo fades up on load,
  the hero panel rises and then its meters fill and its subscore bars stagger, the
  recommendation card slides in from the left, the cut-off table's rows drop in staggered
  by 55ms, the demo frame zooms out from 96%, and the enlarged player scales from 94%.
  Scroll reveals use one `IntersectionObserver` at threshold 0.15, and each element is
  unobserved after it fires.
- **The motion fallback chain matters.** Elements that anime.js will animate start hidden
  only under `html.js-motion`, which the inline `<head>` script sets. If anime.js fails to
  load, if `IntersectionObserver` is missing, or if the user prefers reduced motion,
  `js/main.js` reveals every element immediately instead of animating it. There is also a
  2.5-second safety timer for anything already on screen. **Nothing is ever left invisible
  because a script or a CDN did not arrive.**
- **Reduced motion is guarded in JavaScript, not only CSS.** The
  `@media(prefers-reduced-motion)` block neutralises CSS transitions, but anime.js writes
  inline styles and would ignore it entirely, so every animation checks `matchMedia` first.
- **One primary button per screenful.** The hero, the waitlist section and the mobile nav
  each have one; every other call to action is secondary or ghost.
- **All three dialogs share one behaviour:** focus moves in, Tab stays inside, Escape
  closes, focus returns to the trigger, the backdrop cancels. Closing the enlarged video
  also pauses it, so audio never keeps playing behind a closed dialog.
- **The demo video** is 1280×532 (2.41:1), so the frame uses the video's own
  `aspect-ratio` rather than 16:9, and `preload="none"` keeps 2.5 MB off the initial load.
  The poster is the only video asset fetched up front.
- **No npm, no build step.** `js/main.js` is plain modern JS with no imports and no
  bundler; anime.js is a CDN `<script>` tag.
