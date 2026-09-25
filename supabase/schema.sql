create table if not exists public.usuarios (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null,
  telefone text,
  criado_em timestamptz not null default now()
);

alter table public.usuarios enable row level security;

drop policy if exists "Usuário pode ver o próprio perfil" on public.usuarios;
create policy "Usuário pode ver o próprio perfil"
on public.usuarios
for select
to authenticated
using (auth.uid() = id);

create or replace function public.criar_usuario()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.usuarios (id, nome, telefone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', 'Usuário'),
    new.raw_user_meta_data->>'phone'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists ao_criar_usuario on auth.users;
create trigger ao_criar_usuario
after insert on auth.users
for each row
execute procedure public.criar_usuario();

create table if not exists public.pedidos (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid references public.usuarios(id) on delete set null,
  nome text not null,
  telefone text not null,
  endereco text not null,
  pagamento text not null,
  total numeric(10, 2) not null default 0,
  criado_em timestamptz not null default now(),
  status text not null default 'pendente',
  dados jsonb not null default '{}'::jsonb
);

alter table public.pedidos add column if not exists dados jsonb not null default '{}'::jsonb;
alter table public.pedidos add column if not exists criado_em timestamptz not null default now();

alter table public.pedidos enable row level security;

create index if not exists pedidos_usuario_id_idx on public.pedidos (usuario_id);

create index if not exists pedidos_criado_em_idx on public.pedidos (criado_em desc);
