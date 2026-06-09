import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { apiRequest, apiFetch, ApiError } from "@/lib/smartbiblio/api";
import type { Book } from "@/lib/smartbiblio/types";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Search } from "lucide-react";
import { useAuth } from "@/lib/smartbiblio/auth";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/_app/books")({
  head: () => ({ meta: [{ title: "Catalog — SmartBiblio" }] }),
  component: BooksPage,
});

function BooksPage() {
  const { hasRole } = useAuth();
  const { t } = useTranslation();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["books", { q }],
    queryFn: () => apiRequest<Book[]>("/api/v1/books", { query: { q, per_page: 24 } }),
  });

  return (
    <div>
      <PageHeader
        title={t("books.title")}
        description={t("books.description")}
        actions={
          hasRole("librarian", "admin") && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button><Plus className="mr-1 h-4 w-4" /> {t("books.newBook")}</Button>
              </DialogTrigger>
              <NewBookDialog onCreated={() => { setOpen(false); qc.invalidateQueries({ queryKey: ["books"] }); }} />
            </Dialog>
          )
        }
      />

      <div className="mb-6 flex items-center gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder={t("books.searchPlaceholder")} value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-48 animate-pulse rounded-xl border bg-card" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {(data?.data ?? []).map((b) => (
            <Link
              key={b.id}
              to="/books/$id"
              params={{ id: b.id }}
              className="group rounded-xl border bg-card p-4 transition hover:border-primary/60"
            >
              <div className="aspect-[2/3] w-full overflow-hidden rounded-md bg-muted">
                {b.cover_url ? (
                  <img src={b.cover_url} alt={b.title} className="h-full w-full object-cover transition group-hover:scale-105" />
                ) : (
                  <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/15 to-accent/15 text-3xl font-bold text-primary/60">
                    {b.title?.[0]?.toUpperCase()}
                  </div>
                )}
              </div>
              <div className="mt-3 line-clamp-2 text-sm font-medium">{b.title}</div>
              <div className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                {b.authors?.map((a) => a.name).join(", ") || t("books.unknownAuthor")}
              </div>
              <div className="mt-2 flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground">{b.publication_year ?? ""}</span>
                <span className={"rounded-full px-2 py-0.5 " + ((b.available_copies ?? 0) > 0 ? "bg-primary/15 text-primary" : "bg-destructive/15 text-destructive")}>
                  {(b.available_copies ?? 0) > 0 ? t("books.available", { count: b.available_copies ?? 0 }) : t("books.unavailable")}
                </span>
              </div>
            </Link>
          ))}
          {data && data.data.length === 0 && (
            <div className="col-span-full rounded-xl border bg-card p-16 text-center text-muted-foreground">
              {t("books.noBooks")}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function NewBookDialog({ onCreated }: { onCreated: () => void }) {
  const { t } = useTranslation();
  const [form, setForm] = useState({ title: "", isbn: "", publication_year: "", description: "", cover_url: "", total_copies: "1" });
  const m = useMutation({
    mutationFn: () =>
      apiFetch<Book>("/api/v1/books", {
        method: "POST",
        body: JSON.stringify({
          title: form.title,
          isbn: form.isbn || null,
          publication_year: form.publication_year ? Number(form.publication_year) : null,
          description: form.description || null,
          cover_url: form.cover_url || null,
          total_copies: Number(form.total_copies) || 1,
        }),
      }),
    onSuccess: () => {
      toast.success(t("books.createdToast"));
      onCreated();
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : t("books.createFailed")),
  });

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{t("books.newBook")}</DialogTitle>
      </DialogHeader>
      <form onSubmit={(e) => { e.preventDefault(); m.mutate(); }} className="space-y-3">
        <div className="space-y-2">
          <Label>{t("books.bookTitle")}</Label>
          <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2"><Label>{t("books.isbn")}</Label><Input value={form.isbn} onChange={(e) => setForm({ ...form, isbn: e.target.value })} /></div>
          <div className="space-y-2"><Label>{t("books.year")}</Label><Input type="number" value={form.publication_year} onChange={(e) => setForm({ ...form, publication_year: e.target.value })} /></div>
        </div>
        <div className="space-y-2"><Label>{t("books.coverUrl")}</Label><Input value={form.cover_url} onChange={(e) => setForm({ ...form, cover_url: e.target.value })} /></div>
        <div className="space-y-2"><Label>{t("books.totalCopies")}</Label><Input type="number" min={1} value={form.total_copies} onChange={(e) => setForm({ ...form, total_copies: e.target.value })} /></div>
        <div className="space-y-2"><Label>{t("books.description_field")}</Label><Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        <DialogFooter>
          <Button type="submit" disabled={m.isPending}>{m.isPending ? t("common.saving") : t("common.create")}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}