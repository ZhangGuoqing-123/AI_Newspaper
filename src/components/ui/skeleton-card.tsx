import { Skeleton } from "@/components/ui/skeleton";

export const ArticleCardSkeleton = () => (
  <div className="mx-4 mb-3 p-4 bg-card rounded-2xl shadow-card">
    {/* 频道标签骨架 */}
    <div className="flex items-center gap-2 mb-3">
      <Skeleton className="w-8 h-8 rounded-lg" />
      <Skeleton className="h-5 w-24 rounded-full" />
      <Skeleton className="h-4 w-16" />
    </div>

    {/* 内容区域骨架 */}
    <div className="flex gap-3">
      <div className="flex-1">
        <Skeleton className="h-5 w-full mb-2" />
        <Skeleton className="h-5 w-3/4 mb-3" />
        <Skeleton className="h-4 w-full mb-1" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      <Skeleton className="w-20 h-20 rounded-xl flex-shrink-0" />
    </div>

    {/* 底部骨架 */}
    <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-4 w-16" />
    </div>
  </div>
);

export const AISummarySkeleton = () => (
  <div className="mx-4 mb-4 p-4 rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20">
    <div className="flex items-center gap-2 mb-3">
      <Skeleton className="w-8 h-8 rounded-lg" />
      <div>
        <Skeleton className="h-4 w-24 mb-1" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
    <Skeleton className="h-4 w-full mb-2" />
    <Skeleton className="h-4 w-full mb-2" />
    <Skeleton className="h-4 w-2/3 mb-4" />
    <div className="flex items-center gap-4">
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-4 w-24" />
    </div>
  </div>
);

export const ChannelCardSkeleton = () => (
  <div className="flex items-center gap-3 p-3 bg-card rounded-xl mb-2 shadow-sm">
    <Skeleton className="w-6 h-6 rounded-md" />
    <Skeleton className="w-12 h-12 rounded-xl" />
    <div className="flex-1">
      <Skeleton className="h-4 w-32 mb-2" />
      <Skeleton className="h-3 w-full mb-1" />
      <Skeleton className="h-3 w-16" />
    </div>
    <Skeleton className="h-9 w-20 rounded-full" />
  </div>
);
