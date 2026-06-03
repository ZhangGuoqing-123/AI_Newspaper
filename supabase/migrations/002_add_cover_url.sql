-- 增量 migration：给 daily_broadcasts 加 cover_url 列（SiliconFlow 封面图）
-- 对已建库执行此文件即可；新建库直接跑 schema.sql 不用单独跑这个。
alter table daily_broadcasts
  add column if not exists cover_url text;
