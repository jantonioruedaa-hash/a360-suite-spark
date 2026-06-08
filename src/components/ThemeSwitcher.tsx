import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Palette, Check } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { THEMES, type ThemeId } from "@/lib/themes";

const THEME_ORDER: ThemeId[] = ["aurora-v2", "indigo-elite", "editorial-premium"];

export function ThemeSwitcher() {
  const { themeId, setTheme } = useTheme();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors hover:bg-white/10"
          style={{ color: "var(--sidebar-foreground)" }}
          title="Cambiar tema"
        >
          <Palette className="w-[18px] h-[18px] shrink-0" />
          <span className="flex-1 text-left">Cambiar tema</span>
        </button>
      </PopoverTrigger>

      <PopoverContent
        side="right"
        align="end"
        sideOffset={8}
        className="w-72 p-4 shadow-xl border border-[#E0F2FE] rounded-2xl"
      >
        <p className="text-xs font-semibold uppercase tracking-widest text-[#94A3B8] mb-3">
          Tema de la plataforma
        </p>

        <div className="space-y-2">
          {THEME_ORDER.map((id) => {
            const theme = THEMES[id];
            const active = themeId === id;
            return (
              <button
                key={id}
                onClick={() => setTheme(id)}
                className={`w-full flex items-center gap-3 rounded-xl p-3 text-left transition-all border ${
                  active
                    ? "border-[#0EA5E9] bg-[#EFF6FF]"
                    : "border-transparent hover:border-[#E0F2FE] hover:bg-[#F5F7FF]"
                }`}
              >
                {/* Mini preview */}
                <div className="shrink-0 w-10 h-10 rounded-lg overflow-hidden border border-white/30 shadow-sm flex flex-col">
                  {/* Sidebar strip */}
                  <div
                    className="flex-1"
                    style={{ background: theme.preview.sidebar }}
                  />
                  {/* Topbar strip */}
                  <div
                    className="h-2.5"
                    style={{ background: theme.preview.topbar }}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#0C4A6E] leading-tight">
                    {theme.name}
                  </p>
                  <p className="text-[11px] text-[#94A3B8] mt-0.5 truncate">
                    {theme.description}
                  </p>
                </div>

                {active && (
                  <Check className="w-4 h-4 text-[#0EA5E9] shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        <p className="text-[10px] text-[#94A3B8] mt-3 text-center">
          Se guarda automáticamente en tu perfil
        </p>
      </PopoverContent>
    </Popover>
  );
}
