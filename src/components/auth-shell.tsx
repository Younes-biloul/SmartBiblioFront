import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Library } from "lucide-react";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useTranslation } from "react-i18next";

export function AuthShell({ title, subtitle, children, footer }: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const { t } = useTranslation();
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="absolute right-4 top-4 z-20">
        <LanguageSwitcher />
      </div>
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "radial-gradient(60% 40% at 20% 10%, oklch(0.72 0.16 195 / 0.25), transparent 60%), radial-gradient(50% 40% at 90% 90%, oklch(0.65 0.22 305 / 0.2), transparent 60%)",
        }}
      />
      <div className="relative z-10 w-full max-w-md">
        <Link to="/" className="mb-8 flex items-center justify-center gap-2">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-md"
            style={{ background: "var(--gradient-primary)" }}
          >
            <Library className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-semibold tracking-tight">{t("common.appName")}</span>
        </Link>
        <div className="rounded-xl border bg-card p-6 shadow-2xl" style={{ boxShadow: "var(--shadow-glow)" }}>
          <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </div>
        {footer && <div className="mt-4 text-center text-sm text-muted-foreground">{footer}</div>}
      </div>
    </div>
  );
}