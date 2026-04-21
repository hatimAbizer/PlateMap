alter table public.restaurants
add column if not exists osm_id text;

create unique index if not exists restaurants_osm_id_key
on public.restaurants(osm_id)
where osm_id is not null;
