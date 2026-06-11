import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Plus, Trash2, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MobileLayout from '@/components/layout/MobileLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';

const API = import.meta.env.VITE_AGENT_API_BASE || 'http://127.0.0.1:8787';

interface Source {
  screen_name: string;
  active: boolean;
  added_at: string;
}

const AddSourcePage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  const [adding, setAdding] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/sources`);
      setSources(await r.json());
    } catch {
      toast({ title: '加载失败', description: '后端未启动？', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    const name = input.trim().replace(/^@/, '');
    if (!name) return;
    setAdding(true);
    try {
      const r = await fetch(`${API}/sources`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ screen_name: name }),
      });
      if (!r.ok) {
        const err = await r.json();
        throw new Error(err.detail || '添加失败');
      }
      setInput('');
      await load();
      toast({ title: `@${name} 已添加`, description: '下次自动巡检时开始抓取' });
    } catch (e: any) {
      toast({ title: '添加失败', description: e.message, variant: 'destructive' });
    } finally {
      setAdding(false);
    }
  };

  const handleToggle = async (screen_name: string, active: boolean) => {
    setSources(s => s.map(x => x.screen_name === screen_name ? { ...x, active } : x));
    await fetch(`${API}/sources/${screen_name}?active=${active}`, { method: 'PATCH' });
  };

  const handleDelete = async (screen_name: string) => {
    setSources(s => s.filter(x => x.screen_name !== screen_name));
    await fetch(`${API}/sources/${screen_name}`, { method: 'DELETE' });
    toast({ title: `@${screen_name} 已移除` });
  };

  const activeCount = sources.filter(s => s.active).length;

  return (
    <MobileLayout showNav={false}>
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <motion.button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center"
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </motion.button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-foreground">情报来源</h1>
            <p className="text-xs text-muted-foreground">
              {loading ? '加载中...' : `${activeCount} 个账号追踪中 · 共 ${sources.length} 个`}
            </p>
          </div>
          <motion.button onClick={load} whileTap={{ scale: 0.9 }} disabled={loading}>
            <RefreshCw className={`w-5 h-5 text-muted-foreground ${loading ? 'animate-spin' : ''}`} />
          </motion.button>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* 添加输入框 */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
            <Input
              className="pl-7 h-11"
              placeholder="twitter handle，如 karpathy"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
            />
          </div>
          <Button className="h-11 px-4" onClick={handleAdd} disabled={adding || !input.trim()}>
            {adding ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          </Button>
        </div>

        {/* 信源列表 */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-14 rounded-xl bg-secondary animate-pulse" />
            ))}
          </div>
        ) : (
          <AnimatePresence>
            {sources.map(src => (
              <motion.div
                key={src.screen_name}
                layout
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-card border border-border"
              >
                <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-sm font-bold text-muted-foreground flex-shrink-0">
                  {src.screen_name[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">@{src.screen_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {src.active ? '追踪中' : '已暂停'}
                  </p>
                </div>
                <Switch
                  checked={src.active}
                  onCheckedChange={v => handleToggle(src.screen_name, v)}
                />
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleDelete(src.screen_name)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </motion.button>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </MobileLayout>
  );
};

export default AddSourcePage;
