create table if not exists public.prediction_rounds (
  id text primary key,
  horizon text not null check (horizon in ('Quarterly', 'Annual', 'Five-year')),
  target_date date not null
);

insert into public.prediction_rounds (id, horizon, target_date)
select
  format('quarterly-%s-q%s', years.year, quarters.quarter),
  'Quarterly',
  make_date(years.year, quarters.month, quarters.day)
from generate_series(2027, 2031) as years(year)
cross join (values
  (1, 3, 31),
  (2, 6, 30),
  (3, 9, 30),
  (4, 12, 31)
) as quarters(quarter, month, day)
union all
select
  format('annual-%s', years.year),
  'Annual',
  make_date(years.year, 12, 31)
from generate_series(2027, 2030) as years(year)
union all
select 'five-year-2031', 'Five-year', date '2031-10-12'
on conflict (id) do update
set horizon = excluded.horizon, target_date = excluded.target_date;

create table if not exists public.predictions (
  id bigint generated always as identity primary key,
  avatar_name text not null
    check (avatar_name ~ '^[A-Za-z0-9 _.-]{2,24}$'),
  round_id text not null references public.prediction_rounds (id),
  symbol text not null
    check (symbol in (
      'NVDA', 'TSM', 'QCOM', 'AAPL', '005930.KS',
      'AMD', 'INTC', 'AVGO', 'GOOGL', 'AMZN'
    )),
  predicted_price numeric(14, 4) not null
    check (predicted_price > 0 and predicted_price < 1000000000),
  created_at timestamptz not null default now()
);

create index if not exists predictions_round_created_idx
  on public.predictions (round_id, created_at);

create unique index if not exists predictions_avatar_round_symbol_unique
  on public.predictions (lower(avatar_name), round_id, symbol);

alter table public.predictions enable row level security;
alter table public.prediction_rounds enable row level security;

grant select, insert on public.predictions to anon, authenticated;
grant usage, select on sequence public.predictions_id_seq to anon, authenticated;
grant select on public.prediction_rounds to anon, authenticated;

drop policy if exists "Anyone can view prediction rounds" on public.prediction_rounds;
create policy "Anyone can view prediction rounds"
  on public.prediction_rounds
  for select
  to anon, authenticated
  using (true);

drop policy if exists "Anyone can view predictions" on public.predictions;
create policy "Anyone can view predictions"
  on public.predictions
  for select
  to anon, authenticated
  using (true);

drop policy if exists "Anyone can submit predictions" on public.predictions;
create policy "Anyone can submit predictions"
  on public.predictions
  for insert
  to anon, authenticated
  with check (exists (
    select 1
    from public.prediction_rounds as game_round
    where game_round.id = round_id
      and game_round.target_date > (now() at time zone 'UTC')::date
  ));
