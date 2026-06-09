import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, apiFetch } from "@/lib/smartbiblio/api";
import type { Notification } from "@/lib/smartbiblio/types";
import { PageHeader } from "@/components/page-header";
import { Bell, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/_app/notifications")({
  head: () => ({ meta: [{ title: "Notifications — SmartBiblio" }] }),
  component: NotificationsPage,
});

function NotificationsPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => apiRequest<Notification[]>("/api/v1/notifications", { query: { per_page: 50 } }),
  });
  const markRead = useMutation({
    mutationFn: (id: string) => apiFetch(`/api/v1/notifications/${id}/read`, { method: "PATCH" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  return (
    <div>
      <PageHeader title={t("notifications.title")} description={t("notifications.description")} />
      <div className="overflow-hidden rounded-xl border bg-card">
        {isLoading && <div className="px-5 py-8 text-center text-muted-foreground">{t("common.loading")}</div>}
        <div className="divide-y">
          {data?.data?.map((n) => (
            <div key={n.id} className={`flex items-start justify-between gap-3 px-5 py-4 ${n.read_at ? "opacity-60" : ""}`}>
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-primary">
                  <Bell className="h-4 w-4" />
                </div>
                <div>
                  {n.title && <div className="text-sm font-medium">{n.title}</div>}
                  <div className="text-sm text-muted-foreground">{n.message}</div>
                  <div className="mt-1 text-[11px] text-muted-foreground">{new Date(n.created_at).toLocaleString()}</div>
                </div>
              </div>
              {!n.read_at && (
                <Button size="sm" variant="ghost" onClick={() => markRead.mutate(n.id)}>
                  <CheckCheck className="mr-1 h-3 w-3" /> {t("notifications.markRead")}
                </Button>
              )}
            </div>
          ))}
          {data && data.data.length === 0 && (
            <div className="px-5 py-16 text-center text-sm text-muted-foreground">{t("notifications.caughtUp")}</div>
          )}
        </div>
      </div>
    </div>
  );
}