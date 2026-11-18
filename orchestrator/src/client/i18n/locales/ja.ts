import type { en } from "./en";
import common from "./ja/common";
import enums from "./ja/enums";
import errors from "./ja/errors";
import inProgress from "./ja/inProgress";
import jobDetail from "./ja/jobDetail";
import jobs from "./ja/jobs";
import manualImport from "./ja/manualImport";
import onboarding from "./ja/onboarding";
import overview from "./ja/overview";
import pipeline from "./ja/pipeline";
import resumeStudio from "./ja/resumeStudio";
import settings from "./ja/settings";
import shell from "./ja/shell";
import tracer from "./ja/tracer";
import tracking from "./ja/tracking";
import visa from "./ja/visa";
import watchlist from "./ja/watchlist";
import welcome from "./ja/welcome";

export const ja: typeof en = {
  common,
  shell,
  onboarding,
  enums,
  errors,
  jobs,
  jobDetail,
  pipeline,
  resumeStudio,
  manualImport,
  settings,
  overview,
  inProgress,
  tracking,
  tracer,
  visa,
  watchlist,
  welcome,
};
