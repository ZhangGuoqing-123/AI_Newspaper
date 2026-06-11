-- 给 tweets 表加 tweet_id 列，用于深链到原推文（https://x.com/<账号>/status/<tweet_id>）。
-- TikHub 响应本就带 tweet_id，以前入库时丢了；现在 auto_crawl 会一并写入。
-- 在 Supabase SQL 编辑器跑一次即可（幂等）。
--
-- 注意：存量历史推文此列为空（它们入库时没存 id），只有此后新爬的推文才有精确链接，
-- 前端对空值回退到作者主页。如需给存量补 id，得重爬（有 TikHub 成本），暂不做。
alter table tweets
  add column if not exists tweet_id text;
