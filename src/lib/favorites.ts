// 本地收藏夹：纯前端、localStorage 落地，契合当前匿名 MVP（无正式登录、无后端收藏表）。
// 收藏两类东西——榜单里的热门推文、研究助手给出的问答。将来接正式登录/后端时，
// 可把这层换成按 user_id 的远端存储，组件侧只依赖这里导出的 hook 不用动。
import { useSyncExternalStore } from 'react';

const STORAGE_KEY = 'sve_favorites';

export type FavoriteTweet = {
  kind: 'tweet';
  id: string;
  account: string;
  date: string;
  text: string;
  engagement: number;
  likes: number;
  retweets: number;
  savedAt: number;
};

export type FavoriteAnswer = {
  kind: 'answer';
  id: string;
  question: string;
  answer: string; // markdown
  savedAt: number;
};

export type FavoriteItem = FavoriteTweet | FavoriteAnswer;

// —— 稳定 id ——
// 推文没有后端 id（榜单 RPC 不返回 status id），用 账号+正文 派生一个稳定指纹，
// 这样同一条推文重复收藏会去重，取消收藏也能精确命中。
function hash(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h).toString(36);
}

export function tweetFavoriteId(account: string, text: string): string {
  return `tweet_${hash(`${account}::${text}`)}`;
}

export function answerFavoriteId(question: string, answer: string): string {
  return `answer_${hash(`${question}::${answer}`)}`;
}

// —— 存储读写 + 订阅 ——
let cache: FavoriteItem[] | null = null;
const listeners = new Set<() => void>();

// cache 始终保持「按收藏时间倒序」的规范态，且作为稳定引用返回给 useSyncExternalStore，
// 否则每次 getSnapshot 返回新数组会触发无限重渲染。
function read(): FavoriteItem[] {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const list = raw ? (JSON.parse(raw) as FavoriteItem[]) : [];
    cache = list.sort((a, b) => b.savedAt - a.savedAt);
  } catch {
    cache = [];
  }
  return cache;
}

function write(next: FavoriteItem[]): void {
  cache = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* 隐私模式等不可写时，至少本会话内存里生效 */
  }
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

// 多标签页之间同步
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) {
      cache = null;
      listeners.forEach((l) => l());
    }
  });
}

export function getFavorites(): FavoriteItem[] {
  // cache 已是倒序规范态，直接返回稳定引用
  return read();
}

export function isFavorited(id: string): boolean {
  return read().some((f) => f.id === id);
}

export function removeFavorite(id: string): void {
  write(read().filter((f) => f.id !== id));
}

/** 收藏/取消收藏；返回收藏后的状态（true=已收藏）。 */
export function toggleFavorite(item: FavoriteItem): boolean {
  const list = read();
  if (list.some((f) => f.id === item.id)) {
    write(list.filter((f) => f.id !== item.id));
    return false;
  }
  write([{ ...item, savedAt: Date.now() }, ...list]);
  return true;
}

// —— React 绑定 ——
export function useFavorites(): FavoriteItem[] {
  return useSyncExternalStore(subscribe, getFavorites, getFavorites);
}

/** 单条收藏状态的响应式订阅，给收藏按钮用。 */
export function useIsFavorited(id: string): boolean {
  return useSyncExternalStore(
    subscribe,
    () => isFavorited(id),
    () => isFavorited(id),
  );
}

// —— 分享卡片 ——
// 真·图片卡片成本高（要 canvas/截图），这里先做「一键复制成排版好的文本卡」，
// 贴到微信/推特/笔记里就是一张干净的情报卡，覆盖 80% 的分享场景。
export function favoriteToShareText(item: FavoriteItem): string {
  if (item.kind === 'tweet') {
    return [
      `「AI 圈热度速递」`,
      ``,
      `@${item.account}`,
      item.text,
      ``,
      `🔥 热度 ${item.engagement} · ♥ ${item.likes} · ↻ ${item.retweets}`,
      `—— 硅谷速递`,
    ].join('\n');
  }
  return [
    `「硅谷速递 · 情报问答」`,
    ``,
    `Q：${item.question}`,
    ``,
    item.answer,
    ``,
    `—— 硅谷速递 AI 圈情报研究助手`,
  ].join('\n');
}

/** 复制分享文本到剪贴板，返回是否成功。 */
export async function copyShareCard(item: FavoriteItem): Promise<boolean> {
  const text = favoriteToShareText(item);
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
