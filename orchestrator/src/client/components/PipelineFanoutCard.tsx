import { getUiLocale } from "@client/i18n/language";
import NumberFlow from "@number-flow/react";
import type {
  PipelineFanoutProgress,
  PipelineFanoutRoleProgress,
  PipelinePendingChallenge,
} from "@shared/types";
import { Trans, useTranslation } from "react-i18next";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { PipelineActionRequired } from "./PipelineActionRequired";

const getRoleTotal = (role: PipelineFanoutRoleProgress) =>
  role.complete + role.running + role.check + role.queued;

const Segment = ({
  className,
  count,
  total,
}: {
  className: string;
  count: number;
  total: number;
}) =>
  count > 0 ? (
    <span
      className={cn("h-full", className)}
      style={{ width: `${(count / total) * 100}%` }}
    />
  ) : null;

const RoleStatus = ({ role }: { role: PipelineFanoutRoleProgress }) => {
  const { t } = useTranslation("pipeline");
  return (
    <div className="flex flex-wrap items-center justify-start gap-x-3 gap-y-1 font-mono text-[11px] tabular-nums @lg/fanout:justify-end">
      {role.complete > 0 ? (
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
          <span className="font-semibold text-emerald-400">
            {role.complete}
          </span>
          <span className="font-sans text-muted-foreground">
            {t("fanout.complete")}
          </span>
        </span>
      ) : null}
      {role.running > 0 ? (
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
          <span className="font-semibold text-amber-400">{role.running}</span>
          <span className="font-sans text-muted-foreground">
            {t("fanout.running")}
          </span>
        </span>
      ) : null}
      {role.check > 0 ? (
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
          <span className="font-semibold text-amber-300">{role.check}</span>
          <span className="font-sans text-muted-foreground">
            {t("fanout.check")}
          </span>
        </span>
      ) : null}
      {role.queued > 0 ? (
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
          <span className="font-semibold text-muted-foreground">
            {role.queued}
          </span>
          <span className="font-sans text-muted-foreground">
            {t("fanout.queued")}
          </span>
        </span>
      ) : null}
    </div>
  );
};

const RoleRow = ({ role }: { role: PipelineFanoutRoleProgress }) => {
  const { t } = useTranslation("pipeline");
  const total = getRoleTotal(role);
  return (
    <div className="flex min-h-20 flex-col gap-3 border-b px-4 py-4 last:border-b-0">
      <div className="flex flex-col gap-2 @lg/fanout:flex-row @lg/fanout:items-center @lg/fanout:justify-between">
        <span className="text-xs font-semibold">{role.role}</span>
        <RoleStatus role={role} />
      </div>
      <div
        className="flex h-1.5 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-label={t("fanout.roleProgressAria", {
          role: role.role,
          complete: role.complete,
          running: role.running,
          check: role.check,
          queued: role.queued,
        })}
        aria-valuemax={total}
        aria-valuemin={0}
        aria-valuenow={role.complete}
      >
        <Segment
          className="bg-emerald-400"
          count={role.complete}
          total={total}
        />
        <Segment className="bg-amber-500" count={role.running} total={total} />
        <Segment className="bg-amber-300" count={role.check} total={total} />
      </div>
    </div>
  );
};

export interface PipelineFanoutCardProps {
  fanout: PipelineFanoutProgress;
  elapsedSeconds: number;
  activity?: string;
  challenges?: PipelinePendingChallenge[];
  solvingExtractor: string | null;
  skippingExtractor?: string | null;
  onSolveChallenge: (extractorId: string) => void;
  onSkipChallengeSearch?: (extractorId: string) => void;
}

