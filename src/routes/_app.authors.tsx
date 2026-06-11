import { createFileRoute } from '@tanstack/react-router'
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/lib/smartbiblio/auth";
import { apiRequest, apiFetch } from "@/lib/smartbiblio/api";

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
import { toast } from "sonner";
export const Route = createFileRoute("/_app/authors")({
  component: AuthorsPage,
});

interface Author {
  id: string;
  first_name: string;
  last_name: string;
  biography?: string | null;
  nationality?: string | null;
}

function AuthorsPage() {
  const { t } = useTranslation();
  const { hasRole } = useAuth();
  const qc = useQueryClient();

  const [open, setOpen] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [biography, setBiography] = useState("");
  const [nationality, setNationality] = useState("");

  const endpoint = "/api/v1/authors";
  const key = ["authors"];

  const list = useQuery({
    queryKey: key,
    queryFn: () =>
      apiRequest<Author[]>(endpoint, {
        query: { per_page: 100 },
      }),
  });

  const create = useMutation({
    mutationFn: () =>
      apiFetch(endpoint, {
        method: "POST",
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          biography: biography || null,
          nationality: nationality || null,
        }),
      }),
    onSuccess: () => {
      toast.success(t("common.created"));
      setFirstName("");
      setLastName("");
      setBiography("");
      setNationality("");
      setOpen(false);
      qc.invalidateQueries({ queryKey: key });
    },
  });

  const del = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`${endpoint}/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success(t("common.deleted"));
      qc.invalidateQueries({ queryKey: key });
    },
  });

  return (
    <div>
      <PageHeader
        title={t("authors.title")}
        description={t("authors.description")}
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
                <DialogTitle>{t("authors.addAuthor")}</DialogTitle>
              </DialogHeader>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  create.mutate();
                }}
                className="space-y-3"
              >
                <div>
                  <Label>{t("authors.firstName")}</Label>
                  <Input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label>{t("authors.lastName")}</Label>
                  <Input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label>{t("authors.nationality")}</Label>
                  <Input
                    value={nationality}
                    onChange={(e) => setNationality(e.target.value)}
                  />
                </div>

                <div>
                  <Label>{t("authors.biography")}</Label>
                  <Textarea
                    rows={4}
                    value={biography}
                    onChange={(e) => setBiography(e.target.value)}
                  />
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
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Nationality</th>
              <th className="px-4 py-3">Biography</th>
              <th />
            </tr>
          </thead>

          <tbody>
            {list.data?.data?.map((author) => (
              <tr key={author.id}>
                <td className="px-4 py-3">
                  {author.first_name} {author.last_name}
                </td>
                <td className="px-4 py-3">{author.nationality ?? "—"}</td>
                <td className="px-4 py-3">{author.biography ?? "—"}</td>
                <td className="px-4 py-3">
                  {hasRole("admin") && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => del.mutate(author.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
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