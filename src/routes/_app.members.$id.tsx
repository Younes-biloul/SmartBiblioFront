import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/smartbiblio/api";
import type { Loan, Member } from "@/lib/smartbiblio/types";
import { PageHeader } from "@/components/page-header";
import { ChevronLeft } from "lucide-react";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/_app/members/$id")({
  head: () => ({ meta: [{ title: "Member — SmartBiblio" }] }),
  component: MemberDetail,
});

function MemberDetail() {
  const { id } = Route.useParams();
  const { t } = useTranslation();
  const member = useQuery({ queryKey: ["member", id], queryFn: () => apiFetch<Member>(`/api/v1/members/${id}`) });
  const history = useQuery({ queryKey: ["member-history", id], queryFn: () => apiFetch<Loan[]>(`/api/v1/members/${id}/history`) });

  if (member.isLoading || !member.data) return <div className="text-muted-foreground">{t("common.loading")}</div>;

  return (
    <div>
      <Link to="/members" className="mb-4 inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="mr-1 h-4 w-4" /> {t("members.detail.back")}
      </Link>
      <PageHeader title={`${member.data.first_name} ${member.data.last_name}`} description={member.data.email} />
      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-xl border bg-card p-5">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">{t("members.detail.profile")}</div>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-muted-foreground">{t("common.role")}</dt><dd className="capitalize">{member.data.role}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">{t("common.status")}</dt><dd>{member.data.is_active ? t("common.active") : t("common.inactive")}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">{t("members.detail.qr")}</dt><dd className="font-mono text-xs">{member.data.qr_code ?? "—"}</dd></div>
          </dl>
        </div>
        <div className="md:col-span-2 rounded-xl border bg-card">
          <div className="border-b px-5 py-3 text-sm font-medium">{t("members.detail.loanHistory")}</div>
          <div className="divide-y">
            {(history.data ?? []).map((l) => (
              <div key={l.id} className="flex items-center justify-between px-5 py-3 text-sm">
                <div>
                  <div className="font-medium">{l.bookCopy?.book?.title ?? t("members.detail.bookFallback")}</div>
                  <div className="text-xs text-muted-foreground">{t("members.detail.due")} {l.due_date?.slice(0, 10)}</div>
                </div>
                <span className="rounded-full border px-2 py-0.5 text-xs capitalize text-muted-foreground">{l.status}</span>
              </div>
            ))}
            {history.data && history.data.length === 0 && (
              <div className="px-5 py-10 text-center text-sm text-muted-foreground">{t("members.detail.noHistory")}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}