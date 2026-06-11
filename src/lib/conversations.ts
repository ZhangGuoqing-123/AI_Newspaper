// 本地对话历史：纯前端、localStorage 落地，跟收藏夹（favorites.ts）同一套路，
// 契合当前匿名 MVP（无正式登录、无后端会话表）。把用户跟研究助手的每段对话存下来，
// 左侧抽屉里可翻回去看 / 继续。将来接正式登录/后端时，把这层换成按 user_id 的远端存储即可，
// 组件侧只依赖这里导出的 hook，不用动。
//
// 注意：当前 agent 后端是单轮的（每次提问独立、不带上文），所以一段「对话」其实是
// 一串独立问答的展示集合。本模块只负责持久化与回看，不改变这一语义。
import { useSyncExternalStore } from 'react';
import type { ChatMessage } from './agentApi';

const STORAGE_KEY = 'sve_conversations';
const MAX_CONVERSATIONS = 50; // 防止 localStorage 无限膨胀，超出按最近活跃裁掉最旧的

export type Conversation = {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
};

export function newConversationId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `conv_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

// 标题取第一条用户提问，截断；空则占位
function deriveTitle(messages: ChatMessage[]): string {
  const firstUser = messages.find((m) => m.role === 'user');
  const t = (firstUser?.content ?? '').trim().replace(/\s+/g, ' ');
  if (!t) return '新对话';
  return t.length > 24 ? `${t.slice(0, 24)}…` : t;
}

// —— 存储读写 + 订阅（与 favorites.ts 同模式：cache 保持 updatedAt 倒序的稳定引用）——
let cache: Conversation[] | null = null;
const listeners = new Set<() => void>();

function read(): Conversation[] {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const list = raw ? (JSON.parse(raw) as Conversation[]) : [];
    cache = list.sort((a, b) => b.updatedAt - a.updatedAt);
  } catch {
    cache = [];
  }
  return cache;
}

function write(next: Conversation[]): void {
  cache = next.sort((a, b) => b.updatedAt - a.updatedAt).slice(0, MAX_CONVERSATIONS);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
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

export function getConversations(): Conversation[] {
  return read();
}

/** 新增或更新一段对话（按 id）；空消息不存。标题首次生成后保持稳定。 */
export function upsertConversation(id: string, messages: ChatMessage[]): void {
  if (messages.length === 0) return;
  const list = read();
  const now = Date.now();
  const existing = list.find((c) => c.id === id);
  const conv: Conversation = existing
    ? { ...existing, messages, title: existing.title || deriveTitle(messages), updatedAt: now }
    : { id, title: deriveTitle(messages), messages, createdAt: now, updatedAt: now };
  write([conv, ...list.filter((c) => c.id !== id)]);
}

export function deleteConversation(id: string): void {
  write(read().filter((c) => c.id !== id));
}

// —— React 绑定 ——
export function useConversations(): Conversation[] {
  return useSyncExternalStore(subscribe, getConversations, getConversations);
}
