import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiFetch, ApiError } from "@/lib/smartbiblio/api";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ScanLine, User } from "lucide-react";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/_app/scan")({
  head: () => ({ meta: [{ title: "Scan — SmartBiblio" }] }),
  component: ScanPage,
});

interface ScannedMember {
  user: { id: string; email: string; first_name: string; last_name: string; is_active: boolean };
  quota: { max: number; active: number; remaining: number };
}

function ScanPage() {
  const { t } = useTranslation();
  const [memberQr, setMemberQr] = useState("");
  const [bookQr, setBookQr] = useState("");
  const [member, setMember] = useState<ScannedMember | null>(null);

  const scanMember = useMutation({
    mutationFn: () => apiFetch<ScannedMember>("/api/v1/loans/scan/member", { method: "POST", body: JSON.stringify({ member_qr: memberQr }) }),
    onSuccess: (data) => { setMember(data); toast.success(t("scan.memberFound")); },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : t("scan.memberNotFound")),
  });

  const scanBook = useMutation({
    mutationFn: () => apiFetch("/api/v1/loans/scan/book", {
      method: "POST",
      body: JSON.stringify({ user_id: member!.user.id, book_copy_qr: bookQr }),
    }),
    onSuccess: () => { toast.success(t("scan.loanCreated")); setBookQr(""); scanMember.mutate(); },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : t("scan.scanFailed")),
  });

  return (
    <div>
      <PageHeader title={t("scan.title")} description={t("scan.description")} />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border bg-card p-5">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium"><User className="h-4 w-4 text-primary" /> {t("scan.step1")}</div>
          <form onSubmit={(e) => { e.preventDefault(); scanMember.mutate(); }} className="flex gap-2">
            <Input placeholder={t("scan.memberQrPlaceholder")} value={memberQr} onChange={(e) => setMemberQr(e.target.value)} required />
            <Button type="submit" disabled={scanMember.isPending}>{t("scan.find")}</Button>
          </form>
          {member && (
            <div className="mt-4 rounded-md border bg-muted/30 p-4 text-sm">
              <div className="font-medium">{member.user.first_name} {member.user.last_name}</div>
              <div className="text-muted-foreground">{member.user.email}</div>
              <div className="mt-2 text-xs">
                {t("scan.loansLine", { active: member.quota.active, max: member.quota.max, remaining: member.quota.remaining })}
              </div>
            </div>
          )}
        </div>

        <div className="rounded-xl border bg-card p-5">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium"><ScanLine className="h-4 w-4 text-primary" /> {t("scan.step2")}</div>
          <form onSubmit={(e) => { e.preventDefault(); scanBook.mutate(); }} className="flex gap-2">
            <Input placeholder={t("scan.bookQrPlaceholder")} value={bookQr} onChange={(e) => setBookQr(e.target.value)} required disabled={!member} />
            <Button type="submit" disabled={!member || scanBook.isPending}>{t("scan.loanBtn")}</Button>
          </form>
          {!member && <p className="mt-3 text-xs text-muted-foreground">{t("scan.scanMemberFirst")}</p>}
        </div>
      </div>
    </div>
  );
}