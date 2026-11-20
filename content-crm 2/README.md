# Content CRM

A CRM for running a UGC content operation: a creator roster, a content pipeline
from idea to live, the products the content sells, and the numbers that say what
to make more of.

Next.js 15 (App Router) · TypeScript · Tailwind CSS v4 · Supabase (Postgres, Auth) ·
Recharts · optional Claude API · deploys to Vercel from git.

---

## What is in it

| Page | What it does |
| --- | --- |
| **Dashboard** | Headline tiles, views by week, ad spend against revenue, average views by format, overdue work, top performers, expiring usage rights, roster snapshot |
| **Pipeline** | Kanban board across nine stages. Drag a card, or change its stage from the dropdown on the card |
| **Content** | Every piece, with search, stage and creator filters, and four sort orders. Detail page per record with brief, platform preview, results and an activity log |
| **Creators** | The roster as a relationship pipeline (prospect → outreach → negotiating → active). Per-creator page totals their views, engagement, ad spend, ROAS and cost per thousand views |
| **Products** | What the content is selling, with benefits and pain points for briefs, and content coverage per product |
| **Team** | Admin-only. Promote and demote teammates, revoke access |

Things worth knowing:

- **ROAS and engagement rate are computed by Postgres**, as generated columns.
  Nothing in the app recalculates them, so they cannot drift.
- **Stage changes are logged automatically** by a database trigger, with who did
  it and when. You can add free-text notes to the same timeline.
- **Roles are enforced in the database**, not just the UI. A viewer cannot write
  even if they hit the API directly.
- **Every number shown is a number you entered.** Nothing is predicted or
  estimated.

### Working features

- **Platform preview** — see a hook and caption rendered as a TikTok, Reel or
  Instagram feed post before it goes out, with the caption cut where that
  platform actually cuts it and a warning when the hook is too long to read on
  screen. On the content form it updates as you type.
- **Draft with AI** (optional) — generates five hook variants, a brief, a shot
  list and a caption from the linked product's benefits, pain points and offer,
  plus the creator's notes. Nothing is applied until you click; it is a starting
  point, not an auto-fill. Needs `ANTHROPIC_API_KEY`; without it the button just
  says so and the rest of the app is unaffected.
- **Command palette** — `⌘K` / `Ctrl+K` searches content, creators and products
  and jumps to any page. The search runs through your own session, so it returns
  only what you are allowed to see.
- **Light and dark** — follows the system by default; the toggle in the sidebar
  footer overrides it.
- **Toasts and copy buttons** on hooks and captions.

---

## Setup

### 1. Create the Supabase project

