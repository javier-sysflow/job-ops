// English strings: job list, filters, command bar, keyboard shortcuts.
const jobs = {
  header: {
    subtitle: "Orchestrator",
    cancelling: "Cancelling ({{sourceCount}})",
    cancelRun: "Cancel run",
    closeSearch: "Close search",
    findJobs: "Find jobs",
    addJob: "Add a job",
    searchRunning: "Search running",
  },
  tabs: {
    ready: "Ready",
    discovered: "Discovered",
    all: "All Jobs",
    descriptions: {
      discovered: "Jobs searched, ready to be tailored",
      ready: "Jobs with tailored CVs, ready to apply",
    },
  },
  status: {
    unknown: "Unknown",
    previouslyApplied: "Previously Applied",
  },
  list: {
    loading: "Loading jobs...",
    emptyTitle: "No jobs found",
    emptyState: {
      ready: "Run a search to discover and process new jobs.",
      discovered: "All discovered jobs have been processed.",
      all: "No jobs in the system yet. Run a search to get started.",
    },
    noDateMatches: "No jobs match the selected date filters.",
    tailorDiscovered: "Tailor discovered jobs",
    findJobs: "Find jobs",
    selectAllAria: "Select all filtered jobs",
    selectAll: "Select all filtered",
    selectedCount: "{{count}} selected",
    selectJob: "Select {{title}}",
  },
  row: {
    locationSeparator: " in ",
    generatingPdf: "Generating PDF",
    regeneratePdf: "Regenerate PDF",
  },
  score: {
    awaitingAi: "Waiting for AI scoring to finish.",
    aiError:
      "AI misconfiguration or service error. Please check your settings and AI service status.",
    aiErrorShort: "AI misconfiguration or service error.",
    suitability: "Suitability score {{score}}",
    ringLabel: "score",
    findOutWhy: "Find out why",
    viewFitAssessment: "View fit assessment",
    scoringFailed: "Scoring failed",
  },
  stats: {
    overview: "Overview",
    totalJobs: "{{count}} total jobs",
  },
  selection: {
    selectedCount: "{{count}} selected",
    moveToReady: "Move to Ready",
    skipSelected: "Skip selected",
    recalculateMatch: "Recalculate match",
    clear: "Clear",
  },
  bulkActions: {
    progress: {
      move_to_ready: "{{completed}}/{{requested}} Moving jobs to Ready...",
      skip: "{{completed}}/{{requested}} Skipping selected jobs...",
      rescore: "{{completed}}/{{requested}} Calculating match scores...",
    },
    success: {
      move_to_ready: "{{succeeded}} jobs moved to Ready",
      skip: "{{succeeded}} jobs skipped",
      rescore: "{{succeeded}} matches recalculated",
    },
    partial: "{{succeeded}} succeeded, {{failed}} failed.",
    progressCounts: "{{succeeded}} succeeded, {{failed}} failed",
    selectAllLimit: "Select all is limited to {{max}} jobs per action.",
    tooMany: "You can run job actions on up to {{max}} jobs at a time.",
    failed: "Failed to run job action",
    streamEnded: "Job action stream ended before completion",
  },
  jobToasts: {
    skipped: "Job skipped",
    skipFailed: "Failed to skip job",
    markedApplied: "Marked as applied",
    markAppliedFailed: "Failed to mark as applied",
    jobAtEmployer: "{{title}} at {{employer}}",
    movingToReady: "Moving job to Ready...",
    movedToReady: "Job moved to Ready",
    pdfGenerated: "Your tailored PDF has been generated.",
    moveToReadyFailed: "Failed to move job to ready",
    openPdfFailed: "Could not open PDF",
    downloadPdfFailed: "Could not download PDF",
  },
  pipeline: {
    cancelled: "Search cancelled",
    failed: "Search failed",
    completed: "Search completed",
    started: "Search started",
    startedDescription: "Sources: {{sources}}. This may take a few minutes.",
    startFailed: "Failed to start search",
    cancelFailed: "Failed to cancel search",
    unsupportedLocation:
      "Some selected sources do not support this location setup.",
    noCompatibleSources:
      "No compatible sources for the selected location setup. Choose another country, city, or source.",
  },
  data: {
    loadSelectedFailed: "Failed to load selected job details",
    loadFailed: "Failed to load jobs",
  },
  commandBar: {
    title: "Job Search",
    description: "Search jobs across all states by job title or company name.",
    placeholder: "Search jobs by job title or company name...",
    lockHint:
      "Use <mono>@</mono> + status + Tab/Enter to lock a status. Backspace on empty search clears the lock.",
    noResults: "No jobs found.",
    resultsAria: "Job search results",
    lockTo: "Lock to @{{lock}}",
    groups: {
      filters: "Filters",
      other: "Other",
    },
  },
  tokenizedInput: {
    more: "+{{count}} more",
  },
  filters: {
    reset: "Reset",
    toggle: "Filters",
    searchAria: "Search jobs",
    search: "Search",
    location: {
      aria: "Filter by location",
      placeholder: "Location",
      clear: "Clear location",
    },
    source: {
      label: "Source",
      all: "All sources",
    },
    posted: {
      label: "Posted",
      options: {
        hours24: "24 hours",
        days3: "3 days",
        days7: "7 days",
        days14: "14 days",
        days30: "30 days",
      },
    },
    employment: {
      label: "Employment",
      types: {
        full_time: "Full-time",
        part_time: "Part-time",
        contract: "Contract",
        internship: "Internship",
        temporary: "Temporary",
      },
    },
    dates: {
      label: "Dates",
      dimensions: {
        ready: "Ready",
        applied: "Applied",
        closed: "Closed",
        discovered: "Discovered",
      },
      presetDays: "{{days}} days",
      lastPreset: "Last {{label}}",
      startDate: "Start date",
      endDate: "End date",
      clear: "Clear date filters",
    },
    sponsor: {
      label: "Sponsor",
      options: {
        all: "All statuses",
        confirmed: "Confirmed sponsor",
        potential: "Potential sponsor",
        not_found: "Sponsor not found",
        unknown: "Unchecked sponsor",
      },
    },
    salary: {
      label: "Salary",
      prefix: "Salary is",
      modeAria: "Salary range specifier",
      modes: {
        at_least: "at least",
        at_most: "at most",
        between: "between",
      },
      minimum: "Minimum",
      maximum: "Maximum",
      minPlaceholder: "e.g. 60000",
      maxPlaceholder: "e.g. 100000",
    },
    score: {
      label: "Score",
      prefix: "Score",
      modeAria: "Score filter mode",
      modes: {
        any: "Any",
        has: "Has a score",
        missing: "No score",
      },
      minimum: "Minimum",
      maximum: "Maximum",
      minPlaceholder: "e.g. 60",
      maxPlaceholder: "e.g. 90",
    },
    sort: {
      label: "Sort",
      sortBy: "Sort by",
      fieldAria: "Sort field",
      direction: "Direction",
      directionAria: "Sort order",
      fields: {
        datePosted: "Posted",
        discoveredAt: "Discovered",
        score: "Score",
        salary: "Salary",
        title: "Title",
        employer: "Company",
      },
      directions: {
        mostRecent: "Most recent",
        leastRecent: "Least recent",
        largestFirst: "Largest first",
        smallestFirst: "Smallest first",
        aToZ: "A to Z",
        zToA: "Z to A",
      },
    },
  },
  shortcuts: {
    labels: {
      nextJob: "Next job",
      prevJob: "Previous job",
      tabReady: "Ready tab",
      tabDiscovered: "Discovered tab",
      tabAll: "All Jobs tab",
      prevTab: "Previous tab",
      nextTab: "Next tab",
      skip: "Skip job",
      moveToReady: "Move to Ready",
      markApplied: "Mark applied",
      viewPdf: "View PDF",
      downloadPdf: "Download PDF",
      openListing: "Open job listing",
      toggleSelect: "Toggle select",
      clearSelection: "Clear selection",
      search: "Search jobs",
      help: "Keyboard shortcuts",
    },
    barGroups: {
      navigation: "Navigate",
      tabs: "Tabs",
      actions: "Actions",
      meta: "General",
    },
    dialogGroups: {
      navigation: "Navigation",
      tabs: "Tabs",
      actions: "Actions",
      meta: "General",
    },
    dialog: {
      title: "Keyboard Shortcuts",
      description:
        "Available shortcuts for the current view. Press <kbd>?</kbd> to toggle this dialog.",
    },
  },
  automaticRun: {
    searchScope: {
      selected_only: {
        label: "Only selected locations",
        description: "Limit results to your chosen map area or cities.",
      },
      selected_plus_remote_worldwide: {
        label: "Selected locations + remote worldwide",
        description: "Also include remote roles available worldwide.",
      },
      remote_worldwide_prioritize_selected: {
        label: "Remote worldwide",
        description: "Search globally and prioritise your selected locations.",
      },
    },
    matchStrictness: {
      exact_only: {
        label: "Exact matches only",
        description: "Only jobs explicitly matching your selected location.",
      },
      flexible: {
        label: "Include likely matches",
        description: "Include nearby and plausibly compatible locations.",
      },
    },
    sourceStatus: {
      selectCountry: "Select country",
      selectCountryDetail:
        "Pick a country first to check whether this source is available.",
      available: "Available",
      availableWithoutCountry:
        "This source is available without a country selection.",
      blocked: "Blocked",
      glassdoorCountry: "Glassdoor is not available for the selected country.",
      needsCity: "Needs city",
      glassdoorNeedsCity:
        "Add at least one city in Location preferences to enable Glassdoor.",
      glassdoorAvailable: "Glassdoor is available for this location intent.",
      ukOnly: "UK only",
      ukOnlyDetail:
        "{{source}} is available only when country is United Kingdom.",
      notAvailableIn: "{{source}} is not available for {{country}}.",
      theSelectedCountry: "the selected country",
      availableForIntent: "Available for this location intent.",
    },
  },
};

export default jobs;
