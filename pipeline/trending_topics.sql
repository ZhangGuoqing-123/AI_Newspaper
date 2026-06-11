-- 热门讨论话题快照表（知乎热榜式榜单的数据源）。
-- 在 Supabase SQL 编辑器里运行一次即可（幂等）。
--
-- 设计：单行快照（id 恒为 1）。topic_cluster.py 每轮聚类后整体覆盖写入，
-- 前端只读这一行。话题及其代表推文都内联在 topics(jsonb) 里，一次读取即可渲染
-- 列表 + 点开看推文，无需额外查询。
create table if not exists trending_topics (
  id           int primary key default 1,
  topics       jsonb       not null default '[]'::jsonb,
  window_since text,
  window_until text,
  computed_at  timestamptz not null default now(),
  constraint trending_singleton check (id = 1)
);

-- 覆盖写入时刷新计算时间
create or replace function _touch_trending_topics()
returns trigger language plpgsql as $$
begin
  new.computed_at = now();
  return new;
end $$;

drop trigger if exists trg_touch_trending_topics on trending_topics;
create trigger trg_touch_trending_topics
  before insert or update on trending_topics
  for each row execute function _touch_trending_topics();
