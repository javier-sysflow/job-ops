import type { BranchInfo } from "@shared/types";
import type React from "react";
import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight } from "@/components/icons";

type BranchNavigatorProps = {
  branchInfo: BranchInfo;
  onSwitch: (messageId: string) => void;
};

export const BranchNavigator: React.FC<BranchNavigatorProps> = ({
  branchInfo,
  onSwitch,
}) => {
  const { t } = useTranslation("jobDetail");
  const { siblingIds, activeIndex } = branchInfo;
  const total = siblingIds.length;
  const canGoLeft = activeIndex > 0;
  const canGoRight = activeIndex < total - 1;

  return (
    <div className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground">
      <button
        type="button"
        disabled={!canGoLeft}
        onClick={() => canGoLeft && onSwitch(siblingIds[activeIndex - 1])}
        className="rounded p-0.5 hover:bg-muted/60 disabled:cursor-default disabled:opacity-30"
        aria-label={t("aiAssist.previousVariant")}
      >
        <ChevronLeft className="h-3 w-3" />
      </button>
      <span className="tabular-nums">
        {activeIndex + 1}/{total}
      </span>
      <button
        type="button"
        disabled={!canGoRight}
        onClick={() => canGoRight && onSwitch(siblingIds[activeIndex + 1])}
        className="rounded p-0.5 hover:bg-muted/60 disabled:cursor-default disabled:opacity-30"
        aria-label={t("aiAssist.nextVariant")}
      >
        <ChevronRight className="h-3 w-3" />
      </button>
    </div>
  );
};
