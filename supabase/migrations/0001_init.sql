-- PlateMap v1.0 — initial schema
-- Run this entire file in the Supabase SQL Editor (once).

-- ============================================================
-- Extensions
-- ============================================================
create extension if not exists "pgcrypto";

-- ============================================================
-- Enums
-- ============================================================
do $$ begin
  create type dietary_category as enum ('halal', 'veg', 'vegan', 'jain');
exception when duplicate_object then null; end $$;

do $$ begin
  create type dietary_preference as enum ('halal', 'veg', 'vegan', 'jain', 'none');
exception when duplicate_object then null; end $$;

do $$ begin
  create type claim_status as enum ('pending', 'approved', 'rejected');
exception when duplicate_object then null; end $$;

do $$ begin
  create type admin_role as enum ('admin', 'moderator');
exception when duplicate_object then null; end $$;

-- ============================================================
-- profiles — mirrors auth.users 1:1
-- ============================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  avatar_url text,
  dietary_preference dietary_preference default 'none' not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index if not exists profiles_pref_idx on public.profiles(dietary_preference);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- restaurants
-- ============================================================
create table if not exists public.restaurants (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text,
  address text not null,
  city text not null default 'Bengaluru',
  area text,
  lat double precision not null,
  lng double precision not null,
  phone text,
  website text,
  cuisine_type text,
  price_range text check (price_range in ('$', '$$', '$$$', '$$$$')),
  dietary_categories dietary_category[] default '{}' not null,
  is_verified boolean default false not null,
  claimed_by uuid references auth.users(id) on delete set null,
  hours jsonb,
  photos text[] default '{}' not null,
  avg_rating numeric(3,2),
  review_count integer default 0 not null,
  tomtom_id text unique,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index if not exists restaurants_city_idx on public.restaurants(city);
create index if not exists restaurants_cats_idx on public.restaurants using gin(dietary_categories);
create index if not exists restaurants_lat_lng_idx on public.restaurants(lat, lng);
create index if not exists restaurants_name_trgm_idx on public.restaurants using gin (name gin_trgm_ops);
-- Enable pg_trgm (optional — wrapped in DO so fresh projects don't fail)
do $$ begin
  create extension if not exists pg_trgm;
exception when others then null; end $$;

-- ============================================================
-- favourites
-- ============================================================
create table if not exists public.favourites (
  user_id uuid not null references auth.users(id) on delete cascade,
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  created_at timestamptz default now() not null,
  primary key (user_id, restaurant_id)
);

create index if not exists favourites_restaurant_idx on public.favourites(restaurant_id);

-- ============================================================
-- reviews
-- ============================================================
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  text text not null check (length(text) between 20 and 500),
  photos text[] default '{}' not null check (array_length(photos, 1) is null or array_length(photos, 1) <= 3),
  is_flagged boolean default false not null,
  flag_reason text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  unique (restaurant_id, user_id)
);

create index if not exists reviews_restaurant_idx on public.reviews(restaurant_id, created_at desc);
create index if not exists reviews_user_idx on public.reviews(user_id, created_at desc);
create index if not exists reviews_flagged_idx on public.reviews(is_flagged) where is_flagged = true;

-- Recompute avg_rating + review_count
create or replace function public.recompute_restaurant_stats(r_id uuid)
returns void
language plpgsql
as $$
begin
  update public.restaurants
  set avg_rating = (select round(avg(rating)::numeric, 2) from public.reviews where restaurant_id = r_id and not is_flagged),
      review_count = (select count(*) from public.reviews where restaurant_id = r_id and not is_flagged),
      updated_at = now()
  where id = r_id;
end;
$$;

create or replace function public.on_review_change()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'DELETE' then
    perform public.recompute_restaurant_stats(old.restaurant_id);
    return old;
  else
    perform public.recompute_restaurant_stats(new.restaurant_id);
    return new;
  end if;
end;
$$;

drop trigger if exists on_review_change on public.reviews;
create trigger on_review_change
  after insert or update or delete on public.reviews
  for each row execute function public.on_review_change();

-- ============================================================
-- claims
-- ============================================================
create table if not exists public.claims (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  claimant_user_id uuid not null references auth.users(id) on delete cascade,
  claimant_name text not null,
  designation text not null,
  business_email text not null,
  phone text not null,
  proof_doc_url text,
  status claim_status default 'pending' not null,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  rejection_reason text,
  created_at timestamptz default now() not null,
  unique (restaurant_id, claimant_user_id)
);

create index if not exists claims_status_idx on public.claims(status, created_at desc);
create index if not exists claims_restaurant_idx on public.claims(restaurant_id);

-- ============================================================
-- admins
-- ============================================================
create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role admin_role default 'admin' not null,
  created_at timestamptz default now() not null
);

-- Helper: current user is admin?
create or replace function public.is_admin(u uuid)
returns boolean
language sql
stable
security definer
as $$
  select exists(select 1 from public.admins where user_id = u);
$$;

