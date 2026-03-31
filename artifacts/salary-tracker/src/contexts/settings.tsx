import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { type SalarySettings, DEFAULT_SETTINGS } from "@/lib/salary";

interface SettingsContextValue {
  settings: SalarySettings;
  isLoading: boolean;
  refresh: () => Promise<void>;
  save: (s: SalarySettings) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextValue>({
  settings: DEFAULT_SETTINGS,
  isLoading: true,
  refresh: async () => {},
  save: async () => {},
});

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SalarySettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/settings", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setSettings(data as SalarySettings);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const save = useCallback(async (s: SalarySettings) => {
    const res = await fetch("/api/settings", {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(s),
    });
    if (!res.ok) throw new Error("Failed to save settings");
    const data = await res.json();
    setSettings(data as SalarySettings);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <SettingsContext.Provider value={{ settings, isLoading, refresh, save }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
