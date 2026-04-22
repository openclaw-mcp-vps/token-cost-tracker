import * as React from "react";

import { cn } from "@/lib/utils";

function Table({ className, ...props }: React.ComponentProps<"table">): React.JSX.Element {
  return (
    <div className="relative w-full overflow-auto">
      <table className={cn("w-full caption-bottom text-sm", className)} {...props} />
    </div>
  );
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">): React.JSX.Element {
  return <thead className={cn("[&_tr]:border-b [&_tr]:border-slate-800", className)} {...props} />;
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">): React.JSX.Element {
  return <tbody className={cn("[&_tr:last-child]:border-0", className)} {...props} />;
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">): React.JSX.Element {
  return (
    <tr
      className={cn(
        "border-b border-slate-800/60 transition-colors hover:bg-[#121c2a] data-[state=selected]:bg-slate-900",
        className,
      )}
      {...props}
    />
  );
}

function TableHead({ className, ...props }: React.ComponentProps<"th">): React.JSX.Element {
  return (
    <th
      className={cn("h-12 px-4 text-left align-middle font-medium text-slate-400 [&:has([role=checkbox])]:pr-0", className)}
      {...props}
    />
  );
}

function TableCell({ className, ...props }: React.ComponentProps<"td">): React.JSX.Element {
  return <td className={cn("p-4 align-middle text-slate-200 [&:has([role=checkbox])]:pr-0", className)} {...props} />;
}

function TableCaption({ className, ...props }: React.ComponentProps<"caption">): React.JSX.Element {
  return <caption className={cn("mt-4 text-sm text-slate-400", className)} {...props} />;
}

export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableCaption };
