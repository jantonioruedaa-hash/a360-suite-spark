import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/app/clientes/$clienteId/lee/$capitulo")({
  component: () => null,
});
