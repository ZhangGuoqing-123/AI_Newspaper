// 与 pipeline/server.py 对接：把 agent 工具循环的 SSE 事件流翻译成前端回调。
// 后端地址走环境变量，本地开发默认指向 FastAPI（uvicorn server:app --port 8787）。

const AGENT_API_BASE = import.meta.env.VITE_AGENT_API_BASE ?? 'http://127.0.0.1:8787';

// 匿名客户端 id：每个浏览器一份，持久化到 localStorage，随请求头 X-User-Id 上报，
// 用于后端按用户隔离偏好画像（见 pipeline/user_memory.py）。零注册门槛，
// 将来接正式登录后用登录用户 id 覆盖即可。
const CLIENT_ID_KEY = 'sve_client_id';

export function getClientId(): string {
  try {
    let id = localStorage.getItem(CLIENT_ID_KEY);
    if (!id) {
      id =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `c_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(CLIENT_ID_KEY, id);
    }
    return id;
  } catch {
    // 隐私模式等 localStorage 不可用时退化为会话内临时 id
    return 'anon';
  }
}

export type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export type TrendTweet = {
  account: string;
  date: string;
  text: string;
  likes: number;
  retweets: number;
  engagement: number;
};

export type TrendAccount = {
  account: string;
  engagement: number;
  count: number;
};

/** 拉取榜单页数据：热门推文榜 + 账号声量榜。 */
export async function fetchTrends(
  limit = 30,
): Promise<{ top_tweets: TrendTweet[]; top_accounts: TrendAccount[] }> {
  const resp = await fetch(`${AGENT_API_BASE}/trends?limit=${limit}`, {
    headers: { 'X-User-Id': getClientId() },
  });
  if (!resp.ok) throw new Error(`服务连接失败（HTTP ${resp.status}）`);
  return resp.json();
}

// 热门讨论话题榜（知乎热榜式）：后台每 6 小时聚类好的快照
export type TopicTweet = {
  account: string;
  date: string;
  text: string;
  quoted?: string; // 引用推文/回复时被引用的原文（text 只是表层短评论）
  likes: number;
  retweets: number;
  engagement: number;
  tweet_id?: string; // 有则可深链原推文，无则回退作者主页
};

export type TrendTopic = {
  rank: number;
  title: string;
  summary: string;
  heat: number;
  tweet_count: number;
  accounts: string[];
  tweets: TopicTweet[];
};

export type TopicsResponse = {
  topics: TrendTopic[];
  window: { since?: string; until?: string };
  computed_at: string | null;
};

/** 推文原文链接：有 status id 则深链具体推文；没有则退而求其次——用「作者 + 正文关键词」
 * 在 X 站内做实时搜索，点开通常能直接定位到那条推（比只跳作者主页有用得多）。
 * text 为空时才回退到作者主页。 */
export function tweetUrl(account: string, tweetId?: string, text?: string): string {
  const handle = account.replace(/^@/, '');
  if (tweetId) return `https://x.com/${handle}/status/${tweetId}`;
  const snippet = (text ?? '')
    .replace(/https?:\/\/\S+/g, ' ') // 去掉链接
    .replace(/[#@]/g, ' ')
    .trim()
    .split(/\s+/)
    .slice(0, 8)
    .join(' ')
    .slice(0, 60)
    .trim();
  if (!snippet) return `https://x.com/${handle}`;
  const q = encodeURIComponent(`from:${handle} ${snippet}`);
  return `https://x.com/search?q=${q}&f=live`;
}

/** 拉取热门话题榜（只读后端缓存快照，与访问量无关）。 */
export async function fetchTopics(): Promise<TopicsResponse> {
  const resp = await fetch(`${AGENT_API_BASE}/topics`, {
    headers: { 'X-User-Id': getClientId() },
  });
  if (!resp.ok) throw new Error(`服务连接失败（HTTP ${resp.status}）`);
  return resp.json();
}

export type ToolCallEvent = {
  name: string;
  argsPreview?: string;
  resultSummary?: string;
  status: 'running' | 'done';
};

type StreamHandlers = {
  onSessionStart?: (sessionId: string) => void;
  onToolCallStart?: (name: string, argsPreview: string) => void;
  onToolCallResult?: (name: string, argsPreview: string, resultSummary: string) => void;
  onReasoning?: (delta: string) => void;
  onToken?: (delta: string) => void;
  onFinalAnswer?: (content: string) => void;
  onError?: (message: string) => void;
  onDone?: () => void;
};

function previewArgs(args: Record<string, unknown> | undefined): string {
  if (!args) return '';
  const parts = Object.entries(args)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${k}: ${v}`);
  return parts.join(' · ');
}

function summarizeResult(name: string, result: unknown): string {
  if (result == null) return '';
  if (Array.isArray(result)) return `命中 ${result.length} 条`;
  if (typeof result === 'object') {
    const r = result as Record<string, unknown>;
    if (typeof r.count === 'number') return `共 ${r.count} 条相关内容`;
    if (r.status === 'error') return '执行出错';
    if (typeof r.message === 'string') return String(r.message).slice(0, 60);
  }
  return '已返回结果';
}

/**
 * 发起一次提问，流式接收 agent 的工具调用事件 + 最终回答。
 * 用 fetch + ReadableStream 手动解析 SSE（而不是 EventSource），
 * 因为后端用的是 POST，EventSource 只支持 GET。
 */
export async function streamChat(
  question: string,
  handlers: StreamHandlers,
  signal?: AbortSignal,
  history?: ChatMessage[],
): Promise<void> {
  try {
    const resp = await fetch(`${AGENT_API_BASE}/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': getClientId(),
      },
      body: JSON.stringify({ question, history: history ?? [] }),
      signal,
    });

    if (!resp.ok || !resp.body) {
      handlers.onError?.(`服务连接失败（HTTP ${resp.status}）`);
      handlers.onDone?.();
      return;
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    // 记录每个工具名最近一次调用的参数预览，结果事件复用它
    const lastArgsPreview: Record<string, string> = {};

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const chunks = buffer.split('\n\n');
      buffer = chunks.pop() ?? '';

      for (const chunk of chunks) {
        const line = chunk.trim();
        if (!line.startsWith('data:')) continue;
        const jsonStr = line.slice(5).trim();
        if (!jsonStr) continue;

        let event: Record<string, unknown>;
        try {
          event = JSON.parse(jsonStr);
        } catch {
          continue;
        }

        switch (event.type) {
          case 'session_start':
            handlers.onSessionStart?.(String(event.session_id));
            break;
          case 'tool_call_start': {
            const name = String(event.name);
            const preview = previewArgs(event.args as Record<string, unknown>);
            lastArgsPreview[name] = preview;
            handlers.onToolCallStart?.(name, preview);
            break;
          }
          case 'tool_call_result': {
            const name = String(event.name);
            const preview = lastArgsPreview[name] ?? '';
            handlers.onToolCallResult?.(name, preview, summarizeResult(name, event.result));
            break;
          }
          case 'reasoning_token':
            handlers.onReasoning?.(String(event.content ?? ''));
            break;
          case 'answer_token':
            handlers.onToken?.(String(event.content ?? ''));
            break;
          case 'final_answer':
            handlers.onFinalAnswer?.(String(event.content ?? ''));
            break;
          case 'error':
            handlers.onError?.(String(event.message ?? '未知错误'));
            break;
          case 'done':
            handlers.onDone?.();
            return;
          default:
            break;
        }
      }
    }
    handlers.onDone?.();
  } catch (e) {
    // 用户主动中断（点了「停止」）：不是错误，安静收尾即可
    if (e instanceof DOMException && e.name === 'AbortError') {
      handlers.onDone?.();
      return;
    }
    handlers.onError?.(e instanceof Error ? e.message : String(e));
    handlers.onDone?.();
  }
}
