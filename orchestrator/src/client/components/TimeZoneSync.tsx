import { useEffect } from "react";
import * as api from "../api";
import { useDemoInfo } from "../hooks/useDemoInfo";
import { useSettings } from "../hooks/useSettings";

function getBrowserTimeZone(): string | null {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || null;
  } catch {
    return null;
  }
}

/**
 * Saves the browser's time zone to the signed-in user's settings so
 * server-generated documents (e.g. the 職務経歴書 date) use their local
 * date. Runs silently; failures (signed out, demo mode) are ignored.
 */
export const TimeZoneSync: React.FC = () => {
  const { settings } = useSettings();
  // Only sync once we know this is not the public demo (saves are blocked
  // there and would show a "blocked" notice on every page).
  const demoInfo = useDemoInfo();
  const isRealInstance = demoInfo !== null && !demoInfo.demoMode;
  const storedTimeZone = settings?.timeZone ?? null;
  const hasSettings = settings !== null;

  useEffect(() => {
    if (!hasSettings || !isRealInstance) return;
    const browserTimeZone = getBrowserTimeZone();
    if (!browserTimeZone || browserTimeZone === storedTimeZone) return;
    try {
      void Promise.resolve(
        api.updateSettings({ timeZone: browserTimeZone }),
      ).catch(() => {});
    } catch {
      // updateSettings unavailable (e.g. mocked APIs); nothing to do.
    }
  }, [hasSettings, isRealInstance, storedTimeZone]);

  return null;
};
