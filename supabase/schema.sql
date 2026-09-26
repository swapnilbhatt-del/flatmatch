-- FlatMatch schema for Supabase (Postgres 15+).
-- Run once in Supabase Dashboard → SQL Editor → New query → paste → Run.
-- Safe to re-run: drops and recreates everything (THIS DELETES DATA).
--
-- Security model:
--   * Row Level Security is ON for every table with NO policies, so the anon key
--     cannot read or write any table directly.
--   * All access goes through the SECURITY DEFINER functions at the bottom, each of
--     which takes a member's personal link token and only returns what that member
--     is allowed to see. Other members' constraints are withheld until all three
--     have submitted.
--   * The Next.js server is the only caller; the anon key is never sent to browsers.

drop function if exists create_group(text);
drop function if exists get_state(text);
drop function if exists submit_constraints(text, jsonb);
drop function if exists add_listing(text, text, text, text, jsonb, jsonb);
drop function if exists confirm_commute(text, uuid, text, int);
drop function if exists verify_field(text, uuid, text, jsonb);
drop function if exists set_shortlist(text, uuid, boolean);
drop function if exists _member_for(text);
drop function if exists _all_submitted(uuid);

drop table if exists shortlist;
drop table if exists listing_checks;
drop table if exists listings;
drop table if exists constraints;
drop table if exists members;
drop table if exists groups;

create table groups (
  id          uuid primary key default gen_random_uuid(),
  name        text not null default 'Our flat hunt',
  created_at  timestamptz not null default now()
);

-- One row per person. The token IS the identity (no login).
create table members (
  id          uuid primary key default gen_random_uuid(),
  group_id    uuid not null references groups(id) on delete cascade,
  slot        int  not null check (slot between 1 and 3),
  token       text not null unique,
  created_at  timestamptz not null default now(),
  unique (group_id, slot)
);

-- One row per member, written when she submits her private form.
create table constraints (
  member_id               uuid primary key references members(id) on delete cascade,
  name                    text not null,
  max_rent                int  not null check (max_rent > 0),          -- ₹ per month, her share
  no_go_areas             text[] not null default '{}',
  key_locations           jsonb not null default '[]',                 -- [{label, place, max_minutes}]
  lift_required           boolean not null default false,
  parking_required        boolean not null default false,
  pet_friendly_required   boolean not null default false,
  min_bathrooms           int check (min_bathrooms >= 0),              -- null = no requirement
  max_floor_without_lift  int check (max_floor_without_lift >= 0),     -- null = no requirement
  nice_to_haves           jsonb not null default '{}',                 -- {furnished, balcony, gym, near_metro, attached_bathroom}
  nice_to_have_other      text[] not null default '{}',
  submitted_at            timestamptz not null default now()
);

-- Listings pasted in by the friends.
-- `fields` holds the structured data. Any value not clearly stated is the string "unknown".
create table listings (
  id          uuid primary key default gen_random_uuid(),
  group_id    uuid not null references groups(id) on delete cascade,
  added_by    uuid references members(id) on delete set null,
  title       text not null,
  url         text,
  raw_text    text,
  fields      jsonb not null,
  created_at  timestamptz not null default now()
);

-- Human checkpoints on a listing:
--   kind = 'commute': one row per (listing, member, key-location label).
--                     minutes = estimate; confirmed = that member ticked "I confirmed my commute".
--   kind = 'field':   one row per verified listing field (member_id = who verified it).
create table listing_checks (
  id           uuid primary key default gen_random_uuid(),
  listing_id   uuid not null references listings(id) on delete cascade,
  kind         text not null check (kind in ('commute', 'field')),
  member_id    uuid references members(id) on delete cascade,
  key          text not null,
  minutes      int check (minutes >= 0),
  confirmed    boolean not null default false,
  updated_at   timestamptz not null default now()
);
create unique index listing_checks_commute_uq on listing_checks (listing_id, member_id, key) where kind = 'commute';
create unique index listing_checks_field_uq   on listing_checks (listing_id, key)            where kind = 'field';

create table shortlist (
  listing_id  uuid primary key references listings(id) on delete cascade,
  added_by    uuid references members(id) on delete set null,
  created_at  timestamptz not null default now()
);

