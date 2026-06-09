import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/smartbiblio/api";
import type { Book, Loan, Member } from "@/lib/smartbiblio/types";
import { PageHeader } from "@/components/page-header";
import { Library, BookOpen, Users, AlertTriangle } from "lucide-react";
import { useAuth } from "@/lib/smartbiblio/auth";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — SmartBiblio" }] }),
  component: DashboardPage,
});

function Stat({ icon: Icon, label, value, hint }: { icon: typeof Library; label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="flex items-center justify-between">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="mt-2 text-3xl font-semibold tracking-tight">{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

function DashboardPage() {
  const { user, hasRole } = useAuth();
  const { t } = useTranslation();
  const books = useQuery({
    queryKey: ["books", { per_page: 1 }],
    queryFn: () => apiRequest<Book[]>("/api/v1/books", { query: { per_page: 1 } }),
  });
  const loans = useQuery({
    queryKey: ["loans", { per_page: 5 }],
    queryFn: () => apiRequest<Loan[]>("/api/v1/loans", { query: { per_page: 5 } }),
  });
  const members = useQuery({
    queryKey: ["members", { per_page: 1 }],
    queryFn: () => apiRequest<Member[]>("/api/v1/members", { query: { per_page: 1 } }),
    enabled: hasRole("librarian", "admin"),
  });

  const overdue = (loans.data?.data || []).filter((l) => l.status === "overdue").length;

  return (
    <div>
      <PageHeader
        title={t("dashboard.welcome", { name: user?.first_name ?? "" })}
        description={t("dashboard.description")}
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon={Library} label={t("dashboard.books")} value={books.data?.meta?.total ?? "—"} hint={t("dashboard.inCatalog")} />
        <Stat icon={BookOpen} label={t("dashboard.loans")} value={loans.data?.meta?.total ?? "—"} hint={t("dashboard.allTime")} />
        {hasRole("librarian", "admin") && (
          <Stat icon={Users} label={t("dashboard.members")} value={members.data?.meta?.total ?? "—"} hint={t("dashboard.registered")} />
        )}
        <Stat icon={AlertTriangle} label={t("dashboard.overdue")} value={overdue} hint={t("dashboard.inLatestLoans")} />
      </div>

      <div className="mt-8 rounded-xl border bg-card">
        <div className="border-b px-5 py-3 text-sm font-medium">{t("dashboard.recentLoans")}</div>
        <div className="divide-y">
          {(loans.data?.data ?? []).slice(0, 5).map((l) => (
            <div key={l.id} className="flex items-center justify-between px-5 py-3 text-sm">
              <div>
                <div className="font-medium">{l.bookCopy?.book?.title ?? t("dashboard.bookFallback")}</div>
                <div className="text-xs text-muted-foreground">
                  {l.user?.first_name} {l.user?.last_name} · {t("dashboard.due")} {l.due_date?.slice(0, 10)}
                </div>
              </div>
              <span className="rounded-full border px-2 py-0.5 text-xs capitalize text-muted-foreground">
                {l.status}
              </span>
            </div>
          ))}
          {loans.data && loans.data.data.length === 0 && (
            <div className="px-5 py-10 text-center text-sm text-muted-foreground">{t("dashboard.noLoans")}</div>
          )}
        </div>
      </div>
    </div>
  );
}