-- =============================================================================
-- Barn Finder — database schema (Supabase / Postgres)
--
-- Run once on a fresh Supabase project: Dashboard → SQL Editor → paste → Run.
-- Before running, set the initial admin email in the app_settings insert below
-- (or update it afterwards; it is checked when that account signs up).
-- =============================================================================

create extension if not exists pg_trgm with schema extensions;

-- -----------------------------------------------------------------------------
-- Types
-- -----------------------------------------------------------------------------
create type public.moderation_status as enum ('live', 'disapproved');
create type public.suggestion_status as enum ('pending', 'approved', 'rejected');
create type public.report_status     as enum ('open', 'resolved', 'dismissed');
create type public.report_target     as enum ('rink', 'place', 'review', 'place_comment', 'photo');

-- -----------------------------------------------------------------------------
-- Settings & profiles
-- -----------------------------------------------------------------------------
create table public.app_settings (
  key   text primary key,
  value text not null
);

insert into public.app_settings (key, value) values
  ('initial_admin_email', 'CHANGE_ME@example.com');

create table public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(trim(display_name)) between 1 and 60),
  is_admin     boolean not null default false,
  created_at   timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Auth helpers
-- -----------------------------------------------------------------------------

-- Signed-in user whose email address has been confirmed.
create function public.is_verified() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from auth.users u
    where u.id = auth.uid() and u.email_confirmed_at is not null
  );
$$;

create function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.profiles p
    join auth.users u on u.id = p.id
    where p.id = auth.uid() and p.is_admin and u.email_confirmed_at is not null
  );
$$;

-- Admins, the service-role API key, and the SQL editor (seed scripts, setup).
create function public.is_privileged() returns boolean
language sql stable set search_path = '' as $$
  select public.is_admin()
      or coalesce(auth.role(), '') = 'service_role'
      or session_user in ('postgres', 'supabase_admin');
$$;

-- Create a profile for every new auth user. The display name comes from the
-- signup form (options.data.display_name).
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name, is_admin)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''), split_part(new.email, '@', 1)),
    coalesce(lower(new.email) = (select lower(value) from public.app_settings where key = 'initial_admin_email'), false)
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create function public.protect_profile() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.is_admin is distinct from old.is_admin and not public.is_privileged() then
    raise exception 'Only admins can change admin status';
  end if;
  new.id := old.id;
  new.created_at := old.created_at;
  return new;
end;
$$;

create trigger profiles_protect
  before update on public.profiles
  for each row execute function public.protect_profile();

-- -----------------------------------------------------------------------------
-- Admin-managed lists
-- -----------------------------------------------------------------------------
create table public.seating_types (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  sort_order int  not null default 0,
  is_active  boolean not null default true
);

create table public.parking_types (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  sort_order int  not null default 0,
  is_active  boolean not null default true
);

create table public.rating_categories (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  is_other   boolean not null default false,   -- reviewer supplies a label
  sort_order int  not null default 0,
  is_active  boolean not null default true
);
create unique index rating_categories_single_other on public.rating_categories (is_other) where is_other;

-- Users may suggest these; they go live once an admin approves them.
create table public.amenities (
  id           uuid primary key default gen_random_uuid(),
  name         text not null unique,
  status       public.suggestion_status not null default 'pending',
  suggested_by uuid references public.profiles (id) on delete set null,
  sort_order   int  not null default 0,
  created_at   timestamptz not null default now()
);

create table public.place_categories (
  id           uuid primary key default gen_random_uuid(),
  name         text not null unique,
  status       public.suggestion_status not null default 'pending',
  suggested_by uuid references public.profiles (id) on delete set null,
  sort_order   int  not null default 0,
  created_at   timestamptz not null default now()
);

insert into public.seating_types (name, sort_order) values
  ('Wooden bench', 1), ('Metal bleachers', 2), ('Plastic seats', 3);

insert into public.parking_types (name, sort_order) values
  ('Large front lot', 1), ('Main lot in rear', 2);

insert into public.rating_categories (name, is_other, sort_order) values
  ('Ice quality', false, 1), ('Locker rooms', false, 2), ('Spectator comfort', false, 3),
  ('Food & drink', false, 4), ('Other', true, 99);

