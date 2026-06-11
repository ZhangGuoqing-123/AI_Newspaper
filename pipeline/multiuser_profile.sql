-- 多用户画像隔离：每个访客一份偏好记忆，不再全站共用 id=1。
-- 在 Supabase SQL 编辑器里运行一次即可（幂等）。
--
-- user_id 来源：前端为每个浏览器生成一个匿名客户端 id（localStorage 持久化），
-- 随请求头 X-User-Id 带上。将来接入正式登录后，把登录用户的 id 填进来即可平滑升级。

create table if not exists user_profiles (
  user_id    text primary key,
  accounts   text[] not null default '{}',
  topics     text[] not null default '{}',
  updated_at timestamptz not null default now()
);

-- 旧的全站共用表 user_profile（单行 id=1）不再使用；保留不动，避免误删历史。
-- 如确认无用可手动 drop table user_profile;
