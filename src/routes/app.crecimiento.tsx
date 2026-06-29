import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/app/crecimiento")({
  component: CrecimientoPage,
});

function CrecimientoPage() {
  return (
    <div
      style={{
        margin: "-24px -32px",
        height: "calc(100vh - 56px)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <iframe
        src="/marketing-digital-v9.html"
        title="Marketing Digital A360"
        style={{
          width: "100%",
          flex: 1,
          border: "none",
        }}
        allow="clipboard-write"
      />
    </div>
  );
}
