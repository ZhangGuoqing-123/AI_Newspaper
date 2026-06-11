-- 在 Supabase SQL 编辑器里跑一次，建好向量存储基础设施
-- 幂等：全部用 IF NOT EXISTS / CREATE OR REPLACE

-- 1. 启用 pgvector 扩展
create extension if not exists vector;

-- 2. Embedding 存储表（BAAI/bge-m3 输出 1024 维）
create table if not exists tweet_embeddings (
  id        bigint primary key references tweets(id) on delete cascade,
  embedding vector(1024) not null
);

-- 3. HNSW 索引（余弦距离，近似最近邻，大量数据下比精确搜索快几十倍）
create index if not exists tweet_embeddings_hnsw
  on tweet_embeddings using hnsw (embedding vector_cosine_ops)
  with (m = 16, ef_construction = 64);

-- 4. Python 通过 supabase-py rpc() 调用的相似度搜索函数
create or replace function match_tweet_embeddings(
  query_embedding vector(1024),
  match_count     int default 15
)
returns table (
  id         bigint,
  account    text,
  date       text,
  "time"     text,
  likes      int,
  retweets   int,
  "text"     text,
  similarity float
)
language sql stable
as $$
  select
    t.id,
    t.account,
    t.date,
    t.time,
    t.likes,
    t.retweets,
    t.text,
    (1 - (e.embedding <=> query_embedding))::float as similarity
  from tweets t
  join tweet_embeddings e on e.id = t.id
  order by e.embedding <=> query_embedding
  limit match_count;
$$;
