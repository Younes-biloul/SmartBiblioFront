import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getApiBase, setApiBase } from "@/lib/smartbiblio/api";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/_app/settings")({
  head: () => ({ meta: [{ title: "Settings — SmartBiblio" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const { t } = useTranslation();
  const [base, setBase] = useState(getApiBase());

  const save = () => {
    setApiBase(base);
    toast.success(t("settings.savedReloading"));
    setTimeout(() => window.location.reload(), 500);
  };

  return (
    <div>
      <PageHeader title={t("settings.title")} description={t("settings.description")} />
      <div className="max-w-xl rounded-xl border bg-card p-6">
        <Label htmlFor="base">{t("settings.apiBase")}</Label>
        <Input
          id="base"
          className="mt-2 font-mono text-sm"
          placeholder={t("settings.apiPlaceholder")}
          value={base}
          onChange={(e) => setBase(e.target.value)}
        />
        <p className="mt-2 text-xs text-muted-foreground">
          {t("settings.endpointsHint")} <span className="font-mono">{base || "<base>"}/api/v1/…</span>
        </p>
        <div className="mt-4 flex gap-2">
          <Button onClick={save} disabled={!base}>{t("settings.saveReload")}</Button>
          <Button variant="ghost" onClick={() => { setBase(""); }}>{t("settings.clear")}</Button>
        </div>
      </div>
    </div>
  );
}