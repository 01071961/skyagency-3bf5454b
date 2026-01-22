import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium ring-offset-background transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 touch-manipulation select-none",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] shadow-md hover:shadow-lg",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:scale-[1.02] active:scale-[0.98]",
        outline: "border-2 border-primary/50 bg-transparent hover:bg-primary/10 hover:border-primary text-foreground hover:scale-[1.02] active:scale-[0.98] backdrop-blur-sm",
        secondary: "bg-secondary/80 text-secondary-foreground backdrop-blur-sm border border-border/50 hover:bg-secondary hover:border-primary/50 hover:scale-[1.02] active:scale-[0.98]",
        ghost: "hover:bg-accent/50 hover:text-accent-foreground active:bg-accent/80 backdrop-blur-sm",
        link: "text-primary underline-offset-4 hover:underline",
        // Premium hero button with glassmorphism and gradient
        hero: "relative bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_100%] text-white font-semibold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/40 hover:scale-[1.05] active:scale-[0.98] animate-gradient-x overflow-hidden before:absolute before:inset-0 before:bg-white/20 before:translate-x-[-100%] hover:before:translate-x-[100%] before:transition-transform before:duration-500",
        // Glass button with blur effect
        glass: "bg-glass-light dark:bg-glass-dark backdrop-blur-xl border border-white/20 dark:border-white/10 text-foreground shadow-glass hover:bg-white/30 dark:hover:bg-white/15 hover:scale-[1.02] hover:shadow-glass-strong active:scale-[0.98]",
        // Gradient outline button
        "gradient-outline": "relative bg-transparent border-0 text-foreground before:absolute before:inset-0 before:rounded-xl before:p-[2px] before:bg-gradient-to-r before:from-primary before:via-accent before:to-primary before:-z-10 after:absolute after:inset-[2px] after:rounded-[10px] after:bg-background after:-z-10 hover:scale-[1.02] hover:before:shadow-glow-primary active:scale-[0.98]",
        // Glow button
        glow: "bg-primary text-primary-foreground shadow-lg shadow-primary/40 hover:shadow-xl hover:shadow-primary/60 hover:scale-[1.05] active:scale-[0.98] transition-all duration-300",
      },
      size: {
        default: "h-11 px-6 py-2.5 min-h-[44px] max-w-[300px]",
        sm: "h-9 rounded-lg px-4 min-h-[36px]",
        lg: "h-12 sm:h-14 rounded-xl px-8 sm:px-10 min-h-[48px] text-base sm:text-lg max-w-[400px]",
        xl: "h-14 sm:h-16 rounded-2xl px-10 sm:px-12 min-h-[56px] text-lg sm:text-xl max-w-[450px]",
        icon: "h-11 w-11 min-h-[44px] min-w-[44px] rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, onClick, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      // Haptic feedback for mobile devices
      if ('vibrate' in navigator) {
        navigator.vibrate(10);
      }
      onClick?.(e);
    };
    
    return (
      <Comp 
        className={cn(buttonVariants({ variant, size, className }))} 
        ref={ref} 
        onClick={handleClick}
        {...props} 
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
