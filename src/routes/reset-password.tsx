import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch, ApiError } from "@/lib/smartbiblio/api";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Reset password — SmartBiblio" }] }),
  component: ResetPasswordPage,
  validateSearch: (s: Record<string, unknown>) => ({
    token: typeof s.token === "string" ? s.token : "",
    email: typeof s.email === "string" ? s.email : "",
  }),
});

function ResetPasswordPage() {
  const { token, email: initialEmail } = Route.useSearch();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) return toast.error(t("auth.passwordsMismatch"));
    setLoading(true);
    try {
      await apiFetch("/api/v1/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, email, password, password_confirmation: confirm }),
      });
      toast.success(t("auth.passwordUpdated"));
      navigate({ to: "/login" });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t("auth.resetFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title={t("auth.resetTitle")}
      footer={<Link to="/login" className="text-primary hover:underline">{t("auth.backToSignIn")}</Link>}
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">{t("common.email")}</Label>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="p">{t("auth.newPassword")}</Label>
          <Input id="p" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="c">{t("auth.confirmPassword")}</Label>
          <Input id="c" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? t("auth.updating") : t("auth.resetPassword")}
        </Button>
      </form>
    </AuthShell>
  );
}