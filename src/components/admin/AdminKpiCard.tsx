interface Props {
  icon: string;
  value: string | number;
  label: string;
  change: string;
  gradient: string;
}

export default function AdminKpiCard({ icon, value, label, change, gradient }: Props) {
  return (
    <div
      style={{
        background: gradient,
        borderRadius: "18px",
        padding: "26px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          background:
            "radial-gradient(ellipse 80% 80% at 80% 20%, rgba(14,165,233,0.2), transparent)",
        }}
      />
      <div style={{ fontSize: "30px", marginBottom: "14px", position: "relative", zIndex: 2 }}>
        {icon}
      </div>
      <div
        style={{
          fontSize: "40px",
          fontWeight: 900,
          color: "white",
          letterSpacing: "-0.03em",
          lineHeight: 1,
          marginBottom: "8px",
          position: "relative",
          zIndex: 2,
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: "13px",
          color: "rgba(255,255,255,0.5)",
          fontWeight: 600,
          position: "relative",
          zIndex: 2,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: "13px",
          color: "#38BDF8",
          fontWeight: 700,
          marginTop: "8px",
          position: "relative",
          zIndex: 2,
        }}
      >
        {change}
      </div>
    </div>
  );
}
