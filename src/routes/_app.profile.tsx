import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/smartbiblio/api";
import type { Member } from "@/lib/smartbiblio/types";
import { PageHeader } from "@/components/page-header";
import { useAuth } from "@/lib/smartbiblio/auth";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_app/profile")({
  head: () => ({ meta: [{ title: "My profile — SmartBiblio" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = useAuth();
  const { t } = useTranslation();

  const { data, isLoading } = useQuery({
    queryKey: ["my-profile"],
    queryFn: () => apiFetch<any>("/api/v1/members/profile"),
  });

  // ✅ FIX: backend returns { user, stats }
  const me = data?.user ?? user;
  const stats = data?.stats;

  const downloadQr = async () => {
  if (!me?.qr_code) return;

  const url = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
    me.qr_code
  )}`;

  const response = await fetch(url);
  const blob = await response.blob();

  const blobUrl = window.URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = "my-qr-code.png";
  a.click();

  window.URL.revokeObjectURL(blobUrl);
};

  return (
    <div>
      <PageHeader
        title={t("profile.title")}
        description={t("profile.description")}
      />

      {!me || isLoading ? (
        <div className="text-muted-foreground">{t("common.loading")}</div>
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          {/* USER INFO */}
          <div className="rounded-xl border bg-card p-6 md:col-span-2">
            <div className="flex items-center gap-4">
              <div
                className="flex h-16 w-16 items-center justify-center rounded-full text-2xl font-bold text-primary-foreground"
                style={{ background: "var(--gradient-primary)" }}
              >
                {me.first_name?.[0]}
                {me.last_name?.[0]}
              </div>

              <div>
                <div className="text-xl font-semibold">
                  {me.first_name} {me.last_name}
                </div>
                <div className="text-sm text-muted-foreground">
                  {me.email}
                </div>
                <div className="mt-1 text-xs uppercase tracking-widest text-primary">
                  {me.role}
                </div>
              </div>
            </div>

            {/* STATUS */}
            <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">
                  {t("common.status")}
                </div>
                <div>
                  {me.is_active
                    ? t("common.active")
                    : t("common.inactive")}
                </div>
              </div>

              <div>
                <div className="text-muted-foreground">
                  {t("profile.suspension")}
                </div>
                <div>
                  {me.suspension_until
                    ? new Date(me.suspension_until).toLocaleDateString()
                    : "—"}
                </div>
              </div>
            </div>

            {/* 📊 STATS (NEW FIX) */}
            <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Total loans</div>
                <div className="text-lg font-semibold">
                  {stats?.total_loans ?? 0}
                </div>
              </div>

              <div>
                <div className="text-muted-foreground">Active loans</div>
                <div className="text-lg font-semibold">
                  {stats?.active_loans ?? 0}
                </div>
              </div>
            </div>
          </div>

          {/* QR CODE */}
          <div className="rounded-xl border bg-card p-6 text-center">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">
              {t("profile.libraryCard")}
            </div>

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

    <Button className="mt-4 w-full" onClick={downloadQr}>
  {t("profile.downloadQr")}
</Button>

            <div className="mt-3 break-all font-mono text-[11px] text-muted-foreground">
              {me.qr_code ?? "—"}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}