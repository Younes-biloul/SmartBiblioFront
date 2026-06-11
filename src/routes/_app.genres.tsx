import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import { useAuth } from "@/lib/smartbiblio/auth";
import { apiRequest, apiFetch } from "@/lib/smartbiblio/api";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

import { Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_app/genres")({
  head: () => ({
    meta: [{ title: "Genres — SmartBiblio" }],
  }),
  component: GenresPage,
});

interface Genre {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  color_hex?: string | null;
}

function GenresPage() {
  const { t } = useTranslation();
  const { hasRole } = useAuth();
  const qc = useQueryClient();

  const endpoint = "/api/v1/genres";
  const queryKey = ["genres"];

  const [open, setOpen] = useState(false);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [colorHex, setColorHex] = useState("#000000");

  const list = useQuery({
    queryKey,
    queryFn: () =>
      apiRequest<Genre[]>(endpoint, {
        query: { per_page: 100 },
      }),
  });

  const create = useMutation({
    mutationFn: () =>
      apiFetch(endpoint, {
        method: "POST",
        body: JSON.stringify({
          name,
          slug,
          description: description || null,
          color_hex: colorHex || null,
        }),
      }),
    onSuccess: () => {
      toast.success(t("common.created"));
      setName("");
      setSlug("");
      setDescription("");
      setColorHex("#000000");
      setOpen(false);
      qc.invalidateQueries({ queryKey });
    },
    onError: () => {
      toast.error(t("common.failed"));
    },
  });

  const del = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`${endpoint}/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      toast.success(t("common.deleted"));
      qc.invalidateQueries({ queryKey });
    },
    onError: () => {
      toast.error(t("common.failed"));
    },
  });

  return (
    <div>
      <PageHeader
        title={t("genres.title")}
        description={t("genres.description")}
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-1 h-4 w-4" />
                {t("common.add")}
              </Button>
            </DialogTrigger>

            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("genres.addGenre")}</DialogTitle>
              </DialogHeader>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  create.mutate();
                }}
                className="space-y-3"
              >
                {/* Name */}
                <div className="space-y-2">
                  <Label>{t("common.name")}</Label>
                  <Input
                    value={name}
                    onChange={(e) => {
                      const value = e.target.value;
                      setName(value);

                      // auto slug
                      setSlug(
                        value
                          .toLowerCase()
                          .trim()
                          .replace(/\s+/g, "-")
                      );
                    }}
                    required
                  />
                </div>

                {/* Slug */}
                <div className="space-y-2">
                  <Label>Slug</Label>
                  <Input
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label>{t("common.description")}</Label>
                  <Textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                {/* Color */}
                <div className="space-y-2">
                  <Label>Color</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="color"
                      value={colorHex}
                      onChange={(e) => setColorHex(e.target.value)}
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      value={colorHex}
                      onChange={(e) => setColorHex(e.target.value)}
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button type="submit" disabled={create.isPending}>
                    {create.isPending
                      ? t("common.saving")
                      : t("common.create")}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="overflow-hidden rounded-xl border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/30 text-left text-xs uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="px-4 py-3">{t("common.name")}</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">{t("common.description")}</th>
              <th className="px-4 py-3">Color</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>

          <tbody className="divide-y">
            {list.isLoading && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center">
                  {t("common.loading")}
                </td>
              </tr>
            )}

            {list.data?.data?.map((genre: Genre) => (
              <tr key={genre.id}>
                <td className="px-4 py-3 font-medium">{genre.name}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {genre.slug}
                </td>
                <td className="px-4 py-3 text-muted-foreground line-clamp-1">
                  {genre.description ?? "—"}
                </td>
                <td className="px-4 py-3">
                  <div
                    className="h-5 w-5 rounded border"
                    style={{
                      backgroundColor: genre.color_hex ?? "#ffffff",
                    }}
                  />
                </td>
                <td className="px-4 py-3 text-right">
                  {hasRole("admin") && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => del.mutate(genre.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </td>
              </tr>
            ))}

            {list.data && list.data.data.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-10 text-center text-muted-foreground"
                >
                  {t("crud.nothingHere")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}