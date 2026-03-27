-- ============================================================
-- NTHU Food Map — Supabase Schema
-- Run this in Supabase SQL Editor (https://app.supabase.com)
-- ============================================================

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ============================================================
-- Stores
-- ============================================================
create table if not exists stores (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  category    text not null,
  lat         double precision not null,
  lng         double precision not null,
  address     text,
  phone       text,
  description text,
  rating      numeric(2,1),
  price_range smallint check (price_range between 1 and 4),
  image_url   text,
  menu_url    text,
  created_at  timestamptz default now()
);

-- ============================================================
-- Store Submissions (未收錄店家申請)
-- Submissions land here; admins review and promote to stores
-- ============================================================
create table if not exists store_submissions (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  category    text not null,
  address     text,
  phone       text,
  description text,
  submitted_by uuid references auth.users(id) on delete set null,
  status      text not null default 'pending'   -- pending | approved | rejected
              check (status in ('pending','approved','rejected')),
  created_at  timestamptz default now()
);

-- ============================================================
-- Comments
-- ============================================================
create table if not exists comments (
  id         uuid primary key default gen_random_uuid(),
  store_id   uuid not null references stores(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  text       text not null,
  rating     smallint not null check (rating between 1 and 5),
  created_at timestamptz default now()
);

-- ============================================================
-- Spending Records
-- ============================================================
create table if not exists spending_records (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  store_id     uuid references stores(id) on delete set null,
  custom_name  text,       -- populated when store_id is null ("其他")
  amount       integer not null check (amount > 0),
  visited_at   timestamptz not null default now(),
  created_at   timestamptz default now()
);

-- ============================================================
-- Promotions (店家優惠 banner)
-- ============================================================
create table if not exists promotions (
  id          uuid primary key default gen_random_uuid(),
  store_id    uuid not null references stores(id) on delete cascade,
  title       text not null,
  description text not null,
  badge       text,
  expires_at  date,
  active      boolean not null default true,
  created_at  timestamptz default now()
);

-- ============================================================
-- Row Level Security
-- ============================================================

-- stores: public read, no public write
alter table stores enable row level security;
create policy "stores_public_read"   on stores for select using (true);

-- comments: public read, authenticated write own rows
alter table comments enable row level security;
create policy "comments_public_read" on comments for select using (true);
create policy "comments_user_insert" on comments for insert with check (auth.uid() = user_id);
create policy "comments_user_delete" on comments for delete using (auth.uid() = user_id);

-- spending: only own records
alter table spending_records enable row level security;
create policy "spending_own"         on spending_records for all using (auth.uid() = user_id);

-- store_submissions: anyone can insert (logged in or not), only admins read
alter table store_submissions enable row level security;
create policy "submissions_insert"   on store_submissions for insert with check (true);

-- promotions: public read
alter table promotions enable row level security;
create policy "promotions_public_read" on promotions for select using (active = true);
