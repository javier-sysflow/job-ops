import i18n from "@client/i18n";
import { getUiLanguage } from "@client/i18n/language";
import enErrors from "@client/i18n/locales/en/errors";

type ZodLikeIssue = {
  code?: string;
  format?: string;
  minimum?: number;
  maximum?: number;
  expected?: string;
  received?: string;
  origin?: string;
  type?: string;
  validation?: string;
  message?: string;
  path?: Array<string | number>;
};

const REQUEST_ID_SUFFIX_PATTERN = /\s*\(requestId:\s*[^)]+\)\s*$/i;

type ErrorCode = keyof typeof enErrors.codes;
type ServerMessageKey = keyof typeof enErrors.server;

const ERROR_CODE_BY_STATUS: Record<number, ErrorCode> = {
  400: "INVALID_REQUEST",
  401: "UNAUTHORIZED",
  403: "FORBIDDEN",
  404: "NOT_FOUND",
  408: "REQUEST_TIMEOUT",
  409: "CONFLICT",
  422: "UNPROCESSABLE_ENTITY",
  500: "INTERNAL_ERROR",
  502: "UPSTREAM_ERROR",
  503: "SERVICE_UNAVAILABLE",
};

// Exact English server/browser messages -> their key in errors:server.
const SERVER_MESSAGE_KEYS = new Map<string, ServerMessageKey>(
  (Object.entries(enErrors.server) as Array<[ServerMessageKey, string]>).map(
    ([key, message]) => [message, key],
  ),
);
const HTML_INSTEAD_OF_JSON_PATTERN =
  /^Server error \((\d+)\): Expected JSON but received HTML\. Is the backend server running\?$/;
const STREAM_FAILED_PATTERN = /^Stream request failed with status (\d+)$/;
// Hiragana and katakana (U+3040-30FF), CJK ideographs (U+3400-9FFF) and
// full-width punctuation (U+FF01-FF60).
const JAPANESE_TEXT_PATTERN = /[぀-ヿ㐀-鿿！-｠]/u;

function isErrorCode(value: unknown): value is ErrorCode {
  return typeof value === "string" && Object.hasOwn(enErrors.codes, value);
}

function resolveErrorCode(error: unknown): ErrorCode | null {
  if (!error || typeof error !== "object") return null;
  const { code, status } = error as { code?: unknown; status?: unknown };
  if (isErrorCode(code)) return code;
  if (typeof status === "number") return ERROR_CODE_BY_STATUS[status] ?? null;
  return null;
}

function translateKnownMessage(message: string): string | null {
  const key = SERVER_MESSAGE_KEYS.get(message);
  if (key) return i18n.t(`errors:server.${key}`);
  const html = HTML_INSTEAD_OF_JSON_PATTERN.exec(message);
  if (html) {
    return i18n.t("errors:serverPatterns.htmlInsteadOfJson", {
      status: html[1],
    });
  }
  const stream = STREAM_FAILED_PATTERN.exec(message);
  if (stream) {
    return i18n.t("errors:serverPatterns.streamFailed", { status: stream[1] });
  }
  return null;
}

/**
 * Server and browser error text is English. In the Japanese UI, a message
 * with a known translation is replaced by it; otherwise the error code's
 * translated message is shown with the original text in parentheses.
 * In the English UI the message is returned unchanged.
 */
export function localizeErrorMessage(message: string, error?: unknown): string {
  if (getUiLanguage() !== "ja") return message;
  if (!message || JAPANESE_TEXT_PATTERN.test(message)) return message;
  const known = translateKnownMessage(message);
  if (known) return known;
  const code = resolveErrorCode(error);
  if (!code) return message;
  return i18n.t("errors:withServerDetail", {
    message: i18n.t(`errors:codes.${code}`),
    detail: message,
  });
}

/** `error.message` (localized) for Error instances, otherwise the fallback. */
export function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error
    ? localizeErrorMessage(error.message, error)
    : fallback;
}

function toIssuePath(path: Array<string | number> | undefined): string {
  if (!Array.isArray(path) || path.length === 0) return "";
  return path.map((segment) => String(segment)).join(".");
}

function normalizeSectionName(section: string): string {
  return section.endsWith("s") ? section.slice(0, -1) : section;
}