const formatElapsed = (seconds: number) =>
  `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

export const PipelineFanoutCard = ({
  fanout,
  elapsedSeconds,
  activity,
  challenges = [],
  solvingExtractor,
  skippingExtractor = null,
  onSolveChallenge,
  onSkipChallengeSearch,
}: PipelineFanoutCardProps) => {
  const { t } = useTranslation("pipeline");
  const numberLocale = getUiLocale();
  const complete = fanout.roles.reduce((sum, role) => sum + role.complete, 0);
  const checks = fanout.roles.reduce((sum, role) => sum + role.check, 0);
  const running =
    checks + fanout.roles.reduce((sum, role) => sum + role.running, 0);
  const queued = fanout.roles.reduce((sum, role) => sum + role.queued, 0);
  const doneRoles = fanout.roles.filter(
    (role) => role.complete === getRoleTotal(role),
  );
  const queuedRoles = fanout.roles.filter(
    (role) => role.queued === getRoleTotal(role),
  );
  const activeRoles = fanout.roles.filter(
    (role) => !doneRoles.includes(role) && !queuedRoles.includes(role),
  );

  return (
    <Card className="@container/fanout w-full max-w-6xl overflow-hidden border-border/70 shadow-sm">
      <CardHeader className="gap-5 p-4 @lg/fanout:p-6 @3xl/fanout:p-8">
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-2 @lg/fanout:flex-row @lg/fanout:items-start @lg/fanout:justify-between">
            <CardTitle className="min-w-0 text-2xl tracking-tight">
              {challenges.length > 0
                ? t("fanout.titleCheck")
                : complete === fanout.total
                  ? t("fanout.titleFinishing")
                  : t("fanout.titleSearching")}
            </CardTitle>
            <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
              {t("fanout.elapsed", { time: formatElapsed(elapsedSeconds) })}
            </span>
          </div>
          <CardDescription className="text-base">
            <Trans
              t={t}
              i18nKey="fanout.stats"
              values={{
                termCount: fanout.termCount,
                locationCount: fanout.locationCount,
                sourceCount: fanout.sourceCount,
                total: fanout.total,
              }}
              components={{ strong: <strong className="text-foreground" /> }}
            />
          </CardDescription>
          {activity ? (
            <p className="break-words text-sm text-muted-foreground">
              <span className="font-medium">{t("fanout.latestActivity")}</span>{" "}
              {activity}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 @xl/fanout:flex-row @xl/fanout:items-end @xl/fanout:justify-between">
            <div className="flex flex-wrap items-center gap-2 font-mono text-xs tabular-nums">
              <span className="inline-flex items-baseline gap-2 whitespace-nowrap">
                <span className="font-semibold text-emerald-400">
                  {complete}
                </span>
                <span className="font-sans text-muted-foreground">
                  {challenges.length > 0
                    ? t("fanout.searchesComplete", { count: complete })
                    : t("fanout.complete")}
                </span>
              </span>
              <span className="text-muted-foreground/50">·</span>
              <span className="inline-flex items-baseline gap-2 whitespace-nowrap">
                <span className="font-semibold text-amber-400">{running}</span>
                <span className="font-sans text-muted-foreground">
                  {t("fanout.running")}
                </span>
              </span>
              <span className="text-muted-foreground/50">·</span>
              <span className="inline-flex items-baseline gap-2 whitespace-nowrap">
                <span className="font-semibold text-muted-foreground">
                  {queued}
                </span>
                <span className="font-sans text-muted-foreground">
                  {t("fanout.queued")}
                </span>
              </span>
            </div>
            <div className="flex flex-wrap items-baseline gap-2 font-mono text-xs tabular-nums">
              <span className="inline-flex items-baseline gap-2 whitespace-nowrap">
                <NumberFlow
                  className="font-semibold"
                  value={fanout.results}
                  locales={numberLocale}
                  isolate
                />
                <span className="font-sans text-muted-foreground">
                  {t("fanout.results")}
                </span>
              </span>
              <span className="text-muted-foreground/50">·</span>
              <span className="inline-flex items-baseline gap-2 whitespace-nowrap">
                <NumberFlow
                  className="font-semibold"
                  value={fanout.unique}
                  locales={numberLocale}
                  isolate
                />
                <span className="font-sans text-muted-foreground">
                  {t("fanout.unique")}
                </span>
              </span>
            </div>
          </div>
          <div
            className="flex h-2 overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-label={t("fanout.progressAria", { complete, running, queued })}
            aria-valuemax={fanout.total}
            aria-valuemin={0}
            aria-valuenow={complete}
          >
            <Segment
              className="bg-emerald-400"
              count={complete}
              total={fanout.total}
            />
            <Segment
              className="bg-amber-500"
              count={running}
              total={fanout.total}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-4 border-t p-3 @lg/fanout:p-4 @3xl/fanout:p-5">
        {challenges.map((challenge) => (
          <PipelineActionRequired
            key={challenge.extractorId}
            title={challenge.extractorName}
            description={
              challenge.canSkipSearch && challenge.solveAttempted
                ? t("fanout.challengeSkippable")
                : t("fanout.challengeRequired")
            }
            actionLabel={t("fanout.solve")}
            pendingLabel={t("fanout.solving")}
            pending={solvingExtractor === challenge.extractorId}
            onAction={() => onSolveChallenge(challenge.extractorId)}
            secondaryActionLabel={
              challenge.canSkipSearch && challenge.solveAttempted
                ? t("fanout.skipSearch")
                : undefined
            }
            secondaryPendingLabel={t("fanout.skipping")}
            secondaryPending={skippingExtractor === challenge.extractorId}
            onSecondaryAction={
              challenge.canSkipSearch && challenge.solveAttempted
                ? () => onSkipChallengeSearch?.(challenge.extractorId)
                : undefined
            }
          />
        ))}

        <section className="overflow-hidden rounded-xl border">
          <div className="flex flex-col gap-1 border-b px-4 py-4">
            <h2 className="text-sm font-semibold">
              {t("fanout.progressByRole")}
            </h2>
          </div>

          {activeRoles.map((role) => (
            <RoleRow key={role.role} role={role} />
          ))}

          {queuedRoles.length > 0 || doneRoles.length > 0 ? (
            <Accordion type="multiple">
              {queuedRoles.length > 0 ? (
                <AccordionItem value="queued-roles" className="last:border-b-0">
                  <AccordionTrigger className="min-h-14 px-4 py-3 hover:bg-muted/30 hover:no-underline">
                    <span className="flex min-w-0 flex-1 items-center justify-between gap-4 pr-2 text-sm font-semibold">
                      <span>
                        {t("fanout.rolesQueued", { count: queuedRoles.length })}
                      </span>
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-0">
                    {queuedRoles.map((role) => (
                      <RoleRow key={role.role} role={role} />
                    ))}
                  </AccordionContent>
                </AccordionItem>
              ) : null}

              {doneRoles.length > 0 ? (
                <AccordionItem value="done-roles" className="last:border-b-0">
                  <AccordionTrigger className="min-h-14 px-4 py-3 hover:bg-muted/30 hover:no-underline">
                    <span className="flex min-w-0 flex-1 items-center justify-between gap-4 pr-2 text-sm font-semibold">
                      <span>
                        {t("fanout.rolesDone", { count: doneRoles.length })}
                      </span>
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-0">
                    {doneRoles.map((role) => (
                      <RoleRow key={role.role} role={role} />
                    ))}
                  </AccordionContent>
                </AccordionItem>
              ) : null}
            </Accordion>
          ) : null}
        </section>
      </CardContent>
    </Card>
  );
};
