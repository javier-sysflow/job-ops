import i18n from "@client/i18n";
import { stageLabel } from "@client/i18n/labels";
import type { StageEvent } from "@shared/types.js";

const getDefaultDescription = () => i18n.t("jobDetail:deleteEvent.default");

/**
 * Build a delete-confirmation description for a stage event.
 *
 * When the deleted event is the latest in the timeline, removing it will roll
 * the job's stage/status back to the previous event (or to "discovered" if it
 * was the only event). Surface that so the user knows derived state will move.
 */
export function getDeleteEventDescription(
  events: StageEvent[],
  eventToDelete: string | null,
): string {
  if (!eventToDelete) return getDefaultDescription();

  const lastEvent = events.at(-1);
  if (!lastEvent || lastEvent.id !== eventToDelete) {
    return getDefaultDescription();
  }

  const previousEvent = events.at(-2);
  if (!previousEvent) {
    return i18n.t("jobDetail:deleteEvent.onlyEvent");
  }

  const previousLabel = stageLabel(previousEvent.toStage);
  return i18n.t("jobDetail:deleteEvent.rollback", { stage: previousLabel });
}
