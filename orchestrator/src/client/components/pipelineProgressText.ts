/**
 * Server progress text in the UI language.
 *
 * The server sends English `message`/`detail` plus optional
 * `messageKey`/`detailKey` (+ params). Known keys are translated; anything
 * else (older servers, extractor detail lines) is shown as sent.
 */
import i18n from "@client/i18n";
import type { PipelineProgressState } from "@shared/types";

type ServerTextParams = Record<string, string | number>;
type TranslateFn = (key: string, options?: ServerTextParams) => string;

function translateServerText(
  key: string | undefined,
  params: ServerTextParams | undefined,
  fallback: string,
): string {
  if (!key || !i18n.exists(key)) return fallback;
  return (i18n.t as unknown as TranslateFn)(key, params);
}

export function progressMessageText(
  progress: Pick<
    PipelineProgressState,
    "message" | "messageKey" | "messageParams"
  >,
): string {
  return translateServerText(
    progress.messageKey,
    progress.messageParams,
    progress.message,
  );
}

export function progressDetailText(
  progress: Pick<
    PipelineProgressState,
    "detail" | "detailKey" | "detailParams"
  >,
): string | undefined {
  if (!progress.detail) return progress.detail;
  return translateServerText(
    progress.detailKey,
    progress.detailParams,
    progress.detail,
  );
}