function toFriendlyFieldLabel(path: string): string | null {
  if (!path) return null;
  if (path === "jobDescription") return i18n.t("errors:fields.jobDescription");
  if (path === "job.jobUrl" || path === "jobUrl") {
    return i18n.t("errors:fields.jobUrl");
  }
  if (path === "applicationLink" || path === "job.applicationLink") {
    return i18n.t("errors:fields.applicationUrl");
  }
  if (/^sections\.skills\.items\.\d+\.name$/.test(path)) {
    return i18n.t("errors:fields.skillName");
  }
  if (/^sections\.projects\.items\.\d+\.name$/.test(path))
    return i18n.t("errors:fields.projectName");

  const sectionMatch =
    /^sections\.([a-z-]+)\.items\.\d+\.([a-zA-Z0-9_-]+)$/.exec(path);
  if (sectionMatch) {
    const section = normalizeSectionName(sectionMatch[1] ?? "item");
    const field = (sectionMatch[2] ?? "field")
      .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
      .replace(/_/g, " ")
      .toLowerCase();
    return `${section} ${field}`;
  }

  const lastSegment = path.split(".").at(-1);
  if (!lastSegment) return null;
  return lastSegment
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .toLowerCase();
}

function toSentenceCase(input: string): string {
  if (!input) return input;
  return input.charAt(0).toUpperCase() + input.slice(1);
}

function extractNumericConstraint(
  message: string | undefined,
  kind: "minimum" | "maximum",
): number | null {
  if (!message) return null;
  const patterns =
    kind === "minimum"
      ? [/at least\s+(\d+)/i, />=\s*(\d+)/, /minimum(?:\s+of)?\s+(\d+)/i]
      : [/at most\s+(\d+)/i, /<=\s*(\d+)/, /maximum(?:\s+of)?\s+(\d+)/i];

  for (const pattern of patterns) {
    const match = pattern.exec(message);
    const value = match?.[1] ? Number.parseInt(match[1], 10) : Number.NaN;
    if (Number.isFinite(value)) return value;
  }

  return null;
}

function toFriendlyIssueMessage(issue: ZodLikeIssue): string | null {
  const path = toIssuePath(issue.path);
  const label = toFriendlyFieldLabel(path);

  if (path === "jobDescription") {
    return i18n.t("errors:validation.jobDescriptionRequired");
  }

  if (/^sections\.skills\.items\.\d+\.name$/.test(path)) {
    return i18n.t("errors:validation.skillRequired");
  }

  const normalizedIssueMessage = issue.message?.toLowerCase() ?? "";
  const isInvalidUrl =
    (issue.code === "invalid_string" && issue.validation === "url") ||
    (issue.code === "invalid_format" && issue.format === "url") ||
    /\binvalid\s+url\b/.test(normalizedIssueMessage);

  if (isInvalidUrl) {
    return label
      ? i18n.t("errors:validation.invalidField", { label })
      : i18n.t("errors:validation.invalidUrl");
  }

  if (path === "password") {
    const minimum =
      issue.minimum ?? extractNumericConstraint(issue.message, "minimum");
    if (issue.code === "too_small" || minimum !== null) {
      if (minimum === null || minimum <= 1) {
        return i18n.t("errors:validation.passwordRequired");
      }
      return i18n.t("errors:validation.passwordTooShort", { minimum });
    }

    const maximum =
      issue.maximum ?? extractNumericConstraint(issue.message, "maximum");
    if (issue.code === "too_big" || maximum !== null) {
      return maximum === null
        ? i18n.t("errors:validation.passwordTooLong")
        : i18n.t("errors:validation.passwordMaxLength", { maximum });
    }
  }

  const isStringIssue =
    issue.type === "string" ||
    issue.origin === "string" ||
    /\bstring\b/i.test(issue.message ?? "");
  const maximum =
    issue.maximum ?? extractNumericConstraint(issue.message, "maximum");

  if (
    label &&
    isStringIssue &&
    (issue.code === "too_big" || maximum !== null)
  ) {
    return maximum === null
      ? i18n.t("errors:validation.fieldTooLong", {
          label: toSentenceCase(label),
        })
      : i18n.t("errors:validation.fieldMaxLength", {
          label: toSentenceCase(label),
          maximum,
        });
  }

  if (issue.code === "too_small" && isStringIssue && issue.minimum === 1) {
    if (label) {
      return i18n.t("errors:validation.fieldRequired", { label });
    }
    return i18n.t("errors:validation.requiredField");
  }

  if (issue.code === "invalid_type") {
    if (label) {
      return i18n.t("errors:validation.fieldInvalidType", { label });
    }
    return i18n.t("errors:validation.checkValue");
  }

  return null;
}

function toZodLikeIssues(value: unknown): ZodLikeIssue[] | null {
  if (Array.isArray(value)) {
    const issues = value.filter((entry): entry is ZodLikeIssue =>
      Boolean(entry && typeof entry === "object"),
    );
    return issues.length > 0 ? issues : null;
  }

  if (
    value &&
    typeof value === "object" &&
    Array.isArray((value as { issues?: unknown }).issues)
  ) {
    return toZodLikeIssues((value as { issues: unknown[] }).issues);
  }

  return null;
}

