import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/smartbiblio/auth";
import { ApiError, getApiBase } from "@/lib/smartbiblio/api";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in — SmartBiblio" }] }),
  component: LoginPage,
});

function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!getApiBase()) {
      toast.error(t("auth.setApiFirst"));
      navigate({ to: "/settings" });
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
      navigate({ to: "/dashboard" });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t("auth.loginFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title={t("auth.welcomeBack")}
      subtitle={t("auth.signInSubtitle")}
      footer={
        <>
          {t("auth.newHere")} <Link to="/register" className="text-primary hover:underline">{t("auth.createAccountLink")}</Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">{t("common.email")}</Label>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">{t("auth.password")}</Label>
            <Link to="/forgot-password" className="text-xs text-muted-foreground hover:text-primary">
              {t("auth.forgot")}
            </Link>
          </div>
          <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? t("auth.signingIn") : t("auth.signIn")}
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          {t("auth.apiLabel")} <Link to="/settings" className="underline">{getApiBase() || t("auth.notConfigured")}</Link>
        </p>
      </form>
    </AuthShell>
  );
}