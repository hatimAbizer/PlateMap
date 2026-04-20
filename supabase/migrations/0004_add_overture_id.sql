alter table public.restaurants
add column if not exists overture_id text;

create unique index if not exists restaurants_overture_id_key
on public.restaurants(overture_id)
where overture_id is not null;
