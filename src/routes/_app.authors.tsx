import { createFileRoute } from "@tanstack/react-router";
import { SimpleCrud } from "@/components/simple-crud";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/_app/authors")({
  head: () => ({ meta: [{ title: "Authors — SmartBiblio" }] }),
  component: AuthorsPage,
});

function AuthorsPage() {
  const { t } = useTranslation();
  return <SimpleCrud title={t("authors.title")} description={t("authors.description")} endpoint="/api/v1/authors" longField="biography" />;
}