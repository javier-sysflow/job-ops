import { useTranslation } from "react-i18next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface AutomaticRankingPreferencesCardProps {
  scoringInstructions: string;
  onScoringInstructionsChange: (value: string) => void;
}

export function AutomaticRankingPreferencesCard({
  scoringInstructions,
  onScoringInstructionsChange,
}: AutomaticRankingPreferencesCardProps) {
  const { t } = useTranslation("pipeline");
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-3">
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold text-muted-foreground">
            3
          </span>
          <div className="flex min-w-0 flex-col gap-1">
            <CardTitle>{t("ranking.title")}</CardTitle>
            <CardDescription>{t("ranking.description")}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <Label htmlFor="scoring-instructions">{t("ranking.label")}</Label>
        <Textarea
          id="scoring-instructions"
          aria-label={t("ranking.ariaLabel")}
          value={scoringInstructions}
          onChange={(event) => onScoringInstructionsChange(event.target.value)}
          placeholder={t("ranking.placeholder")}
          className="min-h-28 resize-y"
          maxLength={4000}
        />
        <p className="text-xs leading-5 text-muted-foreground">
          {t("ranking.hint")}
        </p>
      </CardContent>
    </Card>
  );
}
