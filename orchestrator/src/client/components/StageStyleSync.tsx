import { useEffect } from "react";
import { useSettings } from "../hooks/useSettings";
import { setApplicationStageStyle } from "../i18n/stageStyle";

/**
 * Applies the signed-in user's "Application stages" setting to stage labels.
 * When it differs from the value remembered on this device, main.tsx
 * remounts the app so every label switches at once.
 */
export const StageStyleSync: React.FC = () => {
  const { settings } = useSettings();
  const style = settings?.applicationStageStyle?.value;

  useEffect(() => {
    if (style) setApplicationStageStyle(style);
  }, [style]);

  return null;
};
