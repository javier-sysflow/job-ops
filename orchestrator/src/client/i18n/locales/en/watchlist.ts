// English strings: watchlist.
const watchlist = {
  page: {
    title: "Watchlist",
    subtitle: "Career pages you're watching",
  },
  toasts: {
    saveSourcesFailed: "Failed to save watchlist sources",
    ignoreFailed: "Failed to ignore watchlist job",
    restoreFailed: "Failed to restore watchlist job",
    prepareFailed: "Failed to prepare watchlist job",
  },
  errors: {
    sourceMissingUrl: "Source {{index}} is missing a {{label}}.",
    customSourceUrl: "custom source URL",
    sourceNotSelected: "Source {{index}} is not selected.",
    sourceUnavailable: "Source {{index}} is no longer available.",
    duplicateUrls: "Choose unique watchlist URLs.",
  },
  sources: {
    title: "Watched sources",
    description:
      "Pick the company boards you want to monitor manually or add your own supported careers URL.",
    lastCheckedWithNew:
      "Last checked {{date}} · {{newCount}} new since {{previous}}",
    lastCheckedFirst: "Last checked {{date}} · First check saved your baseline",
    addSource: "Add source",
    saveSources: "Save sources",
    customSource: "Custom source",
    careersFallback: "Careers",
    newSource: "New Source",
    viewWebsite: "View website",
    removeSource: "Remove watchlist source {{index}}",
    chooseCompany: "Choose company",
    searchCompanies: "Search companies...",
    noCompanies: "No companies found.",
    sourceAria: "Watchlist source {{index}}",
    customSourceUrl: "Custom source URL",
    customUrlAria: "{{label}} {{index}}",
    empty: "No watchlist sources selected yet.",
    status: {
      watching: "Watching",
      watchingTooltip:
        "This source matches your saved watchlist settings and is currently being monitored.",
      unsaved: "Unsaved",
      unsavedTooltip:
        "This source has local changes that have not been saved yet, so watchlist monitoring is not using this version.",
    },
  },
  results: {
    checking: "Checking",
    error: "Error",
    careersPage: "{{label}} Careers Page",
    fetchingJobs: "Fetching jobs...",
    loadFailedTitle: "Couldn't load jobs",
    fetchFailed: "Couldn’t fetch jobs from this careers page.",
    loadFailedHint:
      "This source failed to load, but the rest of your watchlist can still be checked.",
    technicalDetails: "Technical details",
    jobsCount: "{{value}} jobs",
    jobsCountWithHidden: "{{value}} jobs ({{hidden}} ignored hidden)",
    showIgnoredAria: "Show ignored watchlist jobs",
    showIgnored: "Show ignored",
    columns: {
      job: "Job",
      company: "Company",
      location: "Location",
      posted: "Posted",
      actions: "Actions",
    },
  },
  job: {
    signals: {
      inWorkspace: "Already in workspace",
      ignored: "Ignored",
      searchMatch: "{{term}} search match ({{score}})",
      locationMatch: "Location match",
      remoteMatch: "Remote match",
      newSinceLastCheck: "New since last check",
    },
    viewSignals: "View signals for {{title}}",
    unknownLocation: "Unknown",
    viewInWorkspace: "View in JobOps workspace",
    moveToWorkspace: "Move to JobOps workspace",
    moreActions: "More actions",
    jobDescription: "Job description",
    unignore: "Unignore",
    viewOnCareersPage: "View on careers page",
    ignore: "Ignore",
    descriptionTitle: "{{title}} job description",
  },
};

export default watchlist;
