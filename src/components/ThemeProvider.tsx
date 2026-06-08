import { createContext, useContext, useLayoutEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { applyTheme, DEFAULT_THEME_ID, THEMES, type ThemeId } from "@/lib/themes";

interface ThemeContextValue {
  themeId: ThemeId;
  setTheme: (id: ThemeId) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextValue>({
  themeId: DEFAULT_THEME_ID,
  setTheme: async () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [themeId, setThemeId] = useState<ThemeId>(DEFAULT_THEME_ID);

  // Apply Aurora V2 defaults immediately on first render (before Supabase response)
  useLayoutEffect(() => {
    applyTheme(DEFAULT_THEME_ID);
  }, []);

  // Load saved theme from Supabase once user is known
  useLayoutEffect(() => {
    if (!user) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;
    db.from("user_preferences")
      .select("theme")
      .eq("user_id", user.id)
      .maybeSingle()
      .then((res: { data: { theme: string } | null; error: unknown }) => {
        const saved = res?.data?.theme as ThemeId | undefined;
        if (saved && saved in THEMES) {
          setThemeId(saved);
          applyTheme(saved);
        }
      })
      .catch(() => {
        // Table may not exist yet — stay on default
      });
  }, [user?.id]);

  const setTheme = async (id: ThemeId) => {
    setThemeId(id);
    applyTheme(id);
    if (!user) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;
    await db
      .from("user_preferences")
      .upsert({ user_id: user.id, theme: id }, { onConflict: "user_id" })
      .catch(() => {});
  };

  return (
    <ThemeContext.Provider value={{ themeId, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
