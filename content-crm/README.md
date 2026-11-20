# Content CRM

A CRM for running a UGC content operation: a creator roster, a content pipeline
from idea to live, the products the content sells, and the numbers that say what
to make more of.

Next.js 15 (App Router) · TypeScript · Tailwind CSS v4 · Supabase (Postgres, Auth) ·
deploys to Vercel from git.

---

## What is in it

| Page | What it does |
| --- | --- |
| **Dashboard** | Pipeline count, posted in the last 30 days, blended ROAS, usage rights about to expire, overdue work, top performers, roster snapshot |
| **Pipeline** | Kanban board across nine stages. Drag a card, or change its stage from the dropdown on the card |
| **Content** | Every piece, with search, stage and creator filters, and four sort orders. Full detail page per record with brief, results and an activity log |
| **Creators** | The roster as a relationship pipeline (prospect → outreach → negotiating → active). Per-creator page totals their views, engagement, ad spend, ROAS and cost per thousand views |
| **Products** | What the content is selling, with benefits and pain points for briefs, and content coverage per product |
| **Team** | Admin-only. Promote and demote teammates, revoke access |

Three things worth knowing:

- **ROAS and engagement rate are computed by Postgres**, as generated columns.
  Nothing in the app recalculates them, so they cannot drift.
- **Stage changes are logged automatically** by a database trigger, with who did
  it and when. You can add free-text notes to the same timeline.
- **Roles are enforced in the database**, not just the UI. A viewer cannot write
  even if they hit the API directly.

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

Fill in both values from **Project Settings → API**:

- `NEXT_PUBLIC_SUPABASE_URL` — the Project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — the `anon` / public key

The anon key is safe in the browser. Row level security is what protects the
data, which is why `schema.sql` must be run before anyone signs in. Never put
the `service_role` key in a `NEXT_PUBLIC_` variable.

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

Then in Vercel: **Add New → Project**, import the repo, and add the same two
environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
for Production, Preview and Development. Deploy. Every push to `main` ships.

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
`NICHES` lists in `src/lib/constants.ts`. Existing records keep any value you
remove from the list.

**Add a field.** Add the column in SQL, add it to the type in
`src/lib/types.ts`, read it in the relevant `readForm` in `src/app/actions/`,
and add the input to the form component.

### Layout

```
src/
  app/
    (app)/            Signed-in pages; the layout here holds the sidebar
    actions/          Server actions, one file per table, each checks the role first
    auth/             Magic-link callback and sign-out
    login/
  components/         UI primitives, the board, and the three forms
  lib/
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

- The dashboard reads up to 500 content records and computes its tiles in
  memory. That is fine into the low thousands. Past that, move the aggregates
  into Postgres views and select from those.
- List pages cap at 300 rows with no pagination yet. Filters cover it for a
  while; add a cursor when it does not.
- Card order within a board column uses `board_position`, which is stored but
  not yet reorderable by dragging within a column. Dragging between columns
  changes the stage, which is the part that matters.
- There is no file upload. Raw footage, edited cuts and live posts are URL
  fields, pointing at Drive, Frame.io or wherever the files already live. If you
  want uploads, Supabase Storage plus a `files` column is the natural next step.
- Money is `numeric(12,2)` and displayed as USD. Change the formatters in
  `src/lib/format.ts` for another currency.

## Checks run before delivery

`npx tsc --noEmit` and `npm run build` both pass. `schema.sql` and `seed.sql`
were executed against Postgres 16, and the role rules were tested directly in
the database: a viewer's insert is refused by RLS, a viewer cannot promote
themselves, the last admin cannot be demoted, an admin can promote, and an
editor can write.
