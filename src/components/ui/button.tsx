import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-xl border text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(var(--background))] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "border-[hsl(var(--accent-strong))] bg-[hsl(var(--accent))] px-4 py-2.5 text-[hsl(var(--accent-foreground))] shadow-[0_18px_38px_-24px_hsla(var(--shadow-strong),0.42)] hover:-translate-y-0.5 hover:border-[hsl(var(--accent-strong))] hover:bg-[hsl(var(--accent-strong))] hover:shadow-[0_24px_44px_-24px_hsla(var(--shadow-strong),0.46)]",
        secondary:
          "border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] px-4 py-2.5 text-[hsl(var(--foreground))] shadow-[0_12px_28px_-24px_hsla(var(--shadow-strong),0.32)] hover:-translate-y-0.5 hover:border-[hsl(var(--accent-soft))] hover:bg-[hsl(var(--surface-highlight))] hover:text-[hsl(var(--accent-strong))]",
        ghost:
          "border-transparent bg-transparent px-3 py-2 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--surface-highlight))] hover:text-[hsl(var(--foreground))]",
      },
      size: {
        default: "h-11",
        sm: "h-9 px-3 text-xs",
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
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";

export { Button, buttonVariants };
