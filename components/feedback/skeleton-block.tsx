import { Skeleton } from "@/components/ui/skeleton";

type SkeletonBlockProps = {
  rows?: number;
};

export function SkeletonBlock({ rows = 3 }: SkeletonBlockProps) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={index} className="h-12 w-full rounded-md" />
      ))}
    </div>
  );
}
