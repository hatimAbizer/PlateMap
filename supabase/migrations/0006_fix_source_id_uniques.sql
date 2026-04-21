alter table public.restaurants
add column if not exists overture_id text;

alter table public.restaurants
add column if not exists osm_id text;

alter table public.restaurants
add column if not exists tomtom_id text;

update public.restaurants
set overture_id = null
where overture_id is not null
  and btrim(overture_id) = '';

update public.restaurants
set osm_id = null
where osm_id is not null
  and btrim(osm_id) = '';

update public.restaurants
set tomtom_id = null
where tomtom_id is not null
  and btrim(tomtom_id) = '';

with ranked as (
  select
    id,
    row_number() over (
      partition by overture_id
      order by
        is_verified desc,
        (claimed_by is not null) desc,
        review_count desc,
        updated_at desc,
        created_at desc,
        id asc
    ) as rn
  from public.restaurants
  where overture_id is not null
)
update public.restaurants r
set overture_id = null
from ranked
where r.id = ranked.id
  and ranked.rn > 1;

with ranked as (
  select
    id,
    row_number() over (
      partition by osm_id
      order by
        is_verified desc,
        (claimed_by is not null) desc,
        review_count desc,
        updated_at desc,
        created_at desc,
        id asc
    ) as rn
  from public.restaurants
  where osm_id is not null
)
update public.restaurants r
set osm_id = null
from ranked
where r.id = ranked.id
  and ranked.rn > 1;

with ranked as (
  select
    id,
    row_number() over (
      partition by tomtom_id
      order by
        is_verified desc,
        (claimed_by is not null) desc,
        review_count desc,
        updated_at desc,
        created_at desc,
        id asc
    ) as rn
  from public.restaurants
  where tomtom_id is not null
)
update public.restaurants r
set tomtom_id = null
from ranked
where r.id = ranked.id
  and ranked.rn > 1;

create unique index if not exists restaurants_overture_id_key
on public.restaurants (overture_id)
where overture_id is not null;

create unique index if not exists restaurants_osm_id_key
on public.restaurants (osm_id)
where osm_id is not null;

create unique index if not exists restaurants_tomtom_id_key
on public.restaurants (tomtom_id)
where tomtom_id is not null;
