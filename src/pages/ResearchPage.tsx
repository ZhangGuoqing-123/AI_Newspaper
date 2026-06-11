import { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Loader2, CheckCircle2, ArrowUp, Square, ChevronDown, Bookmark, History, Plus, Trash2, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import MobileLayout from '@/components/layout/MobileLayout';
import robotHead from '@/assets/robot-head.png';
import {
  ChatMessage,
  ToolCallEvent,
  streamChat,
} from '@/lib/agentApi';
import { answerFavoriteId, toggleFavorite, useIsFavorited } from '@/lib/favorites';
import {
  Conversation,
  newConversationId,
  upsertConversation,
  deleteConversation,
  useConversations,
} from '@/lib/conversations';

const EXAMPLE_QUESTIONS = [
  'Claude Code 最近有什么新进展？',
  '最近 AI Agent 圈子有什么值得关注的？',
  '大家最近都在热议 OpenAI 的什么？',
];

// 历史列表用的相对时间：刚刚 / N分钟前 / N小时前 / 昨天 / N天前 / 日期
function formatRelative(ts: number): string {
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60000);
  if (min < 1) return '刚刚';
  if (min < 60) return `${min} 分钟前`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} 小时前`;
  const day = Math.floor(hr / 24);
  if (day === 1) return '昨天';
  if (day < 7) return `${day} 天前`;
  return new Date(ts).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' });
}

const TOOL_LABELS: Record<string, { label: string; icon: string }> = {
  search_local: { label: '精确检索', icon: '🔍' },
  search_by_topic: { label: '语义检索', icon: '🧭' },
  get_stats: { label: '热度分析', icon: '📊' },
};

function summarizeToolResult(name: string, result: unknown): string {
  if (result == null) return '';
  try {
    if (Array.isArray(result)) return `命中 ${result.length} 条`;
    const r = result as Record<string, unknown>;
    if (typeof r.count === 'number') return `共 ${r.count} 条相关内容`;
    if (typeof r.status === 'string') {
      if (r.status === 'ok' && typeof r.message === 'string') return String(r.message).slice(0, 40);
      if (r.status === 'error') return '执行出错';
    }
  } catch {
    /* noop */
  }
  return '已返回结果';
}

const ToolTrace = ({ event }: { event: ToolCallEvent }) => {
  const meta = TOOL_LABELS[event.name] ?? { label: event.name, icon: '⚙️' };
  const done = event.status === 'done';
  return (
    <div className="flex items-start gap-2 px-3 py-1.5 rounded-lg bg-secondary/40 text-xs">
      <span className="text-sm leading-none mt-0.5">{meta.icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 text-foreground/80 font-medium">
          <span>{meta.label}</span>
          {!done && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />}
          {done && <CheckCircle2 className="w-3 h-3 text-primary/70" />}
        </div>
        {event.argsPreview && (
          <div className="text-muted-foreground/80 truncate">{event.argsPreview}</div>
        )}
        {done && event.resultSummary && (
          <div className="text-muted-foreground/70">→ {event.resultSummary}</div>
        )}
      </div>
    </div>
  );
};

const ToolTraceGroup = ({ traces, isRunning }: { traces: ToolCallEvent[]; isRunning: boolean }) => {
  const [expanded, setExpanded] = useState(true);

  // 回答出来后自动折叠
  useEffect(() => {
    if (!isRunning && traces.length > 0) setExpanded(false);
  }, [isRunning]);

  if (traces.length === 0) return null;

  // 生成摘要：按工具类型聚合，如 "语义检索 ×3 · 互动统计 ×1"
  const counts = traces.reduce<Record<string, number>>((acc, t) => {
    const label = TOOL_LABELS[t.name]?.label ?? t.name;
    acc[label] = (acc[label] || 0) + 1;
    return acc;
  }, {});
  const summary = Object.entries(counts)
    .map(([label, n]) => (n > 1 ? `${label} ×${n}` : label))
    .join(' · ');

  return (
    <div className="space-y-1">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-2 px-3 py-1.5 rounded-xl bg-secondary/30 text-xs text-muted-foreground hover:bg-secondary/50 transition-colors"
      >
        {isRunning && <Loader2 className="w-3 h-3 animate-spin shrink-0" />}
        {!isRunning && <CheckCircle2 className="w-3 h-3 text-primary/60 shrink-0" />}
        <span className="flex-1 text-left truncate">{summary}</span>
        <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="traces"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden space-y-1 pl-1"
          >
            {traces.map((t, i) => (
              <ToolTrace key={`${t.name}-${i}`} event={t} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};


// question 仅在「已定稿的助手回答」上传入，用来生成可收藏的问答对。
// 流式中的临时气泡不传，自然就不显示收藏按钮。
const MessageBubble = ({ message, question }: { message: ChatMessage; question?: string }) => {
  const isUser = message.role === 'user';
  const favId = !isUser && question ? answerFavoriteId(question, message.content) : '';
  const favorited = useIsFavorited(favId);
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
    >
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          isUser
            ? 'bg-primary text-primary-foreground rounded-br-md whitespace-pre-wrap'
            : 'bg-card text-foreground rounded-bl-md shadow-card prose prose-sm prose-neutral max-w-none ' +
              'prose-headings:text-foreground prose-headings:font-bold prose-headings:mt-2.5 prose-headings:mb-1 first:prose-headings:mt-0 ' +
              'prose-h2:text-base prose-h3:text-sm prose-p:my-1.5 prose-p:leading-relaxed ' +
              'prose-strong:text-foreground prose-strong:font-semibold ' +
              'prose-ul:my-1.5 prose-ol:my-1.5 prose-li:my-0.5 ' +
              'prose-hr:my-2.5 prose-hr:border-border ' +
              'prose-a:text-primary prose-blockquote:text-muted-foreground prose-blockquote:border-primary/30 ' +
              'prose-table:text-xs prose-table:w-full prose-th:text-left prose-th:font-semibold prose-th:border-b prose-th:border-border prose-th:pb-1 prose-td:border-b prose-td:border-border/40 prose-td:py-1'
        }`}
      >
        {isUser ? (
          message.content
        ) : (
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
        )}
      </div>
      {!isUser && question && (
        <button
          onClick={() =>
            toggleFavorite({
              kind: 'answer',
              id: favId,
              question,
              answer: message.content,
              savedAt: Date.now(),
            })
          }
          className={`mt-1.5 ml-1 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs active:scale-95 transition-transform ${
            favorited ? 'bg-primary/10 text-primary' : 'bg-secondary text-foreground/70'
          }`}
        >
          <Bookmark className={`w-3.5 h-3.5 ${favorited ? 'fill-primary' : ''}`} />
          {favorited ? '已收藏' : '收藏'}
        </button>
      )}
    </motion.div>
  );
};

