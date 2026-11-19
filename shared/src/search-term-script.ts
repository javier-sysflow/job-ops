/**
 * Fork: which search terms a job board can use. Mynavi only matches Japanese
 * text, and every term there starts a paid Apify run: Riho's English phrases
 * ("renewable energy consultant") each returned 0 jobs and still cost a run.
 * Himalayas, Working Nomads and startup.jobs list English jobs only, so a
 * Japanese term there finds nothing.
 *
 * Indeed, LinkedIn and every source not listed here get all terms. Japan Dev
 * is not listed: it text-matches Japanese terms against its pages on purpose.
 */

type TermScript = "japanese" | "latin";

const TERM_SCRIPT_BY_SOURCE: Readonly<Record<string, TermScript>> = {
  mynavi: "japanese",
  himalayas: "latin",
  workingnomads: "latin",
  startupjobs: "latin",
};

const JAPANESE_SCRIPT = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u;

/** True when the term has any kanji or kana (営業, PPA 営業, ＳａａＳ営業). */
export function hasJapaneseScript(term: string): boolean {
  return JAPANESE_SCRIPT.test(term);
}

function usableOnJapaneseBoard(term: string): boolean {
  if (hasJapaneseScript(term)) return true;
  // A single Latin word is often written as-is in Japanese ads (ESG, PPA,
  // SaaS, Python). An English phrase ("energy consultant") is not.
  return term.trim().split(/\s+/).filter(Boolean).length === 1;
}

/** The terms worth sending to `source`, in their original order. */
export function filterSearchTermsForSource(
  source: string,
  terms: readonly string[],
): string[] {
  const script = TERM_SCRIPT_BY_SOURCE[source];
  if (!script) return [...terms];
  return terms.filter((term) =>
    script === "japanese"
      ? usableOnJapaneseBoard(term)
      : !hasJapaneseScript(term),
  );
}

/**
 * Why a source got no terms, for run details. Null when the source can use
 * at least one of the terms (or there were no terms to begin with).
 */
export function describeNoUsableTerms(
  source: string,
  terms: readonly string[],
): string | null {
  if (terms.length === 0) return null;
  if (filterSearchTermsForSource(source, terms).length > 0) return null;
  return TERM_SCRIPT_BY_SOURCE[source] === "japanese"
    ? "Searches in Japanese only: add a Japanese search term (e.g. 営業) to use it."
    : "Lists English jobs only: add an English search term to use it.";
}
