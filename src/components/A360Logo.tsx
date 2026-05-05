import logo from "@/assets/a360-logo.png";

export function A360Logo({ size = 40, withText = true }: { size?: number; withText?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <img
        src={logo}
        alt="Aceleradora 360 SGP"
        width={size}
        height={size}
        className="rounded-md shadow-sm"
        style={{ width: size, height: size }}
      />
      {withText && (
        <div className="leading-tight">
          <div className="font-display text-base text-navy">Aceleradora 360</div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-gold font-semibold">SGP</div>
        </div>
      )}
    </div>
  );
}