const ResearchPage = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [traces, setTraces] = useState<ToolCallEvent[]>([]);
  const [reasoning, setReasoning] = useState('');
  const [streaming, setStreaming] = useState('');
  const [input, setInput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  // 镜像最新的流式正文，供「停止」时把已流出的内容定稿（避免闭包读到旧 state）
  const streamingRef = useRef('');
  // 镜像消息列表，供发起提问时把「本次对话的前几轮」作为多轮上下文带给后端
  const messagesRef = useRef<ChatMessage[]>([]);
  // 当前对话 id：一整段对话共享一个 id，回答定稿时按它 upsert 到本地历史
  const convIdRef = useRef(newConversationId());
  // 「加载历史对话」时把消息灌进 state 会触发保存 effect，置此标志跳过一次，避免无谓地把被读取的对话顶到列表最前
  const skipSaveRef = useRef(false);
  const conversations = useConversations();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, traces, streaming, reasoning]);

  // 保持 messagesRef 与 messages 同步，供 ask() 读取当前对话历史
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // 每当有新消息定稿（用户提问 + 助手回答），把当前对话存到本地历史。
  // 至少出现一条助手回答才存，避免只存了用户的半截提问。
  useEffect(() => {
    if (skipSaveRef.current) {
      skipSaveRef.current = false;
      return;
    }
    if (messages.length === 0) return;
    if (!messages.some((m) => m.role === 'assistant')) return;
    upsertConversation(convIdRef.current, messages);
  }, [messages]);

  // 新对话：清空当前界面，换一个新对话 id
  const newChat = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    streamingRef.current = '';
    convIdRef.current = newConversationId();
    setMessages([]);
    setTraces([]);
    setReasoning('');
    setStreaming('');
    setIsRunning(false);
    setDrawerOpen(false);
  }, []);

  // 从历史抽屉点开一段旧对话：灌回界面，切换当前 id（跳过一次保存）
  const loadConversation = useCallback((conv: Conversation) => {
    abortRef.current?.abort();
    abortRef.current = null;
    streamingRef.current = '';
    skipSaveRef.current = true;
    convIdRef.current = conv.id;
    setMessages(conv.messages);
    setTraces([]);
    setReasoning('');
    setStreaming('');
    setIsRunning(false);
    setDrawerOpen(false);
  }, []);

  const ask = useCallback((question: string) => {
    if (!question.trim() || isRunning) return;
    // 把本次对话已有的轮次作为上下文带给后端（多轮）；本条新提问不含在内
    const history = messagesRef.current.slice();
    setMessages((prev) => [...prev, { role: 'user', content: question }]);
    setTraces([]);
    setReasoning('');
    setStreaming('');
    streamingRef.current = '';
    setInput('');
    setIsRunning(true);

    const controller = new AbortController();
    abortRef.current = controller;

    streamChat(question, {
      onSessionStart: () => {},
      onToolCallStart: (name, argsPreview) => {
        setTraces((prev) => [...prev, { name, argsPreview, status: 'running' }]);
      },
      onToolCallResult: (name, argsPreview, resultSummary) => {
        setTraces((prev) => {
          const idx = [...prev].reverse().findIndex((t) => t.name === name && t.status === 'running');
          if (idx === -1) return [...prev, { name, argsPreview, resultSummary, status: 'done' }];
          const realIdx = prev.length - 1 - idx;
          const next = [...prev];
          next[realIdx] = { ...next[realIdx], resultSummary, status: 'done' };
          return next;
        });
      },
      onReasoning: (delta) => {
        setReasoning((prev) => prev + delta);
      },
      onToken: (delta) => {
        streamingRef.current += delta;
        setStreaming((prev) => prev + delta);
      },
      onFinalAnswer: (content) => {
        // 用完整文本定稿，清空流式/思考缓冲，避免重复渲染
        setMessages((prev) => [...prev, { role: 'assistant', content }]);
        setReasoning('');
        setStreaming('');
        streamingRef.current = '';
      },
      onError: (msg) => {
        setMessages((prev) => [...prev, { role: 'assistant', content: `出错了：${msg}` }]);
        setReasoning('');
        setStreaming('');
      },
      onDone: () => {
        setIsRunning(false);
        abortRef.current = null;
      },
    }, controller.signal, history);
  }, [isRunning]);

  // 用户点「停止」：中断请求，并把已经流出的正文定稿为一条带「（已停止）」标记的消息
  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    const partial = streamingRef.current.trim();
    if (partial) {
      setMessages((prev) => [...prev, { role: 'assistant', content: `${partial}\n\n_（已停止）_` }]);
    }
    streamingRef.current = '';
    setStreaming('');
    setReasoning('');
    setIsRunning(false);
  }, []);

  // 从「榜单」点「让 AI 深聊」跳过来时，带着预设问题自动提问一次
  useEffect(() => {
    const preset = (location.state as { ask?: string } | null)?.ask;
    if (preset) {
      navigate(location.pathname, { replace: true, state: {} }); // 清掉，避免刷新/返回重复触发
      ask(preset);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isEmpty = messages.length === 0;

  return (
    <MobileLayout>
      {/* 历史对话抽屉：左滑入，约束在手机框内（fixed 居中 + 内层 max-w） */}
      <AnimatePresence>
        {drawerOpen && (
          <div className="fixed inset-0 z-50 flex justify-center pointer-events-none">
            <div className="relative w-full max-w-[430px] pointer-events-auto">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setDrawerOpen(false)}
                className="absolute inset-0 bg-black/40"
              />
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'tween', duration: 0.22 }}
                className="absolute left-0 top-0 bottom-0 w-[80%] max-w-[320px] bg-background shadow-2xl flex flex-col"
              >
                <div className="flex items-center justify-between px-4 pt-5 pb-3 border-b border-border">
                  <h2 className="text-base font-bold text-foreground">历史对话</h2>
                  <button
                    onClick={() => setDrawerOpen(false)}
                    aria-label="关闭"
                    className="w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground active:scale-95 transition-transform"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={newChat}
                  className="mx-3 mt-3 mb-1 flex items-center gap-2 px-3 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium active:scale-[0.98] transition-transform"
                >
                  <Plus className="w-4 h-4" />
                  新对话
                </button>

                <div className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
                  {conversations.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center mt-8 px-4">
                      还没有历史对话。<br />问点什么，它就会出现在这里。
                    </p>
                  ) : (
                    conversations.map((c) => {
                      const active = c.id === convIdRef.current;
                      return (
                        <div
                          key={c.id}
                          onClick={() => loadConversation(c)}
                          className={`group flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${
                            active ? 'bg-secondary' : 'hover:bg-secondary/50'
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-foreground truncate">{c.title}</div>
                            <div className="text-[11px] text-muted-foreground mt-0.5">
                              {formatRelative(c.updatedAt)}
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteConversation(c.id);
                              if (c.id === convIdRef.current) newChat();
                            }}
                            aria-label="删除对话"
                            className="w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground/60 hover:text-destructive shrink-0"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex flex-col min-h-[calc(100vh-5rem)]">
        {/* 头部 */}
        <div className="px-3 pt-5 pb-3 border-b border-border/40">
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={() => setDrawerOpen(true)}
              aria-label="历史对话"
              className="w-9 h-9 rounded-full flex items-center justify-center text-muted-foreground hover:bg-secondary active:scale-90 transition-all shrink-0"
            >
              <History className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 shadow-sm">
                <img src={robotHead} alt="小助手" className="w-full h-full object-cover" />
              </div>
              <h1 className="text-base font-bold text-foreground truncate">AI 情报助手</h1>
            </div>
            <button
              onClick={newChat}
              aria-label="新对话"
              className="w-9 h-9 rounded-full flex items-center justify-center text-muted-foreground hover:bg-secondary active:scale-90 transition-all shrink-0"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-2">
            你可以和我聊任何与 AI 相关的话题
          </p>
        </div>

        {/* 内容区 */}
        <div className="flex-1 overflow-y-auto px-4 space-y-3 pb-3">
          {isEmpty && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-6 space-y-2.5"
            >
              <p className="text-xs text-muted-foreground px-1">试试这些问题 👇</p>
              {EXAMPLE_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => ask(q)}
                  className="w-full text-left px-4 py-3 rounded-2xl bg-card shadow-card text-sm text-foreground active:scale-[0.98] transition-transform"
                >
                  {q}
                </button>
              ))}
            </motion.div>
          )}

          {messages.map((m, i) => (
            <MessageBubble
              key={i}
              message={m}
              // 助手回答配对最近一条用户提问，作为可收藏问答对的「问」
              question={
                m.role === 'assistant'
                  ? [...messages.slice(0, i)].reverse().find((x) => x.role === 'user')?.content
                  : undefined
              }
            />
          ))}

          {/* 当前轮次的工具调用轨迹（运行中展开，完成后折叠成一行摘要） */}
          <ToolTraceGroup traces={traces} isRunning={isRunning} />

          {/* 思考态：正文还没开始吐字时，把推理模型的思维链做成可见的实时反馈，
              避免几十秒静止等待。一旦正文开始，思考区让位给流式答案。 */}
          {isRunning && !streaming && (
            <div className="space-y-1.5 px-1">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>{reasoning ? '正在思考…' : 'agent 正在思考…'}</span>
              </div>
              {reasoning && (
                <div className="max-h-28 overflow-y-auto rounded-xl bg-secondary/30 px-3 py-2 text-xs leading-relaxed text-muted-foreground/80 whitespace-pre-wrap">
                  {reasoning}
                </div>
              )}
            </div>
          )}

          {/* 流式回答：边生成边渲染，定稿后由 messages 接管 */}
          {streaming && <MessageBubble message={{ role: 'assistant', content: streaming }} />}

          <div ref={scrollRef} />
        </div>

        {/* 输入框 */}
        <div className="px-4 pb-4 pt-2">
          <div className="flex items-center gap-2 bg-card rounded-full shadow-card pl-4 pr-1.5 py-1.5">
            <Search className="w-4 h-4 text-muted-foreground shrink-0" />
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') ask(input);
              }}
              placeholder="问点什么…"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              disabled={isRunning}
            />
            {isRunning ? (
              <button
                onClick={stop}
                aria-label="停止生成"
                className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center active:scale-95 transition-transform shrink-0"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
              </button>
            ) : (
              <button
                onClick={() => ask(input)}
                disabled={!input.trim()}
                aria-label="发送"
                className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40 active:scale-95 transition-transform shrink-0"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </MobileLayout>
  );
};

export default ResearchPage;
