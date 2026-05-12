import logo from "@/assets/a360-logo.png";
import { useAppSettings } from "@/lib/app-settings";

export function A360Logo({ size = 40, withText = true }: { size?: number; withText?: boolean }) {
  const { settings } = useAppSettings();
  const src = settings.logo_url || logo;
  return (
    <div className="flex items-center gap-3">
      <img
        src={src}
        alt={settings.company_name}
        width={size}
        height={size}
        className="rounded-md shadow-sm object-contain bg-white/5"
        style={{ width: size, height: size }}
      />
      {withText && (
        <div className="leading-tight">
          <div className="font-display text-base text-navy">{settings.company_name}</div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-gold font-semibold">{settings.app_name}</div>
        </div>
      )}
    </div>
  );
}
