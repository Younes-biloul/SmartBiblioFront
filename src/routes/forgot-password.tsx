import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch, ApiError } from "@/lib/smartbiblio/api";
import { toast } from "sonner";
import { useTranslation, Trans } from "react-i18next";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "Forgot password — SmartBiblio" }] }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiFetch("/api/v1/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) });
      setSent(true);
      toast.success(t("auth.resetSentToast"));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t("auth.sendFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title={t("auth.forgotTitle")}
      subtitle={t("auth.forgotSubtitle")}
      footer={<><Link to="/login" className="text-primary hover:underline">{t("auth.backToSignIn")}</Link></>}
    >
      {sent ? (
        <div className="rounded-md border border-primary/20 bg-primary/10 p-4 text-sm">
          <Trans i18nKey="auth.resetSentBody" values={{ email }} components={{ b: <b /> }} />
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">{t("common.email")}</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? t("auth.sending") : t("auth.sendResetLink")}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}