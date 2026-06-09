import { createFileRoute } from "@tanstack/react-router";
import { SimpleCrud } from "@/components/simple-crud";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/_app/genres")({
  head: () => ({ meta: [{ title: "Genres — SmartBiblio" }] }),
  component: GenresPage,
});

function GenresPage() {
  const { t } = useTranslation();
  return <SimpleCrud title={t("genres.title")} description={t("genres.description")} endpoint="/api/v1/genres" longField="description" />;
}
