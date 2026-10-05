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
| `index.html` | The landing page. All fourteen sections: header, hero, credibility strip, problem, how it works, capabilities, career-matching preview, audiences, roadmap, team, FAQ, waitlist, partner enquiry, footer. Both Tally forms open in modals at the foot of the file. |
| `thanks.html` | Post-submit confirmation. Point Tally's "redirect on submit" here. |
| `privacy.html` | **Placeholder.** Explains what the waitlist collects and what the policy still has to cover. Not a policy. Linked from the form consent text and the footer. |
| `terms.html` | **Placeholder.** Lists what the real terms must settle. Linked from the footer. |
| `css/tokens.css` | Design tokens copied from the product dashboard, plus the dark theme and the fixed-dark hero tokens. One deviation is annotated in the file. |
| `css/main.css` | Layout, components and all sections. Numbered sections at the top, responsive at 1200 / 900 / 640px. |
| `js/main.js` | Tally config + embeds, attribution parameters, theme toggle, mobile nav, FAQ accordion, contact modal, footer year. |
| `assets/logo.png` | The real EdPal logo (540×411, transparent). Copied from the product repo: `core/static/core/img/edpal-logo.png`. |
| `assets/hero/` | Empty. Left empty on purpose — see §6. |
| `assets/screenshots/` | Empty. The hero falls back to a token-built product panel; see §6. |
| `assets/icons/` | Empty. All UI icons are inline SVG in `index.html`, so they inherit `currentColor` and cost nothing to load. |

---

## 2. Preview locally

```bash
cd edpal_landing
python -m http.server 8000
```

Then open <http://localhost:8000>.

Serve it over HTTP, not `file://`. Opening `index.html` directly may work for the
layout, but browsers block or mis-size cross-origin iframes from `file://`, so the
Tally forms inside `index.html` and the contact modal will not appear.

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
  contact:  "https://tally.so/embed/REPLACE_CONTACT_ID"   // ← Form B, still to paste
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
| `[year]` ×3, `[cutoff]` ×3 | Career-matching section, the cluster cutoff table |

**Silent, markup-only** — change `data-optional="pending"` to `data-optional="filled"` to show it:

| Placeholder | Where |
|---|---|
| `[count from DB]` | `index.html`, credibility strip, last item. For real careers / courses / institutions counts once the team has them. Hidden by default so no invented figure appears. |

**Comments in the markup (`TODO(team)`) — must be replaced, not deleted:**

| Placeholder | Where |
|---|---|
| `assets/logo.png` as the Open Graph image | `index.html` `<head>`. A 1200×630 image is needed; the logo is a stopgap so `og:image` is not empty. |
| Founder bio | `index.html`, team section — currently a factual one-liner about the role. |
| CTO bio | Same. |
| `hello@edpal.co.ke` | Footer, thanks page, both form fallbacks, privacy and terms pages. Confirm the mailbox works before launch. |
| Canonical URL `https://edpal.co.ke/` and `og:url` | `index.html` `<head>`. |
| Social profile URLs | *Intentionally absent.* No verified profile URLs were supplied, so **no social icons exist anywhere on the page** — an icon pointing at `#` is worse than no icon. Add them only with real URLs. |

**Fixed in the page, worth a second look:**

- The hero panel and the career-matching card are **illustrative**. Both carry a visible
  note saying so. Their numbers are examples; the career, cluster and course names come
  from the KUCCPS-aligned data set.
- The cluster-cutoff table has no numbers at all yet — only its structure and
  `[year]` / `[cutoff]` cells.

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
- **Theme contract** matches the product exactly: `localStorage["reg_theme"]`, where
  `"light"` means light and anything else means dark, applied as `<html class="theme-dark">`.
  The anti-flash script is inline in `<head>` above the stylesheets, wrapped in
  `try/catch` because storage can be unavailable.
- **Single dark surface.** The hero band is a flat, solid navy (`#141C2F`) — no gradient.
  *This was changed after review:* the first draft used the product's navy radial-gradient
  treatment, which at full page width read as decoration and made the page feel generated.
  There is now **no gradient anywhere on the site**. The page background is flat `--alt-bg`
  or `--alt-surface-mut`; the product panel inside the hero uses its own fixed dark tokens
  so it reads as a screen sitting on the band rather than as more band.
- **One primary button per screenful.** The hero and the waitlist section each have one;
  every other call to action is secondary or ghost.
- **Both Tally dialogs use a fixed light shell**, independent of `html.theme-dark`, because
  Tally renders its own light palette. See §3.
- **No webfonts other than JetBrains Mono**, at weights 400 and 500, used only for
  numbers. UI text uses the system stack.
- **No JavaScript dependencies.** `js/main.js` is plain ES5-compatible-style modern JS
  with no imports. It loads with `defer`.
- **Reduced motion** turns off every transition and the smooth scroll.
