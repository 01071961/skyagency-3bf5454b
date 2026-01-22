import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface SkeletonCardProps {
  className?: string;
  variant?: "stat" | "feature" | "platform" | "cta";
}

export const SkeletonCard = ({ className, variant = "feature" }: SkeletonCardProps) => {
  if (variant === "stat") {
    return (
      <div className={cn("p-4 rounded-xl bg-muted/10 backdrop-blur-sm border border-white/5", className)}>
        <Skeleton className="w-10 h-10 rounded-xl mx-auto mb-3" />
        <Skeleton className="h-8 w-20 mx-auto mb-2" />
        <Skeleton className="h-3 w-16 mx-auto" />
      </div>
    );
  }

  if (variant === "platform") {
    return (
      <div className={cn("text-center", className)}>
        <Skeleton className="w-16 h-16 rounded-xl mx-auto mb-2" />
        <Skeleton className="h-3 w-12 mx-auto" />
      </div>
    );
  }

  if (variant === "cta") {
    return (
      <div className={cn("p-8 rounded-2xl bg-muted/10 backdrop-blur-sm border border-white/5 max-w-2xl mx-auto", className)}>
        <Skeleton className="h-10 w-3/4 mx-auto mb-4" />
        <Skeleton className="h-4 w-2/3 mx-auto mb-6" />
        <Skeleton className="h-12 w-48 mx-auto rounded-xl" />
      </div>
    );
  }

  return (
    <div className={cn("p-5 rounded-xl bg-muted/10 backdrop-blur-sm border border-white/5", className)}>
      <Skeleton className="w-12 h-12 rounded-xl mx-auto mb-3" />
      <Skeleton className="h-5 w-24 mx-auto mb-2" />
      <Skeleton className="h-3 w-32 mx-auto mb-3" />
      <Skeleton className="h-3 w-16 mx-auto" />
    </div>
  );
};

export default SkeletonCard;