insert into public.amenities (name, status, sort_order) values
  ('Restaurant', 'approved', 1), ('Skate sharpening', 'approved', 2), ('Pro shop', 'approved', 3),
  ('Snack bar', 'approved', 4), ('Bar', 'approved', 5);

insert into public.place_categories (name, status, sort_order) values
  ('Hotel', 'approved', 1), ('Coffee shop', 'approved', 2), ('Hockey store', 'approved', 3),
  ('Attraction', 'approved', 4), ('Restaurant', 'approved', 5);

-- -----------------------------------------------------------------------------
-- Rinks
-- -----------------------------------------------------------------------------
create table public.rinks (
  id               uuid primary key default gen_random_uuid(),
  name             text not null check (char_length(trim(name)) > 0),
  street           text not null check (char_length(trim(street)) > 0),
  city             text not null check (char_length(trim(city)) > 0),
  region           text,                       -- state / province
  postal_code      text,
  country_code     char(2) not null default 'US',
  latitude         double precision check (latitude between -90 and 90),
  longitude        double precision check (longitude between -180 and 180),
  sheet_count      smallint check (sheet_count >= 0),
  seating_type_ids uuid[] not null default '{}',
  seating_notes    text,
  parking_type_ids uuid[] not null default '{}',
  parking_notes    text,
  amenity_ids      uuid[] not null default '{}',   -- checked amenities; absent = unchecked
  status           public.moderation_status not null default 'live',
  created_by       uuid references public.profiles (id) on delete set null,
  updated_by       uuid references public.profiles (id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  search_text      text generated always as (
    lower(name || ' ' || street || ' ' || city || ' ' || coalesce(region, '') || ' ' || coalesce(postal_code, ''))
  ) stored
);
create index rinks_search_trgm on public.rinks using gin (search_text extensions.gin_trgm_ops);
create index rinks_location on public.rinks (latitude, longitude);

-- Array columns can't carry foreign keys, so check them here.
create function public.validate_rink_lists() returns trigger
language plpgsql set search_path = '' as $$
begin
  if exists (select 1 from unnest(new.seating_type_ids) x
             where not exists (select 1 from public.seating_types t where t.id = x)) then
    raise exception 'Unknown seating type';
  end if;
  if exists (select 1 from unnest(new.parking_type_ids) x
             where not exists (select 1 from public.parking_types t where t.id = x)) then
    raise exception 'Unknown parking type';
  end if;
  if exists (select 1 from unnest(new.amenity_ids) x
             where not exists (select 1 from public.amenities a where a.id = x and a.status = 'approved')) then
    raise exception 'Unknown or unapproved amenity';
  end if;
  return new;
end;
$$;

create trigger rinks_validate_lists
  before insert or update on public.rinks
  for each row execute function public.validate_rink_lists();

-- -----------------------------------------------------------------------------
-- Places of interest (each belongs to one rink)
-- -----------------------------------------------------------------------------
create table public.places (
  id           uuid primary key default gen_random_uuid(),
  rink_id      uuid not null references public.rinks (id) on delete cascade,
  category_id  uuid not null references public.place_categories (id),
  name         text not null check (char_length(trim(name)) > 0),
  street       text not null check (char_length(trim(street)) > 0),
  city         text not null check (char_length(trim(city)) > 0),
  region       text,
  postal_code  text,
  country_code char(2) not null default 'US',
  latitude     double precision check (latitude between -90 and 90),
  longitude    double precision check (longitude between -180 and 180),
  description  text,                          -- shared write-up, editable by any verified user
  status       public.moderation_status not null default 'live',
  created_by   uuid references public.profiles (id) on delete set null,
  updated_by   uuid references public.profiles (id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index places_rink on public.places (rink_id);

create function public.validate_place_category() returns trigger
language plpgsql set search_path = '' as $$
begin
  if not exists (select 1 from public.place_categories c where c.id = new.category_id and c.status = 'approved') then
    raise exception 'Unknown or unapproved place category';
  end if;
  return new;
end;
$$;

create trigger places_validate_category
  before insert or update of category_id on public.places
  for each row execute function public.validate_place_category();

-- One comment per user per place.
create table public.place_comments (
  id         uuid primary key default gen_random_uuid(),
  place_id   uuid not null references public.places (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  body       text not null check (char_length(trim(body)) > 0),
  status     public.moderation_status not null default 'live',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (place_id, user_id)
);

-- -----------------------------------------------------------------------------
-- Reviews (one per user per rink) and per-category ratings
-- -----------------------------------------------------------------------------
create table public.reviews (
  id         uuid primary key default gen_random_uuid(),
  rink_id    uuid not null references public.rinks (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  body       text not null check (char_length(trim(body)) > 0),
  status     public.moderation_status not null default 'live',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (rink_id, user_id)
);

-- Every category rating is optional; a row exists only for categories the reviewer rated.
create table public.review_ratings (
  id          uuid primary key default gen_random_uuid(),
  review_id   uuid not null references public.reviews (id) on delete cascade,
  category_id uuid not null references public.rating_categories (id),
  rating      smallint not null check (rating between 1 and 5),
  other_label text,                           -- required for the "Other" category only
  unique (review_id, category_id)
);

create function public.validate_review_rating() returns trigger
language plpgsql set search_path = '' as $$
declare
  v_is_other boolean;
begin
  select is_other into v_is_other from public.rating_categories where id = new.category_id;
  if v_is_other then
    if coalesce(trim(new.other_label), '') = '' then
      raise exception 'An "Other" rating needs a label describing what is rated';
    end if;
    new.other_label := trim(new.other_label);
  else
    new.other_label := null;
  end if;
  return new;
end;
$$;

create trigger review_ratings_validate
  before insert or update on public.review_ratings
  for each row execute function public.validate_review_rating();

create view public.rink_rating_summary with (security_invoker = true) as
select r.rink_id,
       rr.category_id,
       round(avg(rr.rating)::numeric, 2) as avg_rating,
       count(*)                          as rating_count
from public.review_ratings rr
join public.reviews r on r.id = rr.review_id
where r.status = 'live'
group by r.rink_id, rr.category_id;

-- -----------------------------------------------------------------------------
-- Photos (files live in the "photos" storage bucket)
--   * 1 general photo per user per rink
--   * 1 photo per rated category in the user's own review
--   * 1 photo per user per place
-- -----------------------------------------------------------------------------
create table public.photos (
  id               uuid primary key default gen_random_uuid(),
  storage_path     text not null unique,
  uploaded_by      uuid not null references public.profiles (id) on delete cascade,
  rink_id          uuid references public.rinks (id) on delete cascade,
  review_rating_id uuid references public.review_ratings (id) on delete cascade,
  place_id         uuid references public.places (id) on delete cascade,
  caption          text,
  status           public.moderation_status not null default 'live',
  created_at       timestamptz not null default now(),
  check (num_nonnulls(rink_id, review_rating_id, place_id) = 1)
);
create unique index photos_one_general_per_user_per_rink on public.photos (rink_id, uploaded_by) where rink_id is not null;
create unique index photos_one_per_rating on public.photos (review_rating_id) where review_rating_id is not null;
create unique index photos_one_per_user_per_place on public.photos (place_id, uploaded_by) where place_id is not null;

-- -----------------------------------------------------------------------------
-- Reports
-- -----------------------------------------------------------------------------
create table public.reports (
  id          uuid primary key default gen_random_uuid(),
  target_type public.report_target not null,
  target_id   uuid not null,
  reason      text not null check (char_length(trim(reason)) > 0),
  reported_by uuid references public.profiles (id) on delete set null,
  status      public.report_status not null default 'open',
  resolved_by uuid references public.profiles (id) on delete set null,
  resolved_at timestamptz,
  created_at  timestamptz not null default now()
);
create index reports_open on public.reports (created_at) where status = 'open';

-- -----------------------------------------------------------------------------
-- Change history (every insert/update/delete on user-editable tables)
-- -----------------------------------------------------------------------------
create table public.change_log (
  id          bigint generated always as identity primary key,
  table_name  text not null,
  record_id   uuid not null,
  action      text not null check (action in ('INSERT', 'UPDATE', 'DELETE')),
  old_data    jsonb,
  new_data    jsonb,
  changed_by  uuid references public.profiles (id) on delete set null,
  changed_at  timestamptz not null default now(),
  reverted_at timestamptz,
  reverted_by uuid references public.profiles (id) on delete set null
);
create index change_log_record on public.change_log (table_name, record_id, changed_at desc);
create index change_log_recent on public.change_log (changed_at desc);

create function public.log_change() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'UPDATE' and to_jsonb(old) = to_jsonb(new) then
    return null;
  end if;
  insert into public.change_log (table_name, record_id, action, old_data, new_data, changed_by)
  values (
    tg_table_name,
    case when tg_op = 'DELETE' then old.id else new.id end,
    tg_op,
    case when tg_op = 'INSERT' then null else to_jsonb(old) end,
    case when tg_op = 'DELETE' then null else to_jsonb(new) end,
    auth.uid()
  );
  return null;  -- AFTER trigger: return value is ignored
end;
$$;

-- Undo one logged change by restoring the row to its state before that change.
create function public.revert_change(p_change_id bigint) returns void
language plpgsql security definer set search_path = '' as $$
declare
  c    public.change_log;
  cols text;
begin
  if not public.is_admin() then
    raise exception 'Only admins can revert changes';
  end if;

  select * into c from public.change_log where id = p_change_id for update;
  if not found then
    raise exception 'Change % not found', p_change_id;
  end if;
  if c.reverted_at is not null then
    raise exception 'Change % was already reverted', p_change_id;
  end if;

  select string_agg(format('%I', column_name), ', ' order by ordinal_position) into cols
  from information_schema.columns
  where table_schema = 'public' and table_name = c.table_name
    and is_generated = 'NEVER' and column_name <> 'id';

  if c.action = 'INSERT' then
    execute format('delete from public.%I where id = $1', c.table_name) using c.record_id;
  elsif c.action = 'UPDATE' then
    execute format(
      'update public.%I t set (%s) = (select %s from jsonb_populate_record(null::public.%I, $1)) where t.id = $2',
      c.table_name, cols, cols, c.table_name
    ) using c.old_data, c.record_id;
  else
    execute format(
      'insert into public.%I (id, %s) select id, %s from jsonb_populate_record(null::public.%I, $1)',
      c.table_name, cols, cols, c.table_name
    ) using c.old_data;
  end if;

  update public.change_log set reverted_at = now(), reverted_by = auth.uid() where id = p_change_id;
end;
$$;

-- -----------------------------------------------------------------------------
-- Row stamping & moderation guards
-- -----------------------------------------------------------------------------
create function public.set_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  if tg_op = 'UPDATE' then
    new.created_at := old.created_at;
  end if;
  return new;
end;
$$;

-- created_by/updated_by on wiki-style tables (rinks, places).
create function public.stamp_authorship() returns trigger
language plpgsql set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    if not public.is_privileged() then
      new.created_by := auth.uid();
    end if;
  else
    new.created_by := old.created_by;
  end if;
  new.updated_by := coalesce(auth.uid(), new.updated_by);
  return new;
end;
$$;

-- Only admins may set or change moderation status.
create function public.enforce_status() returns trigger
language plpgsql set search_path = '' as $$
begin
  if not public.is_privileged() then
    new.status := case when tg_op = 'INSERT' then 'live' else old.status end;
  end if;
  return new;
end;
$$;

-- The author of a review/comment/photo can't be reassigned.
create function public.keep_owner() returns trigger
language plpgsql set search_path = '' as $$
begin
  if tg_table_name = 'photos' then
    new.uploaded_by := old.uploaded_by;
  else
    new.user_id := old.user_id;
  end if;
  return new;
end;
$$;

-- Suggestions from non-admins always start as pending.
create function public.enforce_suggestion() returns trigger
language plpgsql set search_path = '' as $$
begin
  if not public.is_privileged() then
    new.status := 'pending';
    new.suggested_by := auth.uid();
  end if;
  return new;
end;
$$;

create trigger rinks_updated_at   before insert or update on public.rinks          for each row execute function public.set_updated_at();
create trigger rinks_authorship   before insert or update on public.rinks          for each row execute function public.stamp_authorship();
create trigger rinks_status       before insert or update on public.rinks          for each row execute function public.enforce_status();
create trigger rinks_log          after insert or update or delete on public.rinks for each row execute function public.log_change();

create trigger places_updated_at  before insert or update on public.places          for each row execute function public.set_updated_at();
create trigger places_authorship  before insert or update on public.places          for each row execute function public.stamp_authorship();
create trigger places_status      before insert or update on public.places          for each row execute function public.enforce_status();
create trigger places_log         after insert or update or delete on public.places for each row execute function public.log_change();

create trigger reviews_updated_at before insert or update on public.reviews          for each row execute function public.set_updated_at();
create trigger reviews_status     before insert or update on public.reviews          for each row execute function public.enforce_status();
create trigger reviews_owner      before update on public.reviews                    for each row execute function public.keep_owner();
create trigger reviews_log        after insert or update or delete on public.reviews for each row execute function public.log_change();

create trigger review_ratings_log after insert or update or delete on public.review_ratings for each row execute function public.log_change();

create trigger place_comments_updated_at before insert or update on public.place_comments          for each row execute function public.set_updated_at();
create trigger place_comments_status     before insert or update on public.place_comments          for each row execute function public.enforce_status();
create trigger place_comments_owner      before update on public.place_comments                    for each row execute function public.keep_owner();
create trigger place_comments_log        after insert or update or delete on public.place_comments for each row execute function public.log_change();

create trigger photos_status      before insert or update on public.photos          for each row execute function public.enforce_status();
create trigger photos_owner       before update on public.photos                    for each row execute function public.keep_owner();
create trigger photos_log         after insert or update or delete on public.photos for each row execute function public.log_change();

create trigger amenities_suggest        before insert on public.amenities        for each row execute function public.enforce_suggestion();
create trigger place_categories_suggest before insert on public.place_categories for each row execute function public.enforce_suggestion();

-- -----------------------------------------------------------------------------
-- Search (name or partial address)
-- -----------------------------------------------------------------------------
create function public.search_rinks(q text) returns setof public.rinks
language sql stable set search_path = '' as $$
  select r.*
  from public.rinks r
  where r.search_text like '%' || replace(replace(replace(lower(trim(q)), '\', '\\'), '%', '\%'), '_', '\_') || '%'
  order by extensions.similarity(r.search_text, lower(trim(q))) desc, r.name
  limit 100;
$$;

-- -----------------------------------------------------------------------------
-- Row-level security
-- -----------------------------------------------------------------------------
alter table public.app_settings      enable row level security;
alter table public.profiles          enable row level security;
alter table public.seating_types     enable row level security;
alter table public.parking_types     enable row level security;
alter table public.rating_categories enable row level security;
alter table public.amenities         enable row level security;
alter table public.place_categories  enable row level security;
alter table public.rinks             enable row level security;
alter table public.places            enable row level security;
alter table public.place_comments    enable row level security;
alter table public.reviews           enable row level security;
alter table public.review_ratings    enable row level security;
alter table public.photos            enable row level security;
alter table public.reports           enable row level security;
alter table public.change_log        enable row level security;

-- Settings: admins only
create policy "settings admin" on public.app_settings for all
  using (public.is_admin()) with check (public.is_admin());

-- Profiles: display names are public; users edit their own; admins edit any
create policy "profiles read"   on public.profiles for select using (true);
create policy "profiles update" on public.profiles for update
  using (id = auth.uid() or public.is_admin()) with check (id = auth.uid() or public.is_admin());

-- Fixed lists: readable by all, managed by admins
create policy "seating read"  on public.seating_types for select using (true);
create policy "seating admin" on public.seating_types for all using (public.is_admin()) with check (public.is_admin());
create policy "parking read"  on public.parking_types for select using (true);
create policy "parking admin" on public.parking_types for all using (public.is_admin()) with check (public.is_admin());
create policy "rating categories read"  on public.rating_categories for select using (true);
create policy "rating categories admin" on public.rating_categories for all using (public.is_admin()) with check (public.is_admin());

-- Suggestible lists: approved items public; suggesters see their own; admins see/manage all
create policy "amenities read" on public.amenities for select
  using (status = 'approved' or suggested_by = auth.uid() or public.is_admin());
create policy "amenities suggest" on public.amenities for insert with check (public.is_verified());
create policy "amenities admin update" on public.amenities for update using (public.is_admin()) with check (public.is_admin());
create policy "amenities admin delete" on public.amenities for delete using (public.is_admin());

create policy "place categories read" on public.place_categories for select
  using (status = 'approved' or suggested_by = auth.uid() or public.is_admin());
create policy "place categories suggest" on public.place_categories for insert with check (public.is_verified());
create policy "place categories admin update" on public.place_categories for update using (public.is_admin()) with check (public.is_admin());
create policy "place categories admin delete" on public.place_categories for delete using (public.is_admin());

-- Rinks & places: public read of live rows; any verified user adds/edits; admins delete
create policy "rinks read"   on public.rinks for select using (status = 'live' or public.is_admin());
create policy "rinks insert" on public.rinks for insert with check (public.is_verified());
create policy "rinks update" on public.rinks for update
  using (public.is_verified() and (status = 'live' or public.is_admin())) with check (public.is_verified());
create policy "rinks delete" on public.rinks for delete using (public.is_admin());

create policy "places read"   on public.places for select using (status = 'live' or public.is_admin());
create policy "places insert" on public.places for insert with check (public.is_verified());
create policy "places update" on public.places for update
  using (public.is_verified() and (status = 'live' or public.is_admin())) with check (public.is_verified());
create policy "places delete" on public.places for delete using (public.is_admin());

-- Reviews & place comments: public read of live rows; authors manage their own
create policy "reviews read"   on public.reviews for select using (status = 'live' or user_id = auth.uid() or public.is_admin());
create policy "reviews insert" on public.reviews for insert with check (public.is_verified() and user_id = auth.uid());
create policy "reviews update" on public.reviews for update
  using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());
create policy "reviews delete" on public.reviews for delete using (user_id = auth.uid() or public.is_admin());

-- Ratings follow their review's visibility (the subquery is itself filtered by reviews RLS)
create policy "ratings read" on public.review_ratings for select
  using (exists (select 1 from public.reviews r where r.id = review_id));
create policy "ratings write" on public.review_ratings for all
  using (exists (select 1 from public.reviews r where r.id = review_id and (r.user_id = auth.uid() or public.is_admin())))
  with check (exists (select 1 from public.reviews r where r.id = review_id and (r.user_id = auth.uid() or public.is_admin())));

create policy "place comments read"   on public.place_comments for select using (status = 'live' or user_id = auth.uid() or public.is_admin());
create policy "place comments insert" on public.place_comments for insert with check (public.is_verified() and user_id = auth.uid());
create policy "place comments update" on public.place_comments for update
  using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());
create policy "place comments delete" on public.place_comments for delete using (user_id = auth.uid() or public.is_admin());

-- Photos: public read of live rows; uploaders add/edit/delete their own
create policy "photos read" on public.photos for select using (status = 'live' or uploaded_by = auth.uid() or public.is_admin());
create policy "photos insert" on public.photos for insert with check (
  public.is_verified()
  and uploaded_by = auth.uid()
  and split_part(storage_path, '/', 1) = auth.uid()::text
  and (review_rating_id is null or exists (
        select 1 from public.review_ratings rr join public.reviews r on r.id = rr.review_id
        where rr.id = review_rating_id and r.user_id = auth.uid()))
);
create policy "photos update" on public.photos for update
  using (uploaded_by = auth.uid() or public.is_admin()) with check (uploaded_by = auth.uid() or public.is_admin());
create policy "photos delete" on public.photos for delete using (uploaded_by = auth.uid() or public.is_admin());

-- Reports: verified users file them and see their own; admins manage
create policy "reports insert" on public.reports for insert with check (public.is_verified() and reported_by = auth.uid());
create policy "reports read"   on public.reports for select using (reported_by = auth.uid() or public.is_admin());
create policy "reports admin"  on public.reports for update using (public.is_admin()) with check (public.is_admin());

-- History: admins only (rows are written by the security-definer trigger)
create policy "change log admin" on public.change_log for select using (public.is_admin());

revoke execute on function public.revert_change(bigint) from public, anon;
grant  execute on function public.revert_change(bigint) to authenticated;  -- the function itself checks is_admin()

-- -----------------------------------------------------------------------------
-- Storage bucket for photos (files are resized in the browser before upload)
-- Path convention: <user id>/<uuid>.<ext>
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos', 'photos', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "photos bucket read" on storage.objects for select
  using (bucket_id = 'photos');
create policy "photos bucket upload own folder" on storage.objects for insert to authenticated
  with check (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text and public.is_verified());
create policy "photos bucket delete own or admin" on storage.objects for delete to authenticated
  using (bucket_id = 'photos' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));
