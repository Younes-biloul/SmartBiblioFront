import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest, apiFetch, ApiError } from "@/lib/smartbiblio/api";
import type { Loan } from "@/lib/smartbiblio/types";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/smartbiblio/auth";
import { toast } from "sonner";
import { RotateCw, Undo2 } from "lucide-react";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/_app/loans")({
  head: () => ({ meta: [{ title: "Loans — SmartBiblio" }] }),
  component: LoansPage,
});

function StatusBadge({ s }: { s: string }) {
  const cls =
    s === "active" ? "bg-primary/15 text-primary" :
    s === "returned" ? "bg-muted text-muted-foreground" :
    s === "overdue" ? "bg-destructive/15 text-destructive" :
    "bg-muted text-muted-foreground";
  return <span className={`rounded-full px-2 py-0.5 text-xs capitalize ${cls}`}>{s}</span>;
}

function LoansPage() {
  const { hasRole } = useAuth();
  const { t } = useTranslation();
  const [status, setStatus] = useState<string>("all");
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["loans", { status }],
    queryFn: () => apiRequest<Loan[]>("/api/v1/loans", { query: { status: status === "all" ? undefined : status, per_page: 50 } }),
  });
  useEffect(() => {
  console.log("Loans data:", data);
}, [data]);
  const ret = useMutation({
    mutationFn: (id: string) => apiFetch(`/api/v1/loans/${id}/return`, { method: "POST" }),
    onSuccess: () => { toast.success(t("loans.returned")); qc.invalidateQueries({ queryKey: ["loans"] }); },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : t("common.failed")),
  });
  const renew = useMutation({
    mutationFn: (id: string) => apiFetch(`/api/v1/loans/${id}/renew`, { method: "POST" }),
    onSuccess: () => { toast.success(t("loans.renewed")); qc.invalidateQueries({ queryKey: ["loans"] }); },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : t("common.failed")),
  });

  return (
    <div>
      <PageHeader title={t("loans.title")} description={t("loans.description")} />
      <div className="mb-4 flex items-center gap-2">
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("loans.status.all")}</SelectItem>
            <SelectItem value="active">{t("loans.status.active")}</SelectItem>
            <SelectItem value="returned">{t("loans.status.returned")}</SelectItem>
            <SelectItem value="overdue">{t("loans.status.overdue")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/30 text-left text-xs uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="px-4 py-3">{t("loans.book")}</th>
              <th className="px-4 py-3">{t("loans.member")}</th>
              <th className="px-4 py-3">{t("loans.loaned")}</th>
              <th className="px-4 py-3">{t("loans.due")}</th>
              <th className="px-4 py-3">{t("common.status")}</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">{t("common.loading")}</td></tr>
            )}
            {data?.data?.map((l) => (
              <tr key={l.id}>
                <td className="px-4 py-3 font-medium">{l.book_copy?.book?.title ?? "—"}</td>
                <td className="px-4 py-3">{l.user ? `${l.user.first_name} ${l.user.last_name}` : "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">{l.loan_date?.slice(0, 10)}</td>
                <td className="px-4 py-3 text-muted-foreground">{l.due_date?.slice(0, 10)}</td>
                <td className="px-4 py-3"><StatusBadge s={l.status} /></td>
                <td className="px-4 py-3 text-right">
                  {l.status === "active" && (
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="ghost" onClick={() => renew.mutate(l.id)} disabled={renew.isPending}>
                        <RotateCw className="h-3 w-3" />
                      </Button>
                      {hasRole("librarian", "admin") && (
                        <Button size="sm" variant="ghost" onClick={() => ret.mutate(l.id)} disabled={ret.isPending}>
                          <Undo2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {data && data.data.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">{t("loans.noLoans")}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}