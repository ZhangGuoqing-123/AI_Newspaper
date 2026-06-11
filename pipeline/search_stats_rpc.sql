-- 把 search_local / get_stats 从「内存遍历本地 29 天数据」迁到 Supabase。
-- 在 Supabase SQL 编辑器里运行一次即可（幂等，可重复跑）。
--
-- 设计：排序/聚合都放在数据库侧做——30k+ 推文不适合每次把全量拉回 Python 再算。
-- 热度口径与 pipeline/parse_tweets.py 的 Tweet.engagement 严格一致：
--   likes*3 + retweets*2 + replies + views/1000   （整数除法）

-- ① 生成列：热度分。stored 物化，建索引后可被 order by 直接命中。
alter table tweets
  add column if not exists engagement integer
  generated always as (likes * 3 + retweets * 2 + replies + views / 1000) stored;

create index if not exists idx_tweets_engagement on tweets (engagement desc);

-- ② search_tweets：关键词(正文 ilike)/账号(ilike)/日期(精确) 过滤，按热度降序返回。
--    空串表示该条件不参与过滤。account 传入时请先去掉前导 @。
create or replace function search_tweets(
  kw  text default '',
  acc text default '',
  dt  text default '',
  lim int  default 10
)
returns table (
  account text, kind text, "time" text,
  likes int, retweets int, replies int, views int,
  text text, date text, engagement int
)
language sql stable as $$
  select account, kind, "time", likes, retweets, replies, views, text, date, engagement
  from tweets
  where (kw  = '' or text    ilike '%' || kw  || '%')
    and (acc = '' or account ilike '%' || acc || '%')
    and (dt  = '' or date = dt)
  order by engagement desc
  limit lim
$$;

-- ③ tweet_stats：对过滤后的集合做整体互动汇总 + 返回热度最高的 top_n 条。
create or replace function tweet_stats(
  kw    text default '',
  acc   text default '',
  dt    text default '',
  top_n int  default 5
)
returns json
language sql stable as $$
  with filtered as (
    select * from tweets
    where (kw  = '' or text    ilike '%' || kw  || '%')
      and (acc = '' or account ilike '%' || acc || '%')
      and (dt  = '' or date = dt)
  )
  select json_build_object(
    'count',          (select count(*)               from filtered),
    'total_likes',    coalesce((select sum(likes)    from filtered), 0),
    'total_retweets', coalesce((select sum(retweets) from filtered), 0),
    'total_replies',  coalesce((select sum(replies)  from filtered), 0),
    'total_views',    coalesce((select sum(views)    from filtered), 0),
    'top_by_engagement', coalesce((
      select json_agg(t) from (
        select account, date, likes, retweets, left(text, 200) as text
        from filtered
        order by engagement desc
        limit top_n
      ) t
    ), '[]'::json)
  )
$$;

-- ④ tweets_date_range：数据覆盖的最早/最晚日期（供命令行启动信息展示）。
create or replace function tweets_date_range()
returns table (start_date text, end_date text)
language sql stable as $$
  select coalesce(min(date), ''), coalesce(max(date), '')
  from tweets
  where date <> ''
$$;
