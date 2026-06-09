import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { apiRequest, apiFetch, ApiError } from "@/lib/smartbiblio/api";
import type { Member } from "@/lib/smartbiblio/types";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Power, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/smartbiblio/auth";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/_app/members")({
  head: () => ({ meta: [{ title: "Members — SmartBiblio" }] }),
  component: MembersPage,
});

function MembersPage() {
  const { hasRole } = useAuth();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["members"],
    queryFn: () => apiRequest<Member[]>("/api/v1/members", { query: { per_page: 50 } }),
  });

  const toggle = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      apiFetch(`/api/v1/members/${id}/status`, { method: "PATCH", body: JSON.stringify({ is_active }) }),
    onSuccess: () => { toast.success(t("members.statusUpdated")); qc.invalidateQueries({ queryKey: ["members"] }); },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : t("common.failed")),
  });
  const del = useMutation({
    mutationFn: (id: string) => apiFetch(`/api/v1/members/${id}`, { method: "DELETE" }),
    onSuccess: () => { toast.success(t("members.deleted")); qc.invalidateQueries({ queryKey: ["members"] }); },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : t("common.failed")),
  });

  return (
    <div>
      <PageHeader
        title={t("members.title")}
        description={t("members.description")}
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-1 h-4 w-4" /> {t("members.newMember")}</Button>
            </DialogTrigger>
            <NewMemberDialog onCreated={() => { setOpen(false); qc.invalidateQueries({ queryKey: ["members"] }); }} />
          </Dialog>
        }
      />
      <div className="overflow-hidden rounded-xl border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/30 text-left text-xs uppercase tracking-widest text-muted-foreground">
            <tr><th className="px-4 py-3">{t("common.name")}</th><th className="px-4 py-3">{t("common.email")}</th><th className="px-4 py-3">{t("common.role")}</th><th className="px-4 py-3">{t("common.status")}</th><th className="px-4 py-3"></th></tr>
          </thead>
          <tbody className="divide-y">
            {isLoading && <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">{t("common.loading")}</td></tr>}
            {data?.data?.map((m) => (
              <tr key={m.id}>
                <td className="px-4 py-3 font-medium">
                  <Link to="/members/$id" params={{ id: m.id }} className="hover:text-primary">
                    {m.first_name} {m.last_name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{m.email}</td>
                <td className="px-4 py-3 text-xs uppercase tracking-widest">{m.role}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs ${m.is_active ? "bg-primary/15 text-primary" : "bg-destructive/15 text-destructive"}`}>
                    {m.is_active ? t("common.active") : t("common.inactive")}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-1">
                    <Button size="sm" variant="ghost" onClick={() => toggle.mutate({ id: m.id, is_active: !m.is_active })} title={t("members.toggleStatus")}>
                      <Power className="h-3 w-3" />
                    </Button>
                    {hasRole("admin") && (
                      <Button size="sm" variant="ghost" onClick={() => del.mutate(m.id)} title={t("common.delete")}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function NewMemberDialog({ onCreated }: { onCreated: () => void }) {
  const { t } = useTranslation();
  const [form, setForm] = useState({ first_name: "", last_name: "", email: "", password: "", role: "reader" });
  const m = useMutation({
    mutationFn: () => apiFetch("/api/v1/members", {
      method: "POST",
      body: JSON.stringify({ ...form, password_confirmation: form.password }),
    }),
    onSuccess: () => { toast.success(t("members.created")); onCreated(); },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : t("common.failed")),
  });
  return (
    <DialogContent>
      <DialogHeader><DialogTitle>{t("members.newMember")}</DialogTitle></DialogHeader>
      <form onSubmit={(e) => { e.preventDefault(); m.mutate(); }} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2"><Label>{t("auth.firstName")}</Label><Input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} required /></div>
          <div className="space-y-2"><Label>{t("auth.lastName")}</Label><Input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} required /></div>
        </div>
        <div className="space-y-2"><Label>{t("common.email")}</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></div>
        <div className="space-y-2"><Label>{t("members.tempPassword")}</Label><Input type="text" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={8} /></div>
        <div className="space-y-2">
          <Label>{t("common.role")}</Label>
          <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="reader">{t("members.roles.reader")}</SelectItem>
              <SelectItem value="librarian">{t("members.roles.librarian")}</SelectItem>
              <SelectItem value="admin">{t("members.roles.admin")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <DialogFooter><Button type="submit" disabled={m.isPending}>{m.isPending ? t("common.saving") : t("common.create")}</Button></DialogFooter>
      </form>
    </DialogContent>
  );
}