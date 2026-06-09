import type { ReactNode } from "react";

export function DataShell({ children }: { children: ReactNode }) {
  return <div className="rounded-xl border bg-card">{children}</div>;
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-base font-medium">{title}</div>
      {hint && <div className="mt-1 text-sm text-muted-foreground">{hint}</div>}
    </div>
  );
}