alter table groups         enable row level security;
alter table members        enable row level security;
alter table constraints    enable row level security;
alter table listings       enable row level security;
alter table listing_checks enable row level security;
alter table shortlist      enable row level security;
-- (No policies on purpose: direct table access is denied to anon/authenticated.)

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create function _member_for(p_token text) returns members
language plpgsql security definer set search_path = public as $$
declare m members;
begin
  select * into m from members where token = p_token;
  if m.id is null then
    raise exception 'invalid_token' using errcode = 'P0001';
  end if;
  return m;
end $$;

create function _all_submitted(p_group uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select count(*) = 3
  from constraints c join members m on m.id = c.member_id
  where m.group_id = p_group;
$$;

-- ---------------------------------------------------------------------------
-- Public API (called by the Next.js server with the anon key)
-- ---------------------------------------------------------------------------

create function create_group(p_name text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare g uuid; tokens text[] := '{}'; t text; i int;
begin
  insert into groups (name) values (coalesce(nullif(trim(p_name), ''), 'Our flat hunt')) returning id into g;
  for i in 1..3 loop
    t := replace(gen_random_uuid()::text, '-', '');
    insert into members (group_id, slot, token) values (g, i, t);
    tokens := tokens || t;
  end loop;
  return jsonb_build_object('group_id', g, 'tokens', to_jsonb(tokens));
end $$;

-- Everything one member may see. Others' constraints, listings, checks and the
-- shortlist are only included once all three have submitted.
create function get_state(p_token text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare m members; unlocked boolean;
begin
  m := _member_for(p_token);
  unlocked := _all_submitted(m.group_id);
  return jsonb_build_object(
    'me', jsonb_build_object('member_id', m.id, 'slot', m.slot),
    'group', (select jsonb_build_object('id', id, 'name', name) from groups where id = m.group_id),
    'submitted_count', (select count(*) from constraints c join members x on x.id = c.member_id where x.group_id = m.group_id),
    'unlocked', unlocked,
    'my_constraints', (select to_jsonb(c) from constraints c where c.member_id = m.id),
    'constraints', case when unlocked then
        (select coalesce(jsonb_agg(to_jsonb(c) order by x.slot), '[]')
         from constraints c join members x on x.id = c.member_id where x.group_id = m.group_id)
      else '[]'::jsonb end,
    'listings', case when unlocked then
        (select coalesce(jsonb_agg(to_jsonb(l) - 'raw_text' order by l.created_at), '[]')
         from listings l where l.group_id = m.group_id)
      else '[]'::jsonb end,
    'checks', case when unlocked then
        (select coalesce(jsonb_agg(to_jsonb(k)), '[]')
         from listing_checks k join listings l on l.id = k.listing_id where l.group_id = m.group_id)
      else '[]'::jsonb end,
    'shortlist', case when unlocked then
        (select coalesce(jsonb_agg(to_jsonb(s)), '[]')
         from shortlist s join listings l on l.id = s.listing_id where l.group_id = m.group_id)
      else '[]'::jsonb end
  );
end $$;

create function submit_constraints(p_token text, p_data jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare m members;
begin
  m := _member_for(p_token);
  insert into constraints as c (
    member_id, name, max_rent, no_go_areas, key_locations,
    lift_required, parking_required, pet_friendly_required,
    min_bathrooms, max_floor_without_lift, nice_to_haves, nice_to_have_other, submitted_at
  ) values (
    m.id,
    p_data->>'name',
    (p_data->>'max_rent')::int,
    coalesce(array(select jsonb_array_elements_text(p_data->'no_go_areas')), '{}'),
    coalesce(p_data->'key_locations', '[]'),
    coalesce((p_data->>'lift_required')::boolean, false),
    coalesce((p_data->>'parking_required')::boolean, false),
    coalesce((p_data->>'pet_friendly_required')::boolean, false),
    (p_data->>'min_bathrooms')::int,
    (p_data->>'max_floor_without_lift')::int,
    coalesce(p_data->'nice_to_haves', '{}'),
    coalesce(array(select jsonb_array_elements_text(p_data->'nice_to_have_other')), '{}'),
    now()
  )
  on conflict (member_id) do update set
    name = excluded.name, max_rent = excluded.max_rent, no_go_areas = excluded.no_go_areas,
    key_locations = excluded.key_locations, lift_required = excluded.lift_required,
    parking_required = excluded.parking_required, pet_friendly_required = excluded.pet_friendly_required,
    min_bathrooms = excluded.min_bathrooms, max_floor_without_lift = excluded.max_floor_without_lift,
    nice_to_haves = excluded.nice_to_haves, nice_to_have_other = excluded.nice_to_have_other,
    submitted_at = now();
end $$;

-- p_commutes: [{member_id, key, minutes}] — estimates entered by the person adding the listing.
create function add_listing(p_token text, p_title text, p_url text, p_raw text, p_fields jsonb, p_commutes jsonb)
returns uuid
language plpgsql security definer set search_path = public as $$
declare m members; lid uuid; c jsonb;
begin
  m := _member_for(p_token);
  if not _all_submitted(m.group_id) then
    raise exception 'locked' using errcode = 'P0001';
  end if;
  insert into listings (group_id, added_by, title, url, raw_text, fields)
  values (m.group_id, m.id, p_title, nullif(p_url, ''), nullif(p_raw, ''), p_fields)
  returning id into lid;
  for c in select * from jsonb_array_elements(coalesce(p_commutes, '[]')) loop
    -- only members of this group
    if exists (select 1 from members where id = (c->>'member_id')::uuid and group_id = m.group_id) then
      insert into listing_checks (listing_id, kind, member_id, key, minutes, confirmed)
      values (lid, 'commute', (c->>'member_id')::uuid, c->>'key', (c->>'minutes')::int, false);
    end if;
  end loop;
  return lid;
end $$;

-- A member confirms (and may correct) HER OWN commute estimate.
create function confirm_commute(p_token text, p_listing uuid, p_key text, p_minutes int) returns void
language plpgsql security definer set search_path = public as $$
declare m members;
begin
  m := _member_for(p_token);
  if not exists (select 1 from listings where id = p_listing and group_id = m.group_id) then
    raise exception 'not_found' using errcode = 'P0001';
  end if;
  insert into listing_checks (listing_id, kind, member_id, key, minutes, confirmed, updated_at)
  values (p_listing, 'commute', m.id, p_key, p_minutes, true, now())
  on conflict (listing_id, member_id, key) where kind = 'commute'
  do update set minutes = excluded.minutes, confirmed = true, updated_at = now();
end $$;

-- A human confirms an "unknown" field (e.g. after asking the broker) and records its real value.
-- p_value is {"v": <value>} so scalar values travel as valid JSON.
create function verify_field(p_token text, p_listing uuid, p_field text, p_value jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare m members;
begin
  m := _member_for(p_token);
  update listings set fields = jsonb_set(fields, array[p_field], p_value->'v', true)
  where id = p_listing and group_id = m.group_id;
  if not found then
    raise exception 'not_found' using errcode = 'P0001';
  end if;
  insert into listing_checks (listing_id, kind, member_id, key, confirmed, updated_at)
  values (p_listing, 'field', m.id, p_field, true, now())
  on conflict (listing_id, key) where kind = 'field'
  do update set member_id = excluded.member_id, confirmed = true, updated_at = now();
end $$;

create function set_shortlist(p_token text, p_listing uuid, p_on boolean) returns void
language plpgsql security definer set search_path = public as $$
declare m members;
begin
  m := _member_for(p_token);
  if not exists (select 1 from listings where id = p_listing and group_id = m.group_id) then
    raise exception 'not_found' using errcode = 'P0001';
  end if;
  if p_on then
    insert into shortlist (listing_id, added_by) values (p_listing, m.id) on conflict do nothing;
  else
    delete from shortlist where listing_id = p_listing;
  end if;
end $$;

-- Only expose the public API functions to the anon role.
revoke all on function _member_for(text), _all_submitted(uuid) from public, anon, authenticated;
revoke all on function create_group(text), get_state(text), submit_constraints(text, jsonb),
  add_listing(text, text, text, text, jsonb, jsonb), confirm_commute(text, uuid, text, int),
  verify_field(text, uuid, text, jsonb), set_shortlist(text, uuid, boolean) from public;
grant execute on function create_group(text), get_state(text), submit_constraints(text, jsonb),
  add_listing(text, text, text, text, jsonb, jsonb), confirm_commute(text, uuid, text, int),
  verify_field(text, uuid, text, jsonb), set_shortlist(text, uuid, boolean) to anon;