-- ============================================================
-- updated_at trigger helper
-- ============================================================
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists touch_profiles_updated on public.profiles;
create trigger touch_profiles_updated before update on public.profiles
  for each row execute function public.touch_updated_at();

drop trigger if exists touch_restaurants_updated on public.restaurants;
create trigger touch_restaurants_updated before update on public.restaurants
  for each row execute function public.touch_updated_at();

drop trigger if exists touch_reviews_updated on public.reviews;
create trigger touch_reviews_updated before update on public.reviews
  for each row execute function public.touch_updated_at();

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.profiles enable row level security;
alter table public.restaurants enable row level security;
alter table public.favourites enable row level security;
alter table public.reviews enable row level security;
alter table public.claims enable row level security;
alter table public.admins enable row level security;

-- profiles
drop policy if exists "profiles read public" on public.profiles;
create policy "profiles read public" on public.profiles for select using (true);

drop policy if exists "profiles update own" on public.profiles;
create policy "profiles update own" on public.profiles for update
  using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "profiles insert self" on public.profiles;
create policy "profiles insert self" on public.profiles for insert
  with check (auth.uid() = id);

-- restaurants
drop policy if exists "restaurants read public" on public.restaurants;
create policy "restaurants read public" on public.restaurants for select using (true);

drop policy if exists "restaurants write admin" on public.restaurants;
create policy "restaurants write admin" on public.restaurants for all
  using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

drop policy if exists "restaurants update owner" on public.restaurants;
create policy "restaurants update owner" on public.restaurants for update
  using (claimed_by = auth.uid()) with check (claimed_by = auth.uid());

-- favourites
drop policy if exists "favourites read own" on public.favourites;
create policy "favourites read own" on public.favourites for select
  using (auth.uid() = user_id);

drop policy if exists "favourites write own" on public.favourites;
create policy "favourites write own" on public.favourites for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- reviews
drop policy if exists "reviews read public" on public.reviews;
create policy "reviews read public" on public.reviews for select using (true);

drop policy if exists "reviews insert own" on public.reviews;
create policy "reviews insert own" on public.reviews for insert
  with check (auth.uid() = user_id);

drop policy if exists "reviews update own" on public.reviews;
create policy "reviews update own" on public.reviews for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "reviews delete own or admin" on public.reviews;
create policy "reviews delete own or admin" on public.reviews for delete
  using (auth.uid() = user_id or public.is_admin(auth.uid()));

drop policy if exists "reviews admin update" on public.reviews;
create policy "reviews admin update" on public.reviews for update
  using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- claims
drop policy if exists "claims read own or admin" on public.claims;
create policy "claims read own or admin" on public.claims for select
  using (auth.uid() = claimant_user_id or public.is_admin(auth.uid()));

drop policy if exists "claims insert own" on public.claims;
create policy "claims insert own" on public.claims for insert
  with check (auth.uid() = claimant_user_id);

drop policy if exists "claims admin update" on public.claims;
create policy "claims admin update" on public.claims for update
  using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- admins
drop policy if exists "admins read admin" on public.admins;
create policy "admins read admin" on public.admins for select
  using (public.is_admin(auth.uid()));

drop policy if exists "admins write admin" on public.admins;
create policy "admins write admin" on public.admins for all
  using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- ============================================================
-- Storage buckets (run in Supabase Dashboard Storage → create bucket)
--   - review-photos : public
--   - claim-docs    : private
-- Or run these SQL snippets in the Storage schema:
-- ============================================================
insert into storage.buckets (id, name, public)
values ('review-photos', 'review-photos', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('claim-docs', 'claim-docs', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('restaurant-photos', 'restaurant-photos', true)
on conflict (id) do nothing;

-- Storage policies
drop policy if exists "review-photos read public" on storage.objects;
create policy "review-photos read public" on storage.objects for select
  using (bucket_id = 'review-photos');

drop policy if exists "review-photos write auth" on storage.objects;
create policy "review-photos write auth" on storage.objects for insert
  with check (bucket_id = 'review-photos' and auth.role() = 'authenticated');

drop policy if exists "review-photos delete own" on storage.objects;
create policy "review-photos delete own" on storage.objects for delete
  using (bucket_id = 'review-photos' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "restaurant-photos read public" on storage.objects;
create policy "restaurant-photos read public" on storage.objects for select
  using (bucket_id = 'restaurant-photos');

drop policy if exists "restaurant-photos write admin" on storage.objects;
create policy "restaurant-photos write admin" on storage.objects for insert
  with check (bucket_id = 'restaurant-photos' and public.is_admin(auth.uid()));

drop policy if exists "claim-docs read own or admin" on storage.objects;
create policy "claim-docs read own or admin" on storage.objects for select
  using (
    bucket_id = 'claim-docs'
    and (auth.uid()::text = (storage.foldername(name))[1] or public.is_admin(auth.uid()))
  );

drop policy if exists "claim-docs write auth" on storage.objects;
create policy "claim-docs write auth" on storage.objects for insert
  with check (
    bucket_id = 'claim-docs'
    and auth.role() = 'authenticated'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
