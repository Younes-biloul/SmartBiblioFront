import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch, ApiError } from "@/lib/smartbiblio/api";
import type { Book } from "@/lib/smartbiblio/types";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { ChevronLeft, Trash2 } from "lucide-react";
import { useAuth } from "@/lib/smartbiblio/auth";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/_app/books/$id")({
  head: () => ({ meta: [{ title: "Book — SmartBiblio" }] }),
  component: BookDetail,
});

function BookDetail() {
  const { id } = Route.useParams();
  const { hasRole } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { t } = useTranslation();

  const { data: book, isLoading } = useQuery({
    queryKey: ["book", id],
    queryFn: () => apiFetch<Book>(`/api/v1/books/${id}`),
  });

  const del = useMutation({
    mutationFn: () => apiFetch(`/api/v1/books/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success(t("books.detail.deleted"));
      qc.invalidateQueries({ queryKey: ["books"] });
      navigate({ to: "/books" });
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : t("books.detail.deleteFailed")),
  });

  if (isLoading || !book) return <div className="text-muted-foreground">{t("common.loading")}</div>;

  return (
    <div>
      <Link to="/books" className="mb-4 inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="mr-1 h-4 w-4" /> {t("books.detail.back")}
      </Link>
      <PageHeader
        title={book.title}
        description={book.authors?.map((a) => a.name).join(", ")}
        actions={
          hasRole("admin") && (
            <Button variant="destructive" onClick={() => del.mutate()} disabled={del.isPending}>
              <Trash2 className="mr-1 h-4 w-4" /> {t("common.delete")}
            </Button>
          )
        }
      />
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-1">
          <div className="aspect-[2/3] overflow-hidden rounded-xl border bg-muted">
            {book.cover_url ? (
              <img src={book.cover_url} alt={book.title} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20 text-6xl font-bold text-primary/60">
                {book.title[0]}
              </div>
            )}
          </div>
        </div>
        <div className="md:col-span-2 space-y-6">
          <div className="rounded-xl border bg-card p-5">
            <h3 className="text-sm font-medium uppercase tracking-widest text-muted-foreground">{t("books.detail.details")}</h3>
            <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div><dt className="text-muted-foreground">{t("books.isbn")}</dt><dd>{book.isbn ?? "—"}</dd></div>
              <div><dt className="text-muted-foreground">{t("books.year")}</dt><dd>{book.publication_year ?? "—"}</dd></div>
              <div><dt className="text-muted-foreground">{t("books.totalCopies")}</dt><dd>{book.total_copies ?? "—"}</dd></div>
              <div><dt className="text-muted-foreground">{t("books.detail.available")}</dt><dd>{book.available_copies ?? "—"}</dd></div>
              <div className="col-span-2"><dt className="text-muted-foreground">{t("books.detail.genres")}</dt>
                <dd className="flex flex-wrap gap-1">
                  {(book.genres ?? []).map((g) => (
                    <span key={g.id} className="rounded-full border px-2 py-0.5 text-xs">{g.name}</span>
                  ))}
                  {(!book.genres || book.genres.length === 0) && "—"}
                </dd>
              </div>
            </dl>
          </div>
          {book.description && (
            <div className="rounded-xl border bg-card p-5">
              <h3 className="text-sm font-medium uppercase tracking-widest text-muted-foreground">{t("books.detail.descriptionLbl")}</h3>
              <p className="mt-2 text-sm leading-relaxed">{book.description}</p>
            </div>
          )}
          {(book.copies?.length ?? 0) > 0 && (
            <div className="rounded-xl border bg-card p-5">
              <h3 className="text-sm font-medium uppercase tracking-widest text-muted-foreground">{t("books.detail.copies")}</h3>
              <ul className="mt-2 divide-y text-sm">
                {book.copies!.map((c) => (
                  <li key={c.id} className="flex items-center justify-between py-2">
                    <span className="font-mono text-xs">{c.barcode ?? c.qr_code ?? c.id.slice(0, 8)}</span>
                    <span className="text-xs text-muted-foreground capitalize">{c.status ?? "—"}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}