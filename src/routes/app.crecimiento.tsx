import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/app/crecimiento")({
  component: CrecimientoPage,
});

function CrecimientoPage() {
  return (
    <div
      className="-m-6 lg:-m-8"
      style={{ height: "calc(100vh - 4rem)" }}
    >
      <iframe
        src="/marketing-digital.html"
        title="Sistema de Crecimiento Comercial Digital"
        className="w-full h-full border-0"
        allow="clipboard-write"
      />
    </div>
  );
}
