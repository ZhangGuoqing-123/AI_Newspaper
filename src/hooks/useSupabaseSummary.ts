import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { mockDailySummary } from '@/data/mockData';
import type { DailySummary } from '@/types';

interface DbSummary {
  date: string;
  title: string;
  content: string;
  article_count: number;
  channel_count: number;
}

function toModel(row: DbSummary): DailySummary {
  return {
    date:         row.date,
    title:        row.title,
    content:      row.content,
    articleCount: row.article_count,
    channelCount: row.channel_count,
  };
}

/** 拉最新一期日报摘要。Supabase 未配置时直接返回 mockDailySummary。 */
export function useLatestSummary() {
  return useQuery<DailySummary>({
    queryKey: ['latestSummary'],
    queryFn: async () => {
      if (!supabase) return mockDailySummary;
      const { data, error } = await supabase
        .from('daily_summaries')
        .select('date, title, content, article_count, channel_count')
        .order('date', { ascending: false })
        .limit(1)
        .single();
      if (error || !data) return mockDailySummary;
      return toModel(data as DbSummary);
    },
    staleTime:       5 * 60 * 1000,
    placeholderData: mockDailySummary,
    retry: false,
  });
}
