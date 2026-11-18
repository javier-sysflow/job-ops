import i18n from "@client/i18n";
import type React from "react";
import { BadgeCheck } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { FilterPill } from "./FilterPill";
import { sponsorOptions } from "./filterOptions";
import type { SponsorFilterPillProps } from "./types";

export const SponsorFilterPill: React.FC<SponsorFilterPillProps> = ({
  sponsorFilter,
  onSponsorFilterChange,
  sponsorLabel,
}) => (
  <FilterPill
    icon={<BadgeCheck />}
    label={i18n.t("jobs:filters.sponsor.label")}
    active={sponsorFilter !== "all"}
    summary={sponsorLabel}
    contentClassName="w-72"
  >
    <div className="flex flex-wrap gap-2">
      {sponsorOptions.map((option) => (
        <Button
          key={option.value}
          type="button"
          size="sm"
          variant={sponsorFilter === option.value ? "default" : "outline"}
          onClick={() => onSponsorFilterChange(option.value)}
        >
          {option.label}
        </Button>
      ))}
    </div>
  </FilterPill>
);