function parseIssuesFromJsonMessage(message: string): ZodLikeIssue[] | null {
  const trimmed = message.trim();
  if (!(trimmed.startsWith("[") || trimmed.startsWith("{"))) return null;

  try {
    const parsed = JSON.parse(trimmed) as unknown;
    return toZodLikeIssues(parsed);
  } catch {
    return null;
  }
}

function parseIssueFromValidationMessage(message: string): ZodLikeIssue | null {
  const match =
    /validation failed at "([^"]+)":\s*(.+)$/i.exec(message) ??
    /at "([^"]+)":\s*(.+)$/i.exec(message);
  if (!match) return null;

  const path = match[1]?.split(".").filter(Boolean) ?? [];
  const detail = match[2]?.trim() ?? "";
  return {
    path,
    message: detail,
  };
}

function parseIssuesFromDetails(details: unknown): ZodLikeIssue[] | null {
  if (!details || typeof details !== "object") return null;

  const directIssues = toZodLikeIssues(details);
  if (directIssues) return directIssues;

  const detailsRecord = details as Record<string, unknown>;

  if (
    detailsRecord.fieldErrors &&
    typeof detailsRecord.fieldErrors === "object" &&
    !Array.isArray(detailsRecord.fieldErrors)
  ) {
    const fieldErrors = detailsRecord.fieldErrors as Record<string, unknown>;
    for (const [field, value] of Object.entries(fieldErrors)) {
      if (!Array.isArray(value) || value.length === 0) continue;
      const firstMessage = value.find((entry) => typeof entry === "string");
      if (typeof firstMessage === "string") {
        return [{ path: [field], message: firstMessage }];
      }
    }
  }

  return null;
}

function extractRawErrorMessage(error: unknown): string {
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error) {
    const maybeMessage = (error as { message?: unknown }).message;
    if (typeof maybeMessage === "string") return maybeMessage;
  }
  if (error && typeof error === "object" && "error" in error) {
    const nestedError = (error as { error?: unknown }).error;
    if (nestedError && typeof nestedError === "object") {
      const maybeMessage = (nestedError as { message?: unknown }).message;
      if (typeof maybeMessage === "string") return maybeMessage;
    }
  }
  return "";
}

function extractErrorDetails(error: unknown): unknown {
  if (!error || typeof error !== "object") return null;
  if ("details" in error)
    return (error as { details?: unknown }).details ?? null;
  if ("error" in error) {
    const nestedError = (error as { error?: unknown }).error;
    if (
      nestedError &&
      typeof nestedError === "object" &&
      "details" in nestedError
    ) {
      return (nestedError as { details?: unknown }).details ?? null;
    }
  }
  return null;
}

export function stripRequestIdFromMessage(message: string): string {
  return message.replace(REQUEST_ID_SUFFIX_PATTERN, "").trim();
}

export function formatUserFacingError(
  error: unknown,
  fallback: string = i18n.t("errors:unknown"),
): string {
  const raw = extractRawErrorMessage(error);
  const details = extractErrorDetails(error);

  const directIssues = toZodLikeIssues(error);
  if (directIssues && directIssues.length > 0) {
    const friendly = toFriendlyIssueMessage(directIssues[0]);
    if (friendly) return friendly;
  }

  const detailIssues = parseIssuesFromDetails(details);
  if (detailIssues && detailIssues.length > 0) {
    const friendly = toFriendlyIssueMessage(detailIssues[0]);
    if (friendly) return friendly;
  }

  if (!raw) return fallback;

  const message = stripRequestIdFromMessage(raw);
  if (!message) return fallback;

  const jsonIssues = parseIssuesFromJsonMessage(message);
  if (jsonIssues && jsonIssues.length > 0) {
    const friendly = toFriendlyIssueMessage(jsonIssues[0]);
    if (friendly) return friendly;
  }

  const validationIssue = parseIssueFromValidationMessage(message);
  if (validationIssue) {
    const friendly = toFriendlyIssueMessage(validationIssue);
    if (friendly) return friendly;

    const label = toFriendlyFieldLabel(toIssuePath(validationIssue.path));
    if (label) {
      return i18n.t("errors:validation.fieldInvalid", {
        label: toSentenceCase(label),
      });
    }
  }

  if (message.trim().startsWith("{") || message.trim().startsWith("[")) {
    return fallback;
  }

  // Only errors that reach the UI (Error instances such as ApiClientError,
  // or objects carrying a code/status) are localized. api/core.ts formats
  // plain { message, details } objects while building ApiClientError; those
  // keep the English server text so the error object stays inspectable.
  return error instanceof Error || resolveErrorCode(error)
    ? localizeErrorMessage(message, error)
    : message;
}
