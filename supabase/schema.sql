create table if not exists public.pedidos (
  id text primary key,
  criado_em timestamptz not null default now(),
  status text not null default 'recebido',
  dados jsonb not null
);

alter table public.pedidos enable row level security;

create index if not exists pedidos_criado_em_idx on public.pedidos (criado_em desc);
