export interface Author { id: string; name: string; bio?: string | null }
export interface Genre { id: string; name: string; description?: string | null }
export interface BookCopy {
  id: string; book_id: string; barcode?: string | null; qr_code?: string;
  condition?: string; status?: string;
}
export interface Book {
  id: string; title: string; isbn?: string | null; description?: string | null;
  publication_year?: number | null; cover_url?: string | null;
  total_copies?: number; available_copies?: number;
  authors?: Author[]; genres?: Genre[]; copies?: BookCopy[];
}
export interface Member {
  id: string; email: string; first_name: string; last_name: string;
  role: "reader" | "librarian" | "admin"; is_active: boolean;
  suspension_until?: string | null; qr_code?: string;
}
export interface Loan {
  id: string; user_id: string; book_copy_id: string;
  loan_date: string; due_date: string; return_date?: string | null;
  status: "active" | "returned" | "overdue" | string;
  user?: Member; bookCopy?: BookCopy & { book?: Book };
}
export interface Notification {
  id: string; title?: string; message: string;
  type?: string; read_at?: string | null; created_at: string;
}
export interface Paginated<T> {
  data: T[];
  meta: { page: number; per_page: number; total: number; last_page: number };
}