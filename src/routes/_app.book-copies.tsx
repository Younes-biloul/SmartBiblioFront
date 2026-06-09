import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { apiRequest, apiFetch, ApiError } from "@/lib/smartbiblio/api";
import type { BookCopy, Book } from "@/lib/smartbiblio/types";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/smartbiblio/auth";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/_app/book-copies")({
  head: () => ({ meta: [{ title: "Book copies — SmartBiblio" }] }),
  component: BookCopiesPage,
});

function BookCopiesPage() {
  const { hasRole } = useAuth();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const list = useQuery({
    queryKey: ["book-copies"],
    queryFn: () => apiRequest<(BookCopy & { book?: Book })[]>("/api/v1/book-copies", { query: { per_page: 100 } }),
  });
  const books = useQuery({
    queryKey: ["books-all"],
    queryFn: () => apiRequest<Book[]>("/api/v1/books", { query: { per_page: 200 } }),
  });

  const del = useMutation({
    mutationFn: (id: string) => apiFetch(`/api/v1/book-copies/${id}`, { method: "DELETE" }),
    onSuccess: () => { toast.success(t("common.deleted")); qc.invalidateQueries({ queryKey: ["book-copies"] }); },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : t("common.failed")),
  });

  const [form, setForm] = useState({ book_id: "", barcode: "", condition: "good", status: "available" });
  const create = useMutation({
    mutationFn: () => apiFetch("/api/v1/book-copies", { method: "POST", body: JSON.stringify(form) }),
    onSuccess: () => { toast.success(t("bookCopies.copyCreated")); setOpen(false); qc.invalidateQueries({ queryKey: ["book-copies"] }); },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : t("common.failed")),
  });

  return (
    <div>
      <PageHeader
        title={t("bookCopies.title")}
        description={t("bookCopies.description")}
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="mr-1 h-4 w-4" /> {t("bookCopies.newCopy")}</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{t("bookCopies.newCopyTitle")}</DialogTitle></DialogHeader>
              <form onSubmit={(e) => { e.preventDefault(); create.mutate(); }} className="space-y-3">
                <div className="space-y-2">
                  <Label>{t("bookCopies.book")}</Label>
                  <Select value={form.book_id} onValueChange={(v) => setForm({ ...form, book_id: v })}>
                    <SelectTrigger><SelectValue placeholder={t("bookCopies.chooseBook")} /></SelectTrigger>
                    <SelectContent>
                      {(books.data?.data ?? []).map((b) => <SelectItem key={b.id} value={b.id}>{b.title}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>{t("bookCopies.barcode")}</Label><Input value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2"><Label>{t("bookCopies.condition")}</Label>
                    <Select value={form.condition} onValueChange={(v) => setForm({ ...form, condition: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">{t("bookCopies.cond.new")}</SelectItem>
                        <SelectItem value="good">{t("bookCopies.cond.good")}</SelectItem>
                        <SelectItem value="worn">{t("bookCopies.cond.worn")}</SelectItem>
                        <SelectItem value="damaged">{t("bookCopies.cond.damaged")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>{t("common.status")}</Label>
                    <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="available">{t("bookCopies.stat.available")}</SelectItem>
                        <SelectItem value="loaned">{t("bookCopies.stat.loaned")}</SelectItem>
                        <SelectItem value="lost">{t("bookCopies.stat.lost")}</SelectItem>
                        <SelectItem value="retired">{t("bookCopies.stat.retired")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter><Button type="submit" disabled={create.isPending || !form.book_id}>{create.isPending ? t("common.saving") : t("common.create")}</Button></DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />
      <div className="overflow-hidden rounded-xl border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/30 text-left text-xs uppercase tracking-widest text-muted-foreground">
            <tr><th className="px-4 py-3">{t("bookCopies.book")}</th><th className="px-4 py-3">{t("bookCopies.code")}</th><th className="px-4 py-3">{t("bookCopies.condition")}</th><th className="px-4 py-3"></th></tr>
          </thead>
          <tbody className="divide-y">
            {list.isLoading && <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">{t("common.loading")}</td></tr>}
            {list.data?.data?.map((c) => (
              <tr key={c.id}>
                <td className="px-4 py-3 font-medium">{c.book?.title ?? "—"}</td>
                <td className="px-4 py-3 font-mono text-xs">{c.barcode ?? c.qr_code ?? c.id.slice(0, 8)}</td>
                <td className="px-4 py-3 capitalize text-muted-foreground">{c.condition ?? "—"}</td>
                {/* <td className="px-4 py-3 capitalize">{c.status ?? "—"}</td> */}
                <td className="px-4 py-3 text-right">
                  {hasRole("admin") && (
                    <Button size="sm" variant="ghost" onClick={() => del.mutate(c.id)}><Trash2 className="h-3 w-3" /></Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
