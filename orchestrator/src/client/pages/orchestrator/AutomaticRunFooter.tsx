import { Trans, useTranslation } from "react-i18next";
import { Loader2, Sparkles } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { AutomaticPresetSelection, WorkplaceType } from "./automatic-run";

interface AutomaticRunFooterProps {
  searchTerms: string[];
  locationCount: number | null;
  locationSummary: string;
  workplaceTypes: WorkplaceType[];
  scoringInstructions: string;
  selectedPreset: AutomaticPresetSelection;
  jobBoardCount: number;
  isSaving: boolean;
  disabled: boolean;
  onRunSearch: () => void;
}

export function AutomaticRunFooter({
  searchTerms,
  locationCount,
  locationSummary,
  workplaceTypes,
  scoringInstructions,
  selectedPreset,
  jobBoardCount,
  isSaving,
  disabled,
  onRunSearch,
}: AutomaticRunFooterProps) {
  const { t } = useTranslation("pipeline");
  const presetLabel = t(`presets.${selectedPreset}.label`);
  const listSeparator = t("listSeparator");
  const countStrong = (
    <strong className="font-semibold tabular-nums text-foreground" />
  );
  return (
    <Card className="h-fit">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle>{t("footer.title")}</CardTitle>
          <Badge variant={disabled ? "outline" : "secondary"}>
            {disabled ? t("footer.review") : t("footer.ready")}
          </Badge>
        </div>
        <CardDescription>{t("footer.description")}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-0">
        <SummaryRow
          label={t("footer.roles")}
          value={
            searchTerms.length > 0
              ? searchTerms.join(listSeparator)
              : t("footer.addRole")
          }
        />
        <Separator />
        <SummaryRow label={t("footer.location")} value={locationSummary} />
        <Separator />
        <SummaryRow
          label={t("footer.arrangement")}
          value={workplaceTypes
            .map((value) => t(`workplace.${value}.label`))
            .join(listSeparator)}
        />
        <Separator />
        <SummaryRow
          label={t("footer.ranking")}
          value={scoringInstructions || t("footer.noRanking")}
          muted={!scoringInstructions}
        />
        <Separator />
        <SummaryRow
          label={t("footer.coverageLabel")}
          value={t("footer.coverage", {
            preset: presetLabel,
            count: jobBoardCount,
          })}
        />
        <p
          data-testid="search-count-summary"
          className="mt-2 text-sm text-muted-foreground"
        >
          <Trans
            t={t}
            i18nKey="footer.countRoles"
            count={searchTerms.length}
            components={{ strong: countStrong }}
          />
          {" · "}
          {locationCount === null ? (
            <Trans
              t={t}
              i18nKey="footer.countLocationsPending"
              components={{ strong: countStrong }}
            />
          ) : (
            <Trans
              t={t}
              i18nKey="footer.countLocations"
              count={locationCount}
              components={{ strong: countStrong }}
            />
          )}
          {" · "}
          <Trans
            t={t}
            i18nKey="footer.countJobBoards"
            count={jobBoardCount}
            components={{ strong: countStrong }}
          />
        </p>
      </CardContent>
      <CardFooter className="flex-col items-stretch gap-2">
        <Button type="button" disabled={disabled} onClick={onRunSearch}>
          {isSaving ? (
            <Loader2 data-icon="inline-start" className="animate-spin" />
          ) : (
            <Sparkles data-icon="inline-start" />
          )}
          {t("footer.runSearch")}
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          {t("footer.leaveHint")}
        </p>
      </CardFooter>
    </Card>
  );
}

function SummaryRow({
  label,
  value,
  muted = false,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1 py-3">
      <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </span>
      <span className={cn("text-sm", muted && "text-muted-foreground")}>
        {value}
      </span>
    </div>
  );
}
