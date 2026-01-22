import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const glassCardVariants = cva(
  "relative overflow-hidden rounded-xl transition-all duration-300",
  {
    variants: {
      variant: {
        default: [
          "bg-card/60 backdrop-blur-xl border border-border/50",
          "hover:border-primary/30 hover:shadow-[0_8px_32px_hsl(330_100%_60%/0.15)]",
        ].join(" "),
        elevated: [
          "bg-card/70 backdrop-blur-2xl border border-border/40",
          "shadow-[0_8px_32px_hsl(0_0%_0%/0.3),inset_0_1px_0_hsl(0_0%_100%/0.05)]",
          "hover:shadow-[0_16px_48px_hsl(0_0%_0%/0.4),0_0_40px_hsl(330_100%_60%/0.15)]",
          "hover:border-primary/40",
        ].join(" "),
        subtle: [
          "bg-card/40 backdrop-blur-lg border border-border/30",
          "hover:bg-card/60 hover:border-border/50",
        ].join(" "),
        gradient: [
          "bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl",
          "border border-border/40",
          "hover:from-card/90 hover:to-card/50 hover:border-primary/30",
        ].join(" "),
        glow: [
          "bg-card/60 backdrop-blur-xl border border-primary/20",
          "shadow-[0_0_40px_hsl(330_100%_60%/0.1)]",
          "hover:border-primary/50 hover:shadow-[0_0_60px_hsl(330_100%_60%/0.25)]",
        ].join(" "),
      },
      size: {
        sm: "p-4",
        md: "p-6",
        lg: "p-8",
        xl: "p-10",
      },
      interactive: {
        true: "cursor-pointer hover:-translate-y-1",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
      interactive: false,
    },
  }
);

export interface GlassCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof glassCardVariants> {
  /** Show animated gradient border on hover */
  gradientBorder?: boolean;
  /** Show glow orbs in background */
  showOrbs?: boolean;
}

const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  (
    {
      className,
      variant,
      size,
      interactive,
      gradientBorder = false,
      showOrbs = false,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          glassCardVariants({ variant, size, interactive }),
          gradientBorder && "border-gradient",
          className
        )}
        {...props}
      >
        {showOrbs && (
          <>
            <div className="absolute -top-20 -right-20 w-40 h-40 glow-orb glow-orb-primary" />
            <div className="absolute -bottom-20 -left-20 w-32 h-32 glow-orb glow-orb-secondary" />
          </>
        )}
        <div className="relative z-10">{children}</div>
      </div>
    );
  }
);
GlassCard.displayName = "GlassCard";

// Bento-specific glass card
const BentoCard = React.forwardRef<
  HTMLDivElement,
  GlassCardProps & {
    span?: "default" | "wide" | "tall" | "large";
  }
>(({ className, span = "default", ...props }, ref) => {
  const spanClasses = {
    default: "",
    wide: "sm:col-span-2",
    tall: "sm:row-span-2",
    large: "sm:col-span-2 sm:row-span-2",
  };

  return (
    <GlassCard
      ref={ref}
      variant="elevated"
      interactive
      className={cn(spanClasses[span], className)}
      {...props}
    />
  );
});
BentoCard.displayName = "BentoCard";

export { GlassCard, BentoCard, glassCardVariants };
