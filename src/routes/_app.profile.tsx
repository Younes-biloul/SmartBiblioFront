import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/smartbiblio/api";
import type { Member } from "@/lib/smartbiblio/types";
import { PageHeader } from "@/components/page-header";
import { useAuth } from "@/lib/smartbiblio/auth";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/_app/profile")({
  head: () => ({ meta: [{ title: "My profile — SmartBiblio" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { data } = useQuery({
    queryKey: ["my-profile"],
    queryFn: () => apiFetch<Member>("/api/v1/members/profile"),
  });
  const me = data ?? (user as unknown as Member | null);

  return (
    <div>
      <PageHeader title={t("profile.title")} description={t("profile.description")} />
      {!me ? (
        <div className="text-muted-foreground">{t("common.loading")}</div>
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-xl border bg-card p-6 md:col-span-2">
            <div className="flex items-center gap-4">
              <div
                className="flex h-16 w-16 items-center justify-center rounded-full text-2xl font-bold text-primary-foreground"
                style={{ background: "var(--gradient-primary)" }}
              >
                {me.first_name?.[0]}{me.last_name?.[0]}
              </div>
              <div>
                <div className="text-xl font-semibold">{me.first_name} {me.last_name}</div>
                <div className="text-sm text-muted-foreground">{me.email}</div>
                <div className="mt-1 text-xs uppercase tracking-widest text-primary">{me.role}</div>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
              <div><div className="text-muted-foreground">{t("common.status")}</div><div>{me.is_active ? t("common.active") : t("common.inactive")}</div></div>
              <div><div className="text-muted-foreground">{t("profile.suspension")}</div><div>{me.suspension_until ? new Date(me.suspension_until).toLocaleDateString() : "—"}</div></div>
            </div>
          </div>
          <div className="rounded-xl border bg-card p-6 text-center">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">{t("profile.libraryCard")}</div>
            <div className="mt-4 inline-flex items-center justify-center rounded-lg bg-white p-3">
              {me.qr_code ? (
                <img
                  alt={t("profile.qrAlt")}
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(me.qr_code)}`}
                  className="h-40 w-40"
                />
              ) : (
                <div className="h-40 w-40 bg-muted" />
              )}
            </div>
            <div className="mt-3 break-all font-mono text-[11px] text-muted-foreground">{me.qr_code ?? "—"}</div>
          </div>
        </div>
      )}
    </div>
  );
}