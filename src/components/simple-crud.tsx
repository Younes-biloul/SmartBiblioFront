import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { apiRequest, apiFetch, ApiError } from "@/lib/smartbiblio/api";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/smartbiblio/auth";
import { useTranslation } from "react-i18next";

interface SimpleEntity { id: string; name: string; description?: string | null; bio?: string | null }

export function SimpleCrud({
  title,
  description,
  endpoint,
  longField = "description",
}: {
  title: string;
  description: string;
  endpoint: string;
  longField?: "description" | "bio";
}) {
  const { hasRole } = useAuth();
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [extra, setExtra] = useState("");
  const key = [endpoint];

  const list = useQuery({
    queryKey: key,
    queryFn: () => apiRequest<SimpleEntity[]>(endpoint, { query: { per_page: 100 } }),
  });
  const create = useMutation({
    mutationFn: () => apiFetch(endpoint, { method: "POST", body: JSON.stringify({ name, [longField]: extra || null }) }),
    onSuccess: () => { toast.success(t("common.created")); setName(""); setExtra(""); setOpen(false); qc.invalidateQueries({ queryKey: key }); },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : t("common.failed")),
  });
  const del = useMutation({
    mutationFn: (id: string) => apiFetch(`${endpoint}/${id}`, { method: "DELETE" }),
    onSuccess: () => { toast.success(t("common.deleted")); qc.invalidateQueries({ queryKey: key }); },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : t("common.failed")),
  });

  return (
    <div>
      <PageHeader
        title={title}
        description={description}
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="mr-1 h-4 w-4" /> {t("common.add")}</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{t("crud.addItem", { name: title.toLowerCase().slice(0, -1) })}</DialogTitle></DialogHeader>
              <form onSubmit={(e) => { e.preventDefault(); create.mutate(); }} className="space-y-3">
                <div className="space-y-2"><Label>{t("common.name")}</Label><Input value={name} onChange={(e) => setName(e.target.value)} required /></div>
                <div className="space-y-2"><Label className="capitalize">{t(longField === "biography" ? "common.bio" : "common.description")}</Label><Textarea rows={3} value={extra} onChange={(e) => setExtra(e.target.value)} /></div>
                <DialogFooter><Button type="submit" disabled={create.isPending}>{create.isPending ? t("common.saving") : t("common.create")}</Button></DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />
      <div className="overflow-hidden rounded-xl border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/30 text-left text-xs uppercase tracking-widest text-muted-foreground">
            <tr><th className="px-4 py-3">{t("common.name")}</th><th className="px-4 py-3 capitalize">{t(longField === "biography" ? "common.bio" : "common.description")}</th><th className="px-4 py-3"></th></tr>
          </thead>
          <tbody className="divide-y">
            {list.isLoading && <tr><td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">{t("common.loading")}</td></tr>}
            {list.data?.data?.map((row) => (
              <tr key={row.id}>
                <td className="px-4 py-3 font-medium">{row.name??row.first_name + " " + row.last_name}</td>
                <td className="px-4 py-3 text-muted-foreground line-clamp-1">{(row[longField] as string | null | undefined) ?? "—"}</td>
                <td className="px-4 py-3 text-right">
                  {hasRole("admin") && (
                    <Button size="sm" variant="ghost" onClick={() => del.mutate(row.id)}><Trash2 className="h-3 w-3" /></Button>
                  )}
                </td>
              </tr>
            ))}
            {list.data && list.data.data.length === 0 && (
              <tr><td colSpan={3} className="px-4 py-10 text-center text-muted-foreground">{t("crud.nothingHere")}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}