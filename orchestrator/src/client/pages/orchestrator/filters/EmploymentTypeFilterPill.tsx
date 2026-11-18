import i18n from "@client/i18n";
import type React from "react";
import { Briefcase } from "@/components/icons";
import { Checkbox } from "@/components/ui/checkbox";
import { employmentTypeOptions } from "../constants";
import { FilterPill } from "./FilterPill";
import type { EmploymentTypeFilterPillProps } from "./types";

export const EmploymentTypeFilterPill: React.FC<
  EmploymentTypeFilterPillProps
> = ({ employmentTypes, onEmploymentTypesChange }) => (
  <FilterPill
    icon={<Briefcase />}
    label={i18n.t("jobs:filters.employment.label")}
    active={employmentTypes.length > 0}
    badge={employmentTypes.length}
  >
    <div className="space-y-2">
      {employmentTypeOptions.map((option) => {
        const checked = employmentTypes.includes(option.value);
        const inputId = `employment-${option.value}`;
        return (
          <label
            key={option.value}
            htmlFor={inputId}
            className="flex cursor-pointer items-center gap-2 text-sm"
          >
            <Checkbox
              id={inputId}
              checked={checked}
              onCheckedChange={(next) => {
                const isChecked = next === true;
                onEmploymentTypesChange(
                  isChecked
                    ? [...employmentTypes, option.value]
                    : employmentTypes.filter((type) => type !== option.value),
                );
              }}
            />
            <span>{option.label}</span>
          </label>
        );
      })}
    </div>
  </FilterPill>
);
