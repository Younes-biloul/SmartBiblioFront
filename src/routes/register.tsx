import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/smartbiblio/auth";
import { ApiError } from "@/lib/smartbiblio/api";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "Register — SmartBiblio" }] }),
  component: RegisterPage,
});

function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [form, setForm] = useState({ first_name: "", last_name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(form);
      toast.success(t("auth.welcomeMsg"));
      navigate({ to: "/dashboard" });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t("auth.registrationFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title={t("auth.createAccount")}
      subtitle={t("auth.createAccountSubtitle")}
      footer={<>{t("auth.alreadyHave")} <Link to="/login" className="text-primary hover:underline">{t("auth.signIn")}</Link></>}
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="fn">{t("auth.firstName")}</Label>
            <Input id="fn" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ln">{t("auth.lastName")}</Label>
            <Input id="ln" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} required />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">{t("common.email")}</Label>
          <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">{t("auth.password")}</Label>
          <Input id="password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={8} />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? t("auth.creating") : t("auth.createAccountBtn")}
        </Button>
      </form>
    </AuthShell>
  );
}