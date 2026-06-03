import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

// 未配置 .env 时为 null，页面会回退到占位数据，不报错
export const supabase = url && anonKey ? createClient(url, anonKey) : null;
