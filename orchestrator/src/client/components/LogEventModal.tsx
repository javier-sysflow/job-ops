import { outcomeLabel, stageLabel } from "@client/i18n/labels";
import { zodResolver } from "@hookform/resolvers/zod";
import type { ApplicationStage, StageEvent } from "@shared/types.js";
import React from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import * as z from "zod";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const createLogEventSchema = (messages: {
  titleRequired: string;
  dateRequired: string;
}) =>
  z.object({
    stage: z.string(),
    title: z.string().min(1, messages.titleRequired),
    date: z.string().min(1, messages.dateRequired),
    notes: z.string().optional(),
    reasonCode: z.string().optional(),
    salary: z.string().optional(),
  });

export type LogEventFormValues = z.infer<
  ReturnType<typeof createLogEventSchema>
>;

interface LogEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLog: (values: LogEventFormValues, eventId?: string) => Promise<void>;
  editingEvent?: StageEvent | null;
  jobTitle?: string;
  employer?: string;
}

type StageOptionValue =
  | "no_change"
  | ApplicationStage
  | "rejected"
  | "withdrawn";

const STAGE_OPTION_VALUES: StageOptionValue[] = [
  "no_change",
  "applied",
  "recruiter_screen",
  "assessment",
  "hiring_manager_screen",
  "technical_interview",
  "onsite",
  "offer",
  "rejected",
  "withdrawn",
  "closed",
];

const getStageOptions = (noStageChangeLabel: string) =>
  STAGE_OPTION_VALUES.map((value) => ({
    value,
    label:
      value === "no_change"
        ? noStageChangeLabel
        : value === "rejected" || value === "withdrawn"
          ? outcomeLabel(value)
          : stageLabel(value),
  }));

const REASON_CODES = [
  "Skills",
  "Visa",
  "Timing",
  "Culture",
  "Unknown",
] as const;

const toDateTimeLocal = (value: Date) => {
  const pad = (num: number) => String(num).padStart(2, "0");
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}T${pad(value.getHours())}:${pad(
    value.getMinutes(),
  )}`;
};

export const LogEventModal: React.FC<LogEventModalProps> = ({
  isOpen,
  onClose,
  onLog,
  editingEvent,
  jobTitle,
  employer,
}) => {
  const { t } = useTranslation(["jobDetail", "common"]);
  const logEventSchema = React.useMemo(
    () =>
      createLogEventSchema({
        titleRequired: t("logEvent.validation.titleRequired"),
        dateRequired: t("logEvent.validation.dateRequired"),
      }),
    [t],
  );
  const stageOptions = React.useMemo(
    () => getStageOptions(t("logEvent.noStageChange")),
    [t],
  );
  const defaultTitle = t("logEvent.defaultTitle");
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<LogEventFormValues>({
    resolver: zodResolver(logEventSchema),
    defaultValues: {
      stage: "no_change",
      title: defaultTitle,
      date: toDateTimeLocal(new Date()),
      notes: "",
    },
  });

  const selectedStage = watch("stage");

  React.useEffect(() => {
    if (isOpen) {
      if (editingEvent) {
        reset({
          stage: editingEvent.toStage,
          title: editingEvent.metadata?.eventLabel || "",
          date: toDateTimeLocal(new Date(editingEvent.occurredAt * 1000)),
          notes: editingEvent.metadata?.note || "",
          reasonCode: editingEvent.metadata?.reasonCode || undefined,
          salary: editingEvent.metadata?.externalUrl?.startsWith("Salary: ")
            ? editingEvent.metadata.externalUrl.replace("Salary: ", "")
            : undefined,
        });
      } else {
        reset({
          stage: "no_change",
          title: defaultTitle,
          date: toDateTimeLocal(new Date()),
          notes: "",
        });
      }
    }
  }, [isOpen, reset, editingEvent, defaultTitle]);

  React.useEffect(() => {
    // Only auto-update title if we're not editing or if the title is empty/default
    if (!editingEvent) {
      if (selectedStage === "no_change") {
        setValue("title", defaultTitle);
      } else {
        const option = stageOptions.find((o) => o.value === selectedStage);
        if (option) {
          setValue("title", option.label);
        }
      }
    }
  }, [selectedStage, setValue, editingEvent, defaultTitle, stageOptions]);

  const onSubmit = async (values: LogEventFormValues) => {
    await onLog(values, editingEvent?.id);
    onClose();
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent
        data-testid="log-event-modal"
        className="max-h-[calc(100vh-2rem)] max-w-md overflow-y-auto"
      >
        <AlertDialogHeader>
          <AlertDialogTitle>
            {editingEvent ? t("logEvent.editTitle") : t("logEvent.logTitle")}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {editingEvent
              ? t("logEvent.editDescription")
              : jobTitle
                ? employer
                  ? t("logEvent.recordForJobAtEmployer", { jobTitle, employer })
                  : t("logEvent.recordForJob", { jobTitle })
                : t("logEvent.recordGeneric")}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Field>
            <FieldLabel>{t("logEvent.newStage")}</FieldLabel>
            <Controller
              name="stage"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t("logEvent.selectStage")} />
                  </SelectTrigger>
                  <SelectContent>
                    {stageOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <FieldError errors={[errors.stage]} />
          </Field>

          <Field>
            <FieldLabel>{t("logEvent.eventTitle")}</FieldLabel>
            <Input
              {...register("title")}
              placeholder={t("logEvent.eventTitlePlaceholder")}
            />
            <FieldError errors={[errors.title]} />
          </Field>

          <Field>
            <FieldLabel>{t("logEvent.date")}</FieldLabel>
            <Input type="datetime-local" {...register("date")} />
            <FieldError errors={[errors.date]} />
          </Field>

          <Field>
            <FieldLabel>{t("logEvent.notes")}</FieldLabel>
            <Textarea
              {...register("notes")}
              placeholder={t("logEvent.notesPlaceholder")}
            />
            <FieldError errors={[errors.notes]} />
          </Field>

          {selectedStage === "rejected" && (
            <Field className="animate-in fade-in slide-in-from-top-1 duration-200">
              <FieldLabel>{t("logEvent.reason")}</FieldLabel>
              <Controller
                name="reasonCode"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t("logEvent.selectReason")} />
                    </SelectTrigger>
                    <SelectContent>
                      {REASON_CODES.map((code) => (
                        <SelectItem key={code} value={code}>
                          {t(`logEvent.reasons.${code}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
          )}

          {selectedStage === "offer" && (
            <Field className="animate-in fade-in slide-in-from-top-1 duration-200">
              <FieldLabel>{t("logEvent.salary")}</FieldLabel>
              <Input
                {...register("salary")}
                placeholder={t("logEvent.salaryPlaceholder")}
              />
            </Field>
          )}

          <AlertDialogFooter className="pt-4">
            <AlertDialogCancel type="button" onClick={onClose}>
              {t("common:actions.cancel")}
            </AlertDialogCancel>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? t("logEvent.saving")
                : editingEvent
                  ? t("logEvent.saveChanges")
                  : t("logEvent.submit")}
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
};
