import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

const buttonVariants = cva(
  "premium-button inline-flex items-center justify-center rounded-md text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 relative overflow-hidden",
  {
    variants: {
      variant: {
        default: "premium-button-default bg-gradient-to-r from-primary to-indigo-600 text-white shadow-lg hover:shadow-primary/20 border border-primary/20",
        destructive: "premium-button-destructive bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg hover:shadow-red-500/20 border border-red-500/20",
        outline: "premium-button-outline bg-background text-foreground shadow-sm hover:shadow-md border border-input",
        secondary: "premium-button-secondary bg-gradient-to-r from-secondary to-blue-500 text-white shadow-lg hover:shadow-secondary/20 border border-secondary/20",
        ghost: "premium-button-ghost hover:bg-accent hover:text-accent-foreground",
        link: "premium-button-link text-primary underline-offset-4 hover:underline",
        success: "premium-button-success bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg hover:shadow-emerald-500/20 border border-emerald-500/20",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface PremiumButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
}

export const PremiumButton = React.forwardRef<HTMLButtonElement, PremiumButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, icon, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={loading || props.disabled}
        {...props}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {children}
          </>
        ) : (
          <>
            {icon && <span className="mr-2">{icon}</span>}
            {children}
          </>
        )}
        
        {/* Add subtle shimmer effect */}
        <span className="absolute inset-0 overflow-hidden rounded-md">
          <span className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent"></span>
        </span>
      </Comp>
    );
  }
);