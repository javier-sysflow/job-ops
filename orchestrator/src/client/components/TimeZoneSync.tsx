import { useEffect } from "react";
import * as api from "../api";
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
  const storedTimeZone = settings?.timeZone ?? null;
  const hasSettings = settings !== null;

  useEffect(() => {
    if (!hasSettings) return;
    const browserTimeZone = getBrowserTimeZone();
    if (!browserTimeZone || browserTimeZone === storedTimeZone) return;
    try {
      void Promise.resolve(
        api.updateSettings({ timeZone: browserTimeZone }),
      ).catch(() => {});
    } catch {
      // updateSettings unavailable (e.g. mocked APIs); nothing to do.
    }
  }, [hasSettings, storedTimeZone]);

  return null;
};
