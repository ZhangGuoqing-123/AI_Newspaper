-- ============================================================
-- 硅谷速递 (AI_Newspaper) — Supabase Schema（新前端版）
-- 按当前前端 src/types/index.ts 的数据结构 + pipeline 产出设计
-- 运行：Supabase Dashboard > SQL Editor 执行此文件
-- ============================================================

-- 1. channels 信息集合/频道
create table if not exists channels (
  id              text primary key,
  name            text not null,
  icon            text not null default '📡',
  description     text not null default '',
  subscriber_count integer not null default 0,
  created_at      timestamptz not null default now()
);

-- 2. sources 信源（账号）
create table if not exists sources (
  id            text primary key,
  channel_id    text references channels(id) on delete cascade,
  name          text not null,
  handle        text not null,
  avatar        text default '',
  platform      text not null default 'twitter',
  description   text default '',
  follower_count integer not null default 0
);

-- 3. articles 每条 feed 内容（含 AI 摘要）
create table if not exists articles (
  id              text primary key,
  channel_id      text references channels(id) on delete cascade,
  channel_name    text default '',
  channel_icon    text default '',
  title           text not null,
  summary         text not null default '',
  cover_image     text,
  source_url      text default '',
  published_at    timestamptz not null default now(),
  read_time       integer default 1,
  source_type     text default 'twitter',
  author_name     text default '',
  author_handle   text default '',
  ai_summary      jsonb,                 -- {introduction, corePoints[], chapters[], exclusiveComment}
  original_content text,
  created_at      timestamptz not null default now()
);
create index if not exists articles_channel_idx     on articles(channel_id);
create index if not exists articles_published_idx    on articles(published_at desc);

-- 4. daily_summaries 每日个性化总结（DailySummary）
create table if not exists daily_summaries (
  date          date primary key,
  title         text not null,
  content       text not null,
  article_count integer not null default 0,
  channel_count integer not null default 0,
  created_at    timestamptz not null default now()
);

-- 5. daily_broadcasts 每日播报（多模态：口播稿 + 音频 + 数字人视频）★新增
create table if not exists daily_broadcasts (
  date         date primary key,
  title        text not null,
  description  text not null default '',
  script       text not null default '',   -- 口播稿
  audio_url    text,                        -- edge-tts 产出
  video_url    text,                        -- 数字人视频
  poster_image text,
  created_at   timestamptz not null default now()
);

-- 6. users 用户档案（关联 Supabase Auth）
create table if not exists users (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text,
  nickname     text,
  avatar_url   text,
  is_vip       boolean not null default false,
  created_at   timestamptz not null default now()
);

create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.users (id, email) values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users for each row execute procedure handle_new_user();

-- 7. subscriptions 用户订阅（哪些频道/信源 = 个性化爬取依据）
create table if not exists subscriptions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references users(id) on delete cascade,
  channel_id    text,
  source_id     text,
  push_enabled  boolean not null default true,
  subscribed_at timestamptz not null default now(),
  unique(user_id, channel_id, source_id)
);
create index if not exists subscriptions_user_idx on subscriptions(user_id);

-- ────────────────────────────────────────────
-- RLS：内容表匿名可读；用户表/订阅仅本人
-- ────────────────────────────────────────────
alter table channels         enable row level security;
alter table sources          enable row level security;
alter table articles         enable row level security;
alter table daily_summaries  enable row level security;
alter table daily_broadcasts enable row level security;
alter table users            enable row level security;
alter table subscriptions    enable row level security;

drop policy if exists "public read channels"         on channels;
drop policy if exists "public read sources"          on sources;
drop policy if exists "public read articles"         on articles;
drop policy if exists "public read daily_summaries"  on daily_summaries;
drop policy if exists "public read daily_broadcasts" on daily_broadcasts;
create policy "public read channels"         on channels         for select using (true);
create policy "public read sources"          on sources          for select using (true);
create policy "public read articles"         on articles         for select using (true);
create policy "public read daily_summaries"  on daily_summaries  for select using (true);
create policy "public read daily_broadcasts" on daily_broadcasts for select using (true);

create policy "users read own"  on users for select using (auth.uid() = id);
create policy "users update own" on users for update using (auth.uid() = id);
create policy "subs read own"   on subscriptions for select using (auth.uid() = user_id);
create policy "subs write own"  on subscriptions for all    using (auth.uid() = user_id);

-- 注：pipeline 用 service_role key 写入（绕过 RLS）；前端用 anon key 只读。