1. Go to [supabase.com](https://supabase.com), create a project, and wait for it
   to finish provisioning.
2. Open **SQL Editor → New query**, paste the whole of `supabase/schema.sql`, and
   run it. It creates the tables, the role system, the triggers and the row level
   security policies.
3. Optional but recommended for the first look: run `supabase/seed.sql` the same
   way. It adds four products, six creators and thirteen content records so the
   dashboard and board are not empty. The bottom of that file has the three
   `delete` statements that clear it again.

### 2. Point the app at it

```bash
cp .env.example .env.local
```

Fill in both Supabase values from **Project Settings → API**:

- `NEXT_PUBLIC_SUPABASE_URL` — the Project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — the `anon` / public key

The anon key is safe in the browser. Row level security is what protects the
data, which is why `schema.sql` must be run before anyone signs in. Never put
the `service_role` key in a `NEXT_PUBLIC_` variable.

To turn on the AI generator, also add `ANTHROPIC_API_KEY` from
[console.anthropic.com](https://console.anthropic.com). It is read only on the
server and never sent to the browser.

### 3. Run it

```bash
npm install
npm run dev
```

Open <http://localhost:3000>. Create your account on the **Create account** tab.

> **The first account to sign up becomes the admin.** Everyone after that starts
> as a viewer. Sign up first, before you share the URL.

If Supabase sends a confirmation email, click the link, then sign in. To skip
confirmation while you are setting up, turn off **Confirm email** in
Authentication → Providers → Email.

### 4. Deploy to Vercel

```bash
git init
git add .
git commit -m "Content CRM"
git branch -M main
git remote add origin git@github.com:YOUR_USER/content-crm.git
git push -u origin main
```

Then in Vercel: **Add New → Project**, import the repo, and add the environment
variables (the two Supabase ones, plus `ANTHROPIC_API_KEY` if you want the
generator) for Production, Preview and Development. Deploy. Every push to `main`
ships.

One thing to do after the first deploy: in Supabase, open
**Authentication → URL Configuration** and add your Vercel URL to **Site URL**
and **Redirect URLs** (include `https://your-app.vercel.app/auth/callback`).
Without it, email sign-in links point back at localhost.

---

## Adding teammates

Send them the app URL. They create an account and arrive as a **viewer**. On the
**Team** page you promote them:

- **Admin** — everything, including changing roles
- **Editor** — can add and edit creators, content and products
- **Viewer** — read only

The app hides write buttons from viewers, and the database refuses their writes
regardless. The last remaining admin cannot be demoted, so you cannot lock
yourself out through the UI. If you ever do lock yourself out, the SQL editor
bypasses that guard:

```sql
update public.profiles set role = 'admin' where email = 'you@brand.com';
```

---

## Changing it

**Add a pipeline stage, goal or deal type.** These are Postgres enums. Add the
value, then mirror it in `src/lib/constants.ts` so it appears in the UI:

```sql
alter type content_status add value 'needs_reshoot' after 'editing';
```

Also add it to the matching union in `src/lib/types.ts` and to the `STATUSES`
array in `src/app/actions/content.ts`, which validates submitted values.

**Add a format, platform or niche.** These are plain text arrays, so nothing in
the database constrains them. Edit the `CONTENT_FORMATS`, `PLATFORMS` or
`NICHES` lists in `src/lib/constants.ts`.

**Change the caption limits.** The per-platform character limits and fold points
live in one table at the top of `src/components/post-preview.tsx`. Instagram's
125-character fold is long-standing; the TikTok and Reels fold points are close
approximations, and platforms change them without notice. Check them against the
app you post from and edit that table.

**Change the AI prompt or model.** The whole prompt is in
`src/app/actions/ai.ts`. Set `ANTHROPIC_MODEL` to use a cheaper or newer model
than the `claude-sonnet-5-5` default.

**Change the chart colours.** The two series hues are CSS variables
(`--color-chart-1`, `--color-chart-2`) in `src/app/globals.css`, with separate
steps for the dark surface. They were checked for colour-vision deficiency
separation and for 3:1 contrast against both surfaces — if you swap them, check
the replacements the same way rather than picking by eye.

**Theme colours.** The `ink-*` scale in `globals.css` is semantic: `ink-50` is
the page, `ink-900` is the title text. The `.dark` block re-points each step,
which is why almost no component needs a `dark:` variant. Colours that must not
flip (the sidebar, the preview phone) use the separate `nav-*` and `device-*`
tokens.

### Layout

```
src/
  app/
    (app)/            Signed-in pages; the layout here holds the sidebar
    actions/          Server actions, one file per table, each checks the role first
      ai.ts           The brief generator. Server-only; the API key stays here
    api/search/       Backs the command palette
    auth/             Magic-link callback and sign-out
    login/
  components/         UI primitives, board, charts, preview, palette, forms
  lib/
    aggregate.ts      Weekly buckets and per-format averages for the charts
    auth.ts           requireProfile / requireWriter / requireAdmin
    constants.ts      Enum labels, colours and tag vocabularies
    format.ts         Number, currency and date formatting
    form.ts           FormData parsing
    supabase/         Browser, server and env helpers
  middleware.ts       Refreshes the session, guards every route
supabase/
  schema.sql          Tables, enums, triggers, RLS policies
  seed.sql            Optional demo data
```

---

## Notes and limits

- The dashboard reads up to 500 content records and computes its tiles and
  charts in memory. That is fine into the low thousands. Past that, move the
  aggregates into Postgres views and select from those.
- List pages cap at 300 rows with no pagination yet. Filters cover it for a
  while; add a cursor when they do not.
- The dashboard ships about 140 kB of chart code. If that matters on mobile,
  lazy-load the three chart components with `next/dynamic`.
- The two time charts include the current, unfinished week, which is noted under
  each one. Weeks with no posts genuinely read zero.
- Card order within a board column uses `board_position`, which is stored but
  not yet reorderable by dragging within a column. Dragging between columns
  changes the stage, which is the part that matters.
- There is no file upload. Raw footage, edited cuts and live posts are URL
  fields, pointing at Drive, Frame.io or wherever the files already live. The
  preview therefore shows a placeholder where the video goes rather than the
  real thing.
- AI output is a draft. The model does not know your real results, so check
  every claim against what the brand can actually say before it ships.
- Money is `numeric(12,2)` and displayed as USD. Change the formatters in
  `src/lib/format.ts` for another currency.

## Checks run before delivery

`npx tsc --noEmit` and `npm run build` both pass. `schema.sql` and `seed.sql`
were executed against Postgres 16, and the role rules were tested directly in
the database: a viewer's insert is refused by RLS, a viewer cannot promote
themselves, the last admin cannot be demoted, an admin can promote, and an
editor can write. The dashboard charts and the post preview were rendered in a
headless browser and inspected in both light and dark mode.
