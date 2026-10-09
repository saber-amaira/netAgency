-- netAgency: schema initial (RLS activée sur toutes les tables)

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  role text not null default 'visitor' check (role in ('visitor', 'agent', 'admin')),
  created_at timestamptz not null default now()
);

create table public.listings (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 3 and 200),
  description text not null default '',
  price numeric(14, 2) not null check (price >= 0),
  transaction_type text not null check (transaction_type in ('sale', 'rent')),
  property_type text not null default 'apartment'
    check (property_type in ('apartment', 'house', 'land', 'commercial', 'other')),
  surface numeric(10, 2) check (surface > 0),
  rooms int check (rooms >= 0),
  bedrooms int check (bedrooms >= 0),
  city text not null,
  address text,
  features text[] not null default '{}',
  status text not null default 'draft' check (status in ('draft', 'published')),
  featured boolean not null default false,
  created_by uuid not null default auth.uid() references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz
);
create index listings_status_idx on public.listings (status, published_at desc);
create index listings_city_idx on public.listings (lower(city));

create table public.listing_images (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  path text not null,
  position int not null default 0,
  created_at timestamptz not null default now()
);
create index listing_images_listing_idx on public.listing_images (listing_id, position);

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references public.listings (id) on delete set null,
  name text not null check (char_length(name) between 2 and 120),
  email text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' and char_length(email) <= 254),
  phone text check (char_length(phone) <= 30),
  message text not null check (char_length(message) between 1 and 2000),
  status text not null default 'new' check (status in ('new', 'contacted', 'closed')),
  created_at timestamptz not null default now()
);
create index leads_created_idx on public.leads (created_at desc);

-- Helpers (security definer pour éviter la récursion RLS)
create or replace function public.current_role_name()
returns text language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.current_role_name() in ('agent', 'admin'), false)
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.current_role_name() = 'admin', false)
$$;

-- Création automatique du profil (rôle visiteur par défaut)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email);
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Horodatages et publication
create or replace function public.listings_before_write()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  if new.status = 'published' and (tg_op = 'INSERT' or old.status <> 'published' or new.published_at is null) then
    new.published_at := coalesce(new.published_at, now());
  elsif new.status = 'draft' then
    new.published_at := null;
  end if;
  return new;
end $$;

create trigger listings_before_write
  before insert or update on public.listings
  for each row execute function public.listings_before_write();

-- RLS
alter table public.profiles enable row level security;
alter table public.listings enable row level security;
alter table public.listing_images enable row level security;
alter table public.leads enable row level security;

-- profiles: lecture de son propre profil; seuls les admins modifient les rôles
create policy "profiles_select_own_or_admin" on public.profiles
  for select to authenticated using (id = (select auth.uid()) or public.is_admin());
create policy "profiles_update_admin" on public.profiles
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- listings
create policy "listings_select_published" on public.listings
  for select to anon, authenticated using (status = 'published');
create policy "listings_select_staff" on public.listings
  for select to authenticated
  using (public.is_admin() or (public.is_staff() and created_by = (select auth.uid())));
create policy "listings_insert_staff" on public.listings
  for insert to authenticated
  with check (public.is_staff() and created_by = (select auth.uid()));
create policy "listings_update_staff" on public.listings
  for update to authenticated
  using (public.is_admin() or (public.is_staff() and created_by = (select auth.uid())))
  with check (public.is_admin() or (public.is_staff() and created_by = (select auth.uid())));
create policy "listings_delete_staff" on public.listings
  for delete to authenticated
  using (public.is_admin() or (public.is_staff() and created_by = (select auth.uid())));

-- listing_images
create policy "images_select_visible" on public.listing_images
  for select to anon, authenticated
  using (exists (select 1 from public.listings l where l.id = listing_id and l.status = 'published'));
create policy "images_select_staff" on public.listing_images
  for select to authenticated
  using (exists (select 1 from public.listings l where l.id = listing_id
    and (public.is_admin() or (public.is_staff() and l.created_by = (select auth.uid())))));
create policy "images_write_staff" on public.listing_images
  for all to authenticated
  using (exists (select 1 from public.listings l where l.id = listing_id
    and (public.is_admin() or (public.is_staff() and l.created_by = (select auth.uid())))))
  with check (exists (select 1 from public.listings l where l.id = listing_id
    and (public.is_admin() or (public.is_staff() and l.created_by = (select auth.uid())))));

-- leads: tout le monde peut déposer une demande, seul le personnel la lit
create policy "leads_insert_public" on public.leads
  for insert to anon, authenticated
  with check (status = 'new');
create policy "leads_select_staff" on public.leads
  for select to authenticated using (public.is_staff());
create policy "leads_update_staff" on public.leads
  for update to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "leads_delete_admin" on public.leads
  for delete to authenticated using (public.is_admin());

-- Storage: bucket public en lecture, écriture réservée au personnel
insert into storage.buckets (id, name, public)
values ('listing-images', 'listing-images', true)
on conflict (id) do nothing;

create policy "listing_images_storage_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'listing-images' and public.is_staff());
create policy "listing_images_storage_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'listing-images' and public.is_staff());
create policy "listing_images_storage_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'listing-images' and public.is_staff());
