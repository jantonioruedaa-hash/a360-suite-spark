import { createFileRoute, useParams } from "@tanstack/react-router";
import { SideCore } from "@/routes/app.side";

export const Route = createFileRoute("/app/clientes/$clienteId/side")({
  component: SideClientePage,
});

function SideClientePage() {
  const { clienteId } = useParams({ from: "/app/clientes/$clienteId/side" });
  return <SideCore mode="cliente" fixedClienteId={clienteId} />;
}
