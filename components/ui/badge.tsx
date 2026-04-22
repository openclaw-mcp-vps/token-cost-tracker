import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-orange-500/20 text-orange-200",
        secondary: "border-slate-700 bg-slate-700/30 text-slate-300",
        success: "border-emerald-700/60 bg-emerald-900/20 text-emerald-200",
        warning: "border-orange-700/60 bg-orange-900/20 text-orange-200",
        danger: "border-red-700/60 bg-red-900/20 text-red-200",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps): React.JSX.Element {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
