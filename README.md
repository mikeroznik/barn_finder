# Barn Finder

A mobile-friendly guide to ice rinks, built for hockey. Look up any rink's sheets of ice, seating, parking and amenities, read reviews, browse photos, and find hotels, coffee, hockey stores and food nearby.

Anyone can browse. To add or correct information, review a rink or upload photos, sign up with a name, email and password and verify the email. Admins review every change and can revert, hide or edit anything.

## Features

**Browsing (no account needed)**
- Search rinks by name or any part of the address (street, city, state, ZIP)
- List or map view, with "Nearest to me" sorting
- Distances in miles or kilometers (toggle in the footer, default set by browser locale)
- Light and dark mode, following the device setting

**Rink pages**
- Name, and an address that opens in Google Maps
- Map showing the rink and its nearby places
- Number of sheets (pads) of ice
- Seating and parking: types picked from admin-managed lists, plus notes
- Amenity checklist: restaurant, skate sharpening, pro shop, snack bar, bar, and any amenity admins add later (unchecked by default)
- Photos: one general photo per user per rink
- Reviews: one per user per rink, with optional 1–5 star ratings for Ice quality, Locker rooms, Spectator comfort, Food & drink, and "Other" (the reviewer labels it), plus one photo per rated category
- Average rating per category
- "Last updated by … on …" line

**Places of interest**
- Attached to a rink. Each needs a name, address and category (hotel, coffee shop, hockey store, attraction or restaurant; users can suggest more)
- A shared write-up any user can improve, one comment per user, and one photo per user
- Distance from the rink

**Signed-in users**
- Add rinks and places, and edit their information. Changes go live immediately.
- Write, edit and delete their own reviews, comments and photos
- Suggest new amenities and place categories (shown once an admin approves them)
- Report anything that's wrong or inappropriate

**Admins** (`/admin`)
- Change history showing field-by-field differences, with one-click revert
- Disapprove (hide) or restore rinks, places, reviews, comments and photos
- Reports queue
- Approve or reject suggestions
- Manage all option lists: seating, parking, amenities, rating categories and place categories
- Promote or demote admins
- Edit any review or comment

## Tech stack

- [Next.js 16](https://nextjs.org) (App Router, Server Actions) + React 19 + TypeScript
- [Tailwind CSS 4](https://tailwindcss.com)
- [Supabase](https://supabase.com): Postgres, Auth (email verification) and Storage (photos)
- [Leaflet](https://leafletjs.com) / [react-leaflet](https://react-leaflet.js.org) with [OpenStreetMap](https://www.openstreetmap.org) tiles
- Address lookup: OpenStreetMap [Nominatim](https://nominatim.org)
- Hosting: [Vercel](https://vercel.com)

There's no Google API key: addresses link out to Google Maps, but maps, geocoding and photos don't use Google services.

## Getting started

The app is deployed to **Vercel** with a **Supabase** backend. See **[SETUP.md](SETUP.md)** for step-by-step instructions:

1. Create a Supabase project and run the SQL files
2. Import the repo into Vercel and set two environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
3. Point Supabase Auth at your Vercel URL and update the email templates
4. Sign up with the admin email you configured

Running locally is optional; see the end of SETUP.md.

### Scripts

| Command         | What it does                     |
| --------------- | -------------------------------- |
| `npm run dev`   | Start the dev server on port 3000 |
| `npm run build` | Production build                 |
| `npm run start` | Run the production build         |
| `npm run lint`  | ESLint                           |

## Database

The SQL files in `supabase/` are run in order in the Supabase SQL Editor:

| File | Purpose |
| --- | --- |
| `migrations/20261006000001_schema.sql` | Tables, row-level security, change-history triggers, revert function, search, photo storage bucket, default lists |
| `migrations/20261006000002_admin_users.sql` | Admin-only function that lists users with their emails |
| `seed/rinks_oh_pa_mi.sql` | 87 real indoor rinks in major Ohio, Pennsylvania and Michigan metros (name, address and coordinates). Safe to re-run. |

Security is enforced in the database itself, not just the app:
- **Row-level security:** visitors can only read live content, verified users can only write their own reviews, comments and photos, and only admins can moderate.
- **Triggers:** they stop non-admins from changing moderation status or granting themselves admin.
- **Change log:** every insert, update and delete on user-editable tables is recorded, so admins can revert any change.

The first admin is set by email address in the `app_settings` table (see SETUP.md). After that, admins promote others from `/admin/users`.

## Project structure

```
src/
  app/
    page.tsx, RinkBrowser.tsx   home: search + list/map
    rinks/                      rink pages, add/edit form, reviews, add place
    places/                     place pages, edit form, comments
    suggest/                    suggest amenities / place categories
    (auth)/                     sign up, log in, password reset, check email
    auth/confirm, auth/callback email-link handlers
    account/                    profile, password
    admin/                      overview, changes, reports, suggestions, lists, users
    actions/                    shared server actions (moderation, photos)
  components/                   UI pieces, maps, photo upload/gallery, report button
  lib/                          Supabase clients, auth helpers, types, geo utilities
  proxy.ts                      refreshes the Supabase session on each request
supabase/
  migrations/                   database schema
  seed/                         starter rink data
SPEC.md                         product specification
SETUP.md                        setup and deployment guide
```

## Seed data sources

Rink addresses were checked against rink, municipal and venue websites in October 2026. Coordinates come from OpenStreetMap building locations where available, otherwise from the US Census geocoder. Rinks change names and owners, so users and admins can correct anything in the app.

## Notes

- Supabase's built-in email sender only allows a few emails per hour. Before launch, configure custom SMTP (for example Resend or SendGrid) in Supabase. No code changes are needed.
- Photos are resized in the browser (longest edge 1600px, JPEG) before upload to keep storage small.
- Map tiles and geocoding use OpenStreetMap's free public services, which are fine for light use. Heavy traffic would need a commercial tile/geocoding provider.

Map data © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors.
