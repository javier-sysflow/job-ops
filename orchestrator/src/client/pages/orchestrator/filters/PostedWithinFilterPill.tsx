import i18n from "@client/i18n";
import { Clock } from "lucide-react";
import type React from "react";
import { Button } from "@/components/ui/button";
import { postedWithinOptions } from "../constants";
import { FilterPill } from "./FilterPill";
import type { PostedWithinFilterPillProps } from "./types";

export const PostedWithinFilterPill: React.FC<PostedWithinFilterPillProps> = ({
  postedWithinDays,
  onPostedWithinChange,
  postedWithinLabel,
}) => (
  <FilterPill
    icon={<Clock />}
    label={i18n.t("jobs:filters.posted.label")}
    active={postedWithinDays != null}
    summary={postedWithinLabel}
  >
    <div className="flex flex-wrap gap-2">
      {postedWithinOptions.map((option) => (
        <Button
          key={option.value}
          type="button"
          size="sm"
          variant={postedWithinDays === option.value ? "default" : "outline"}
          onClick={() =>
            onPostedWithinChange(
              postedWithinDays === option.value ? null : option.value,
            )
          }
        >
          {option.label}
        </Button>
      ))}
    </div>
  </FilterPill>
);
