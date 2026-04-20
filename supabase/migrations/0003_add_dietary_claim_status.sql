alter table public.restaurants
add column if not exists dietary_claim_status jsonb default '{}'::jsonb not null;

update public.restaurants r
set dietary_claim_status = x.claims
from (
  select
    t.id,
    coalesce(
      jsonb_object_agg(
        c::text,
        case when t.is_verified then 'verified' else 'unverified' end
      ) filter (where c is not null),
      '{}'::jsonb
    ) as claims
  from public.restaurants t
  left join lateral unnest(t.dietary_categories) c on true
  group by t.id, t.is_verified
) x
where r.id = x.id
  and coalesce(r.dietary_claim_status, '{}'::jsonb) = '{}'::jsonb;
