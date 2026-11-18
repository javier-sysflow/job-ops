import { useTranslation } from "react-i18next";
import { ArrowRight, Loader2 } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const SEARCH_PROMPT_EXAMPLES = [
  {
    labelKey: "prompt.examples.backend.label",
    promptKey: "prompt.examples.backend.prompt",
  },
  {
    labelKey: "prompt.examples.graduate.label",
    promptKey: "prompt.examples.graduate.prompt",
  },
  {
    labelKey: "prompt.examples.internships.label",
    promptKey: "prompt.examples.internships.prompt",
  },
] as const;

interface AutomaticSearchPromptProps {
  searchPrompt: string;
  isPlanningSearch: boolean;
  onSearchPromptChange: (value: string) => void;
  onGenerateSearchPlan: () => void;
  onConfigureManually: () => void;
}

export function AutomaticSearchPrompt({
  searchPrompt,
  isPlanningSearch,
  onSearchPromptChange,
  onGenerateSearchPlan,
  onConfigureManually,
}: AutomaticSearchPromptProps) {
  const { t } = useTranslation("pipeline");
  return (
    <div className="flex w-full flex-col">
      <header className="mb-6 space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {t("prompt.title")}
        </h1>
        <p className="max-w-lg text-sm leading-6 text-muted-foreground sm:text-base">
          {t("prompt.intro")}
        </p>
      </header>

      <Label htmlFor="search-plan-prompt" className="mb-2">
        {t("prompt.label")}
      </Label>
      <Textarea
        id="search-plan-prompt"
        value={searchPrompt}
        onChange={(event) => onSearchPromptChange(event.target.value)}
        placeholder={t("prompt.placeholder")}
        className="min-h-36 resize-y rounded-lg bg-background px-4 py-3 text-base leading-7 shadow-none"
      />

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground">
          {t("prompt.tryLabel")}
        </span>
        {SEARCH_PROMPT_EXAMPLES.map((example) => (
          <Button
            key={example.labelKey}
            type="button"
            variant="outline"
            size="sm"
            className="h-7 px-2.5 text-xs font-normal"
            disabled={isPlanningSearch}
            onClick={() => onSearchPromptChange(t(example.promptKey))}
          >
            {t(example.labelKey)}
          </Button>
        ))}
      </div>

      <div className="mt-6 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button
          type="button"
          className="h-11 w-full gap-2 sm:w-auto"
          disabled={isPlanningSearch || searchPrompt.trim().length === 0}
          onClick={onGenerateSearchPlan}
        >
          {isPlanningSearch ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : null}
          {isPlanningSearch ? t("prompt.building") : t("prompt.build")}
          {!isPlanningSearch ? <ArrowRight className="h-4 w-4" /> : null}
        </Button>
        <Button
          type="button"
          variant="link"
          className="h-auto px-0 text-sm text-muted-foreground"
          disabled={isPlanningSearch}
          onClick={onConfigureManually}
        >
          {t("prompt.configureManually")}
        </Button>
      </div>
      <p className="mt-4 text-xs text-muted-foreground">
        {t("prompt.nothingRuns")}
      </p>
    </div>
  );
}
