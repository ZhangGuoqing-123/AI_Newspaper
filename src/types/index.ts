// 硅谷速递 - 类型定义

export interface Source {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  platform: 'twitter' | 'youtube' | 'blog' | 'website' | 'hackernews' | 'newsletter';
  description: string;
  followerCount: number;
  isFollowed?: boolean;
}

export interface Channel {
  id: string;
  name: string;
  icon: string;
  description: string;
  subscriberCount: number;
  isSubscribed?: boolean;
  pushEnabled?: boolean;
  sources?: Source[];
}

// 章节子点
export interface ChapterPoint {
  title: string;
  details?: string;
}

// 章节结构（用于长内容）
export interface Chapter {
  title: string;
  points: ChapterPoint[];
}

// AI 总结（支持短内容和长内容两种格式）
export interface AISummary {
  introduction: string;
  // 短内容：简单要点列表
  corePoints?: string[];
  // 长内容：章节结构
  chapters?: Chapter[];
  exclusiveComment: string;
}

export interface Article {
  id: string;
  title: string;
  summary: string;
  coverImage?: string;
  channelId: string;
  channelName: string;
  channelIcon: string;
  sourceUrl: string;
  publishedAt: string;
  readTime: number;
  // 新增字段
  sourceType?: 'twitter' | 'youtube' | 'blog' | 'website';
  authorName?: string;
  authorHandle?: string;
  aiSummary?: AISummary;
  originalContent?: string;
}

export interface DailySummary {
  date: string;
  title: string;
  content: string;
  articleCount: number;
  channelCount: number;
}

// 每日播报：日报的 TTS 音频 + 数字人口播视频
export interface DailyBroadcast {
  date: string;
  title: string;
  description: string; // 文稿 / 简介
  audioUrl: string;
  videoUrl: string;
  posterImage?: string; // 视频封面
}

export type PushChannel = 'email' | 'feishu';

export interface User {
  uid: string;
  nickname: string;
  avatar?: string;
  isVip: boolean;
  vipExpireDate?: string;
  pushTime: string;
  pushChannel?: PushChannel;
  pushEmail?: string;
  pushFeishuWebhook?: string;
  subscriptions: UserSubscription[];
}

export interface UserSubscription {
  channelId: string;
  pushEnabled: boolean;
}
