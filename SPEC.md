# Barn Finder — Specification (draft for review)

A mobile-friendly web database of ice rinks (hockey-focused), worldwide.

## Platform
- **Stack:** Next.js (React) + TypeScript
- **Hosting:** Vercel (app) + Supabase (Postgres database, auth, photo storage)
- **Email:** Supabase built-in auth email (custom SMTP can be added later with no code changes)
- **Maps:** OpenStreetMap + Leaflet (free). No Google API key, so no Street View.
  - Addresses link out to Google Maps (a plain link, no key needed)
  - Geocoding: OpenStreetMap Nominatim auto-places the pin; the submitter or an admin can drag it to adjust
- **Region:** worldwide. The map centers on the user's location if they allow it.
- **Units:** mi/km toggle, defaulting from the browser locale
- **Seed data:** none; the app starts empty

## Users & roles
| Role | Can do |
|---|---|
| Visitor (no login) | View everything, search, use the map |
| Verified user | Everything above, plus add/edit rinks and places, post reviews and comments, upload photos, suggest amenity and place categories |
| Admin | Everything above, plus edit all data, revert or disapprove any change, manage lists, approve suggestions, promote users to admin |

- Signup: name + email, then email verification
- First admin is set by email address in config; admins can promote others in the app

## Moderation model
- **Everything goes live immediately.** Admins review afterward and can disapprove or revert.
- **Full version history:** every edit stores a before/after snapshot. Admins see a diff and can revert any version. The public sees "last updated by X on date".
- **Exception:** new amenity types and new place categories are *suggestions* that only go live after admin approval.

## Rink
| Field | Notes |
|---|---|
| Name | required |
| Address | required; links to Google Maps; geocoded pin (draggable) |
| Sheets of ice | a count |
| Seating | multi-select from an admin-managed list (start: wooden bench, metal bleachers, plastic seats) + free-text notes |
| Parking | multi-select from an admin-managed list (start: large front lot, main lot in rear) + free-text notes |
| Amenities | check/no-check list (start: restaurant, skate sharpening, pro shop, snack bar, bar). New types default to unchecked for every rink. |
| Photos | uploaded by users (see Photos) |
| Reviews | see Reviews |
| Nearby places | see Places of interest |

## Reviews (rinks)
- Verified users only; **one review per user per rink**, which they can edit or delete
- Written text plus **optional** 1–5 star ratings per category:
  - Ice quality, Locker rooms, Spectator comfort, Food & drink
  - **Other**: the reviewer types a label for what they're rating
  - Admins can add more categories
- The rink page shows the average for each category

## Photos
- Resized in the browser before upload
- **Rinks:** each user can upload 1 general rink photo, plus 1 photo for each rating category they rated in their review (attached to the review)
- **Places of interest:** 1 photo per user per place

## Places of interest
- Added from a rink's page and **attached to that one rink**
- Required: name, address, category
- Categories: hotel, coffee shop, hockey store, attraction, restaurant. Users can suggest new ones; admins approve them.
- Optional: a shared description (editable by any verified user, versioned like rink data), per-user comments, and 1 photo per user
- Shows its distance from the rink

## Search & browse
- Search by rink name or partial address (street, city, region, postal code)
- Map view with rink pins; tap a pin to see a summary and open the rink
- Results listed with distance from the user when location is available

## Admin pages
- Recent-changes feed with diffs and revert/disapprove
- Edit any rink, place, review or comment
- Manage lists: seating types, parking types, amenities, rating categories, place categories
- Approval queue for suggested amenities and place categories
- Reports queue (resolve / dismiss)
- User management: promote/demote admins

## Additional rules
- Contributor **display names are public** (emails are never shown)
- Users can **delete their own photos**
- **Report button** on rinks, places, reviews, comments and photos; reports go to an admin reports queue
- **Comments on places of interest:** one per user per place, editable
