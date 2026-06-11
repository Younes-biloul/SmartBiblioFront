import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { apiRequest, apiFetch, ApiError } from "@/lib/smartbiblio/api";
import type { Loan } from "@/lib/smartbiblio/types";
import { useAuth } from "@/lib/smartbiblio/auth";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import {
  Command,
  CommandInput,
  CommandList,
  CommandItem,
  CommandEmpty,
} from "@/components/ui/command";

import { RotateCw, Undo2 } from "lucide-react";

export const Route = createFileRoute("/_app/loans")({
  head: () => ({ meta: [{ title: "Loans — SmartBiblio" }] }),
  component: LoansPage,
});

function StatusBadge({ s }: { s: string }) {
  const cls =
    s === "active"
      ? "bg-primary/15 text-primary"
      : s === "returned"
      ? "bg-muted text-muted-foreground"
      : s === "overdue"
      ? "bg-destructive/15 text-destructive"
      : "bg-muted text-muted-foreground";

  return (
    <span className={`rounded-full px-2 py-0.5 text-xs capitalize ${cls}`}>
      {s}
    </span>
  );
}

function LoansPage() {
  const { hasRole } = useAuth();
  const { t } = useTranslation();
  const qc = useQueryClient();
  const isAdmin = hasRole("admin", "librarian");

  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);

  // reset page on filter change
  useEffect(() => {
    setPage(1);
  }, [status]);
  // ---------------- FORM STATE ----------------
  const [open, setOpen] = useState(false);

  // USER
  const [userSearch, setUserSearch] = useState("");
  const [userId, setUserId] = useState("");
  const [userLabel, setUserLabel] = useState("");
  const [userOpen, setUserOpen] = useState(false);

  // BOOK
  const [bookSearch, setBookSearch] = useState("");
  const [bookId, setBookId] = useState("");
  const [bookLabel, setBookLabel] = useState("");
  const [bookOpen, setBookOpen] = useState(false);

  // COPY
  const [copyId, setCopyId] = useState("");
  
  
  // ---------------- LOANS ----------------
  const { data, isLoading } = useQuery({
    queryKey: ["loans", status, page],
    queryFn: () =>
      apiRequest<any>("/api/v1/loans", {
        query: {
          status: status === "all" ? undefined : status,
          per_page: 10,
          page,
        },
      }),
  });

  
  const loans = data?.data ?? [];
  const meta = data?.meta;

  // ---------------- USERS SEARCH ----------------
  const usersQuery = useQuery({
    queryKey: ["users-search", userSearch],
    queryFn: () =>
      apiRequest<any>("/api/v1/search/users", {
        query: {
          search: userSearch,
          per_page: 10,
        },
      }),
    enabled: userSearch.length > 0,
    staleTime: 0, 
  });

  const users = usersQuery.data?.data ?? usersQuery.data ?? [];

  // ---------------- BOOK SEARCH ----------------
  const booksQuery = useQuery({
    queryKey: ["books-search", bookSearch],
    queryFn: () =>
      apiRequest<any>("/api/v1/search/books", {
        query: { search: bookSearch, per_page: 10 },
      }),
    enabled: bookSearch.length > 0,
  });

  const books = booksQuery.data?.data ?? booksQuery.data ?? [];

  // ---------------- BOOK COPIES ----------------
  const copiesQuery = useQuery({
      queryKey: ["book-copies", bookId],
      queryFn: () =>
        apiRequest<any>(`/api/v1/search/book-copies-by-book/${bookId}`),
      enabled: !!bookId,
    });
   console.log("copiesQuery", copiesQuery);
  const copies = copiesQuery.data?.data ?? copiesQuery.data ?? [];
  console.log("copies", copies);
  // ---------------- CREATE LOAN ----------------
  const createLoan = useMutation({
    mutationFn: () =>
      apiFetch("/api/v1/loans", {
        method: "POST",
        body: JSON.stringify({
          user_id: userId,
          book_copy_id: copyId,
        }),
      }),
    onSuccess: () => {
      toast.success(t("loans.created"));
      setOpen(false);
      setUserId("");
      setUserLabel("");
      setBookId("");
      setBookLabel("");
      setCopyId("");
      qc.invalidateQueries({ queryKey: ["loans"] });
    },
    onError: (e) =>
      toast.error(e instanceof ApiError ? e.message : t("common.failed")),
  });

  // ---------------- ACTIONS ----------------
  const ret = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/v1/loans/${id}/return`, { method: "POST" }),
    onSuccess: () => {
      toast.success(t("loans.returned"));
      qc.invalidateQueries({ queryKey: ["loans"] });
    },
  });

  const renew = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/v1/loans/${id}/renew`, { method: "POST" }),
    onSuccess: () => {
      toast.success(t("loans.renewed"));
      qc.invalidateQueries({ queryKey: ["loans"] });
    },
  });

  return (
    <div>
      {/* HEADER */}
      <PageHeader
        title={t("loans.title")}
        description={t("loans.description")}


        actions={
          hasRole("admin", "librarian") && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>+ {t("loans.create")}</Button>
            </DialogTrigger>

            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("loans.create")}</DialogTitle>
              </DialogHeader>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!userId || !copyId) {
                    toast.error("Select user, book and copy");
                    return;
                  }
                  createLoan.mutate();
                }}
                className="space-y-4"
              >
                {/* USER */}
                <div className="space-y-2">
                  <Label>{t("loans.user")}</Label>
                  <Popover open={userOpen} onOpenChange={setUserOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                        {userLabel || "Select user"}
                      </Button>
                    </PopoverTrigger>

                    <PopoverContent className="w-[320px] p-0">
                      <Command>
                        <CommandInput
                          placeholder="Search user..."
                          value={userSearch}
                          onValueChange={(v) => {
                            setUserSearch(v);
                            if (!userOpen) setUserOpen(true);
                          }}
                        />
                        <CommandList>
                        {usersQuery.isLoading && (
                          <div className="p-2 text-sm text-muted-foreground flex items-center justify-center">
                            {t("common.loading")}
                          </div>
                        )}

                        {/* EMPTY STATE */}
                        {!usersQuery.isLoading && users.length === 0 && (
                          <CommandEmpty>{t("common.no-results")}</CommandEmpty>
                        )}

                        {/* RESULTS */}
                        {users.map((u: any) => (
                          <CommandItem
                            key={u.id}
                            value={`${u.first_name} ${u.last_name}`} // 👈 IMPORTANT FIX
                            onSelect={() => {
                              setUserId(u.id);
                              setUserLabel(`${u.first_name} ${u.last_name}`);
                              setUserOpen(false);
                              setUserSearch(""); // 👈 IMPORTANT UX FIX
                            }}
                          >
                            {u.first_name} {u.last_name}
                          </CommandItem>
                        ))}
                      </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* BOOK */}
                <div className="space-y-2">
                  <Label>{t("loans.book")}</Label>
                  <Popover open={bookOpen} onOpenChange={setBookOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                        {bookLabel || "Select book"}
                      </Button>
                    </PopoverTrigger>

                    <PopoverContent className="w-[320px] p-0">
                       
                      <Command>
                        <CommandInput
                          placeholder="Search book..."
                          value={bookSearch}
                          onValueChange={setBookSearch}
                        />
                        <CommandList>
                          {booksQuery.isLoading && (
                          <div className="p-2 text-sm text-muted-foreground flex items-center justify-center">
                            {t("common.loading")}
                          </div>
                            )}
                          {!booksQuery.isLoading && books.length === 0 && (
                          <CommandEmpty>{t("common.no-results")}</CommandEmpty>
                        )}
                          {books.map((b: any) => (
                            <CommandItem
                              key={b.id}
                              onSelect={() => {
                                setBookId(b.id);
                                setBookLabel(b.title);
                                setBookOpen(false);
                                setCopyId("");
                              }}
                            >
                              {b.title}
                            </CommandItem>
                          ))}
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* COPY */}
                <div className="space-y-2">
                  <Label>{t("loans.bookCopy")}</Label>
                  <Select value={copyId} onValueChange={setCopyId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select copy" />
                    </SelectTrigger>
                    <SelectContent>
                      {copies.map((c: any) => (
                        <SelectItem key={c.id} value={c.id}>
                          Copy #{c.id} ({c.status})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <DialogFooter>
                  <Button type="submit" disabled={createLoan.isPending}>
                    {t("common.create")}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
  )}
      />

      {/* FILTER */}
      <div className="mb-4 flex items-center gap-2">
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("loans.status.all")}</SelectItem>
            <SelectItem value="active">{t("loans.status.active")}</SelectItem>
            <SelectItem value="returned">{t("loans.status.returned")}</SelectItem>
            <SelectItem value="overdue">{t("loans.status.overdue")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* TABLE (RESTORED CLEAN UI) */}
      <div className="overflow-hidden rounded-xl border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/30 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Book</th>
              <th className="px-4 py-3">Member</th>
              <th className="px-4 py-3">Loaned</th>
              <th className="px-4 py-3">Due</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>

          <tbody className="divide-y">
            {isLoading && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center">
                  {t("common.loading")}
                </td>
              </tr>
            )}

            {!isLoading && loans.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  No loans found
                </td>
              </tr>
            )}

            {loans.map((l) => (
              <tr key={l.id}>
                <td className="px-4 py-3">{l.book_copy?.book?.title}</td>

                <td className="px-4 py-3">
                  {l.user ? `${l.user.first_name} ${l.user.last_name}` : "—"}
                </td>

                <td className="px-4 py-3">{l.loan_date?.slice(0, 10)}</td>
                <td className="px-4 py-3">{l.due_date?.slice(0, 10)}</td>

                <td className="px-4 py-3">
                  <StatusBadge s={l.status} />
                </td>

                <td className="px-4 py-3 text-right">
                  {l.status === "active" && (
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="ghost" onClick={() => renew.mutate(l.id)}>
                        <RotateCw className="h-4 w-4" />
                      </Button>

                      {hasRole("librarian", "admin") && (
                        <Button size="sm" variant="ghost" onClick={() => ret.mutate(l.id)}>
                          <Undo2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex items-center justify-between p-4">
        <div className="text-sm text-muted-foreground">
          Page {meta?.current_page ?? page} / {meta?.last_page ?? 1}
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>

          <Button
            variant="outline"
            disabled={meta?.current_page >= meta?.last_page}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      </div>
            </div>
          </div>
        );
      }

// function useEffect(arg0: () => void, arg1: string[]) {
//   throw new Error("Function not implemented.");
// }
