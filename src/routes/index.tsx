import { createFileRoute } from "@tanstack/react-router";
import { Navigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/smartbiblio/auth";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SmartBiblio — Library Management" },
      { name: "description", content: "Manage members, loans, and your library catalog with SmartBiblio." },
      { property: "og:title", content: "SmartBiblio" },
      { property: "og:description", content: "Library management dashboard for members, librarians, and admins." },
    ],
  }),
  component: Index,
});

function Index() {
  const { user, loading } = useAuth();
  const { t } = useTranslation();
  if (loading)
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">{t("indexLoading")}</div>;
  return <Navigate to={user ? "/dashboard" : "/login"} />;
}
