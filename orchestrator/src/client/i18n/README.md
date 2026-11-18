# Translating the UI (English / 日本語)

The client uses **i18next + react-i18next**. English is the source language; Japanese must cover every English key (enforced by `completeness.test.ts` and by TypeScript: each `locales/ja/<ns>.ts` is typed as `typeof en`).

## Files

- `locales/en/<namespace>.ts` / `locales/ja/<namespace>.ts`: one pair per area. Only edit the namespaces you own (see below). `common.ts` and `enums.ts` are shared and already filled. Use them, don't edit them.
- `index.ts`: i18next setup. `language.ts`: active language, persisted in localStorage `jobops.uiLanguage`, defaults to Japanese for Japanese browsers.
- `format.ts`: `formatDate`, `formatTime`, `formatDateTime`, `formatNumber`, `formatCurrency`, `formatRelativeTime`. Use these instead of `toLocaleString("en-GB")`, `toLocaleDateString("en-US")` or hand-built "3d ago" text.
- `labels.ts`: `jobStatusLabel`, `stageLabel`, `outcomeLabel`, `taskTypeLabel`, `interviewTypeLabel`, `interviewOutcomeLabel`, `workplaceTypeLabel`, `countryLabel`. Use these instead of `STAGE_LABELS[...]` or local status maps in UI code. (`shared/` keeps English labels for the server and AI prompts; do not change `shared/`.)

## How to convert a component

```tsx
import { useTranslation } from "react-i18next";

export function JobListEmpty() {
  // List every namespace you use: "common:" keys only type-check when
  // "common" is in the hook's namespace list.
  const { t } = useTranslation(["jobs", "common"]);
  return (
    <p>
      {t("list.empty")}{" "}
      <Button>{t("common:actions.refresh")}</Button>
    </p>
  );
}
```

- **Keys** are camelCase and grouped by component or area: `list.empty`, `filters.salary.placeholder`, `detail.actions.markApplied`. Cross-namespace: `t("common:actions.save")` (needs `useTranslation(["yourNs", "common"])`).
- **Interpolation:** `"Showing {{count}} jobs"` → `t("list.showing", { count })`. Never concatenate translated fragments into a sentence; Japanese word order differs.
- **Plurals:** English uses `key_one` / `key_other`; Japanese only needs `key_other`. Call with `{ count }`.
- **Rich text** (links, bold inside a sentence): `<Trans i18nKey="jobs:list.hint" components={{ strong: <strong />, link: <a href="..." /> }} />` with `"Press <strong>?</strong> for <link>shortcuts</link>"`.
- **Module-level constants** (arrays and maps of labels defined outside components): store a key (`labelKey: "jobs:sort.newest"`) and call `t(item.labelKey)` at render time, or turn the constant into a function of `t`. Don't call `t()` at module load; the language is not known yet.
- **Non-React code** (hooks' toast messages, utilities): `import i18n from "@client/i18n";` then `i18n.t("ns:key")`. The app remounts on language change, so this is safe.
- **Toasts, aria-labels, placeholders, titles, empty states, confirm dialogs, button text, tooltips** are all user-visible: translate them.
- **Do not translate** brand and product names (JobOps, Ghostwriter, Reactive Resume, Gmail, LinkedIn, Indeed, Himalayas, Japan Dev, Typst, OpenRouter, Claude), code, URLs, file names, keyboard keys, or log and analytics strings. Mark intentional literals with a trailing `// i18n-ignore` comment so the scanner skips them.

## Rules that keep tests and merges working

1. **English values must be byte-identical to the original string**, including punctuation, ellipses and capitalisation. 66+ UI tests assert English text, and `setupTests.ts` runs them in English.
2. **Only change string literals** and add the `useTranslation` import and hook. No className, layout or logic changes; another session is restyling the same files in parallel.
3. **Only touch files you own** and your own namespace files.
4. Do not add dependencies.

## Japanese style

Natural, concise UI Japanese as used by Japanese job sites:
- Sentences use です/ます.
- Buttons and labels are short noun or verb phrases (保存, 応募済みにする, 求人を探す).
- Use full-width punctuation (、。) in Japanese sentences; keep half-width digits.
- Keep `{{placeholders}}` exactly.

Glossary (use consistently):

| English | 日本語 |
|---|---|
| job / job posting | 求人 |
| job description | 求人内容 |
| employer / company | 企業 |
| location | 勤務地 |
| salary | 給与（年収） |
| remote / hybrid / onsite | リモート / ハイブリッド / 出社 |
| apply / applied | 応募する / 応募済み |
| discovered (status) | 新着 |
| ready (status) | 応募準備完了 |
| in progress (status) | 選考中 |
| skipped | スキップ |
| interview | 面接 |
| offer | 内定 |
| rejected | お見送り |
| score / fit score | スコア / マッチ度 |
| resume / CV | レジュメ |
| 職務経歴書 (career history doc) | 職務経歴書 |
| cover letter | カバーレター |
| tailoring / tailored CV | 最適化 / 最適化したレジュメ |
| search terms | 検索キーワード |
| sources (job boards) | 求人サイト |
| pipeline run / search run | 求人検索 |
| settings | 設定 |
| onboarding | 初期設定 |
| tracking inbox | 選考メール |
| watchlist | ウォッチリスト |
| workspace | ワークスペース |

## Checking your work

```bash
node scripts/i18n-literals.mjs <your files or folders>   # should report 0 (or only i18n-ignore'd)
npm run check:types                                      # repo root
cd orchestrator && npx vitest run <your test files> src/client/i18n
./orchestrator/node_modules/.bin/biome check --write <changed files>
```

The scanner finds JSX text, user-facing attributes and toast calls. It does **not** find strings in objects, arrays or variables, so also read each file for user-visible strings it misses (label maps, option lists, error messages).
