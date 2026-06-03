import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { mockBroadcast } from '@/data/mockData';
import type { DailyBroadcast } from '@/types';

interface DbBroadcast {
  date: string;
  title: string;
  description: string;
  audio_url: string | null;
  video_url: string | null;
  poster_image: string | null;
  cover_url: string | null;
}

function toModel(row: DbBroadcast): DailyBroadcast {
  return {
    date: row.date,
    title: row.title,
    description: row.description,
    audioUrl:    row.audio_url    ?? mockBroadcast.audioUrl,
    videoUrl:    row.video_url    ?? mockBroadcast.videoUrl,
    posterImage: row.poster_image ?? mockBroadcast.posterImage,
  };
}

/** 拉最新一期播报。Supabase 未配置时直接返回 mockBroadcast。 */
export function useLatestBroadcast() {
  return useQuery<DailyBroadcast>({
    queryKey: ['latestBroadcast'],
    queryFn: async () => {
      if (!supabase) return mockBroadcast;
      const { data, error } = await supabase
        .from('daily_broadcasts')
        .select('date, title, description, audio_url, video_url, poster_image, cover_url')
        .order('date', { ascending: false })
        .limit(1)
        .single();
      if (error || !data) return mockBroadcast;
      return toModel(data as DbBroadcast);
    },
    staleTime:       5 * 60 * 1000,
    placeholderData: mockBroadcast,
    retry: false,
  });
}
