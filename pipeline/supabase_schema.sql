-- ① 信源表：要爬哪些 Twitter 账号
create table if not exists sources (
  screen_name  text primary key,
  active       boolean not null default true,
  added_at     timestamptz not null default now()
);

insert into sources (screen_name) values
  ('sama'),
  ('OpenAI'),
  ('AnthropicAI'),
  ('GoogleDeepMind'),
  ('ylecun'),
  ('elonmusk'),
  ('levelsio'),
  ('tibomaker'),
  ('DannyPostma'),
  ('damengchen'),
  ('IndieHackers'),
  ('DrJimFan'),
  ('swyx'),
  ('yoheinakajima'),
  ('emollick'),
  ('GaryMarcus'),
  ('pmarca'),
  ('paulg'),
  ('a16z'),
  ('bhorowitz'),
  ('garrytan'),
  ('midjourney'),
  ('runwayml'),
  ('_javilopen'),
  ('Bilawalsidhu'),
  ('pika_labs'),
  ('Sigravou'),
  ('LangChainAI'),
  ('Auto_GPT'),
  ('naval'),
  ('balajis'),
  ('TimFerriss'),
  ('waitbutwhy'),
  ('_akhaliq'),
  ('huggingface'),
  ('PyTorch'),
  ('bchesky'),
  ('linear'),
  ('shreyas'),
  ('perplexity_ai'),
  ('TheBrowserCompany'),
  ('NotionHQ'),
  ('karpathy'),
  ('lennyrachitsky'),
  ('AravSrinivas'),
  ('amasad')
on conflict (screen_name) do nothing;

-- ② 推文表：本地 29 天数据 + 每日定时巡检抓的，统一存这里
create table if not exists tweets (
  id          bigserial primary key,
  account     text not null,
  kind        text,
  time        text,
  likes       integer default 0,
  retweets    integer default 0,
  replies     integer default 0,
  views       integer default 0,
  text        text not null,
  quoted      text default '',
  date        text not null,
  inserted_at timestamptz not null default now()
);

create index if not exists idx_tweets_date on tweets (date);
create index if not exists idx_tweets_account on tweets (account);

-- text 是长文本，原始 unique(account, time, text) 在写长推文时会撞 btree 索引行大小上限
-- （index row size 4048 exceeds ... maximum 2704）。解法：加一列存 text 的 md5 指纹（定长、短），
-- 唯一约束建在指纹上——内容寻址的思路，跟 Git/搜索引擎对长内容去重是同一个原理。
alter table tweets add column if not exists text_hash text generated always as (md5(text)) stored;
create unique index if not exists tweets_account_time_text_hash_key on tweets (account, time, text_hash);
