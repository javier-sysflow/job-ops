// English strings: search runs: automatic run tab, sources, progress cards, run history.
const pipeline = {
  listSeparator: ", ",
  automatic: {
    tabs: {
      describe: "Describe search",
      details: "Configure details",
    },
    backToDescribe: "Describe search",
    title: "Configure your search",
    intro:
      "Tell Job Ops what matters, review the plan, then search your selected sources.",
    fallbackAlert:
      "AI couldn’t build this search. Review the existing details or try again.",
    searchNotes: "Search notes ({{total}})",
    errors: {
      startFailed: "Failed to start search",
      planFailed: "Failed to generate search settings",
    },
  },
  prompt: {
    title: "Find your next role",
    intro:
      "Tell us what you’re looking for. We’ll prepare a search you can review.",
    label: "What kind of jobs are you looking for?",
    placeholder:
      "Backend roles in Manchester. Hybrid or remote, using TypeScript or Python.",
    tryLabel: "Try:",
    examples: {
      backend: {
        label: "Backend roles",
        prompt:
          "Backend engineering jobs in Manchester. Prefer TypeScript or Python and hybrid or remote roles.",
      },
      graduate: {
        label: "Graduate jobs",
        prompt:
          "Graduate software engineering jobs in Manchester. Prefer backend or API work and hybrid or remote roles.",
      },
      internships: {
        label: "Paid internships",
        prompt:
          "Paid data analyst internships in the UK. Prefer roles using SQL, Python, or dashboards.",
      },
    },
    building: "Building your search…",
    build: "Build my search",
    configureManually: "Enter search details instead",
    nothingRuns: "Nothing runs until you start the search.",
  },
  terms: {
    title: "What roles are you looking for?",
    description:
      "Add the titles a job board would recognise. Alternatives widen coverage.",
    label: "Search terms",
    placeholder: "Type and press Enter",
    helper: "Separate multiple titles with commas or press Enter.",
    depth: "Search depth",
  },
  presets: {
    fast: {
      label: "Fast",
      description: "A quicker first pass.",
    },
    balanced: {
      label: "Balanced",
      description: "Strong everyday coverage.",
    },
    detailed: {
      label: "Detailed",
      description: "Broader, deeper discovery.",
    },
    custom: {
      label: "Custom",
      description: "Keep your own run settings.",
    },
  },
  location: {
    title: "Where can you work?",
    description: "Choose a location model and the work arrangements you want.",
    detectedTitle: "Detected from your browser",
    detectedBody:
      "We detected <country>{{country}}</country> as a helpful starting point. Apply it to unlock country-specific sources, or choose another country.",
    useSuggestion: "Use suggestion",
    searchArea: "Search area",
    modes: {
      radius: {
        label: "Map radius",
        description: "Search around a point you choose on the map.",
      },
      cities: {
        label: "Manual cities",
        description: "Enter the exact cities each source should search.",
      },
    },
    country: "Country",
    selectCountry: "Select country",
    searchCountry: "Search country...",
    noCountries: "No matching countries.",
    countryRequiredWithSuggestion:
      "Select a country or use the browser suggestion.",
    countryRequired: "Select a country.",
    cities: "Cities",
    citiesPlaceholder: 'e.g. "London"',
    removeCity: "Remove city",
    workArrangement: "Work arrangement",
    workplaceRequired: "Select at least one workplace type.",
  },
  workplace: {
    remote: {
      label: "Remote",
      description: "Work away from an office.",
    },
    hybrid: {
      label: "Hybrid",
      description: "Split home and office time.",
    },
    onsite: {
      label: "On-site",
      ariaLabel: "Onsite",
      description: "Primarily based at the workplace.",
    },
  },
  radius: {
    countryNotDetected: "The country at this map point could not be detected.",
    geolocationUnavailable: "Location is not available in this browser.",
    geolocationFailed: "Your location could not be read.",
    loadingMap: "Loading map…",
    useMapCentre: "Use map centre",
    useMyLocation: "Use my location",
    help: "Click the map to place the centre. Drag the centre or edge handle to adjust the search area.",
    centreRequired: "Select a centre point on the map.",
    detectedCountry: "Detected country",
    detecting: "Detecting…",
    notDetected: "Not detected",
    radiusMiles: "Radius in miles",
  },
  advanced: {
    ariaLabel: "Run settings",
    title: "Advanced search settings",
    locationScope: "Location scope",
    matchStrictness: "Match strictness",
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
    strictness: {
      exact_only: {
        label: "Exact matches only",
        description: "Only jobs explicitly matching your selected location.",
      },
      flexible: {
        label: "Include likely matches",
        description: "Include nearby and plausibly compatible locations.",
      },
    },
    topN: "Resumes tailored",
    minScore: "Min suitability score",
    runBudget: "Max jobs discovered",
  },
  ranking: {
    title: "What should Job Ops prioritise?",
    description:
      "These instructions affect ranking, not discovery. Write them in plain English.",
    label: "Your ideal role",
    ariaLabel: "Ranking preferences",
    placeholder:
      "For example: Prioritise backend API work, visa sponsorship and roles above £40k.",
    hint: "Applied to scoring for this search only.",
  },
  sources: {
    title: "Where should Job Ops search?",
    description:
      "Review the sources that are ready for this location and search.",
    reviewAria: "Review and edit sources",
    chooseSources: "Choose sources for this run",
    sourcesSelected_one: "{{count}} source selected",
    sourcesSelected_other: "{{count}} sources selected",
    selectedBadge: "{{total}} selected",
    availableBadge: "{{total}} available",
    unavailableBadge: "{{total}} unavailable",
    selectedGroup: "Selected",
    availableGroup: "Available",
    unavailableGroup: "Currently unavailable",
    includedTitle: "Included in this run.",
    availableTitle: "Available for this location setup.",
    watchlist: {
      title: "Watchlist",
      selectedOf: "{{selected}} of {{total}} selected",
      loading: "Loading Watchlist sources...",
      empty:
        "No Watchlist sources saved yet. Add company career pages on the <link>Watchlist page</link> to include them in pipeline runs.",
      ariaLabel: "Watchlist: {{label}}",
      includedTitle: "Included in this run. Click to exclude.",
      excludedTitle: "Click to include in this run.",
    },
    status: {
      badge: {
        selectCountry: "Select country",
        available: "Available",
        blocked: "Blocked",
        needsCity: "Needs city",
        ukOnly: "UK only",
      },
      detail: {
        pickCountry:
          "Pick a country first to check whether this source is available.",
        availableWithoutCountry:
          "This source is available without a country selection.",
        glassdoorCountry:
          "Glassdoor is not available for the selected country.",
        glassdoorCity:
          "Add at least one city in Location preferences to enable Glassdoor.",
        glassdoorAvailable: "Glassdoor is available for this location intent.",
        available: "Available for this location intent.",
        ukOnly: "{{source}} is available only when country is United Kingdom.",
        notAvailableFor: "{{source}} is not available for {{country}}.",
        notAvailableForSelected:
          "{{source}} is not available for the selected country.",
      },
    },
  },
  savedSearches: {
    label: "Saved searches",
    loading: "Loading...",
    placeholder: "Select saved search",
    saveAs: "Save as",
    update: "Update",
    delete: "Delete saved search",
    dialog: {
      updateTitle: "Update saved search",
      createTitle: "Save search",
      description: "Save the current search setup.",
      name: "Name",
      namePlaceholder: "e.g. London platform roles",
    },
    toasts: {
      created: "Saved search created",
      updated: "Saved search updated",
      deleted: "Saved search deleted",
      createFailed: "Failed to create saved search",
      updateFailed: "Failed to update saved search",
      deleteFailed: "Failed to delete saved search",
    },
  },
  footer: {
    title: "Your search",
    review: "Review",
    ready: "Ready",
    description: "A plain-English preview of what Job Ops will do.",
    roles: "Roles",
    addRole: "Add a role",
    location: "Location",
    arrangement: "Arrangement",
    ranking: "Ranking",
    noRanking: "No extra ranking instructions",
    coverageLabel: "Coverage",
    coverage_one: "{{preset}} · {{count}} source",
    coverage_other: "{{preset}} · {{count}} sources",
    countRoles_one: "<strong>{{count}}</strong> role",
    countRoles_other: "<strong>{{count}}</strong> roles",
    countLocations_one: "<strong>{{count}}</strong> location",
    countLocations_other: "<strong>{{count}}</strong> locations",
    countLocationsPending: "<strong>…</strong> locations",
    countJobBoards_one: "<strong>{{count}}</strong> job board",
    countJobBoards_other: "<strong>{{count}}</strong> job boards",
    runSearch: "Run search",
    leaveHint: "You can leave this page after the run starts.",
  },
  summary: {
    yourSelectedArea: "your selected area",
    twoCities: "{{first}} and {{second}}",
    selectedCities: "{{total}} selected cities",
    cityInCountry: "{{city}} in {{country}}",
    twoCitiesInCountry: "{{first}} and {{second}} in {{country}}",
    selectedCitiesInCountry: "{{total}} selected cities in {{country}}",
    workplaceTypes: {
      hybrid: "hybrid",
      onsite: "onsite",
      and: "{{first}} and {{second}}",
    },
    radius_one:
      "You'll get jobs within {{count}} mile of your selected map point.",
    radius_other:
      "You'll get jobs within {{count}} miles of your selected map point.",
    radiusPlusRemote_one:
      "You'll get jobs within {{count}} mile of your selected map point plus remote jobs worldwide.",
    radiusPlusRemote_other:
      "You'll get jobs within {{count}} miles of your selected map point plus remote jobs worldwide.",
    plusRemoteTyped:
      "You'll get {{types}} jobs in {{geography}} plus remote jobs worldwide.",
    plusRemoteOnly:
      "You'll get remote jobs worldwide, including roles explicitly available in {{geography}}.",
    onlyIn: "You'll only get jobs in {{geography}}.",
    remoteFirst:
      "You'll get remote jobs worldwide, with {{geography}} favored for local roles.",
    typedFirst: "You'll get {{types}} jobs in {{geography}} first.",
    first: "You'll get jobs in {{geography}} first.",
    onlyTypedExplicit:
      "You'll only get {{types}} jobs explicitly available in {{geography}}.",
    onlyRemoteExplicit:
      "You'll only get remote jobs explicitly available in {{geography}}.",
    onlyExplicit: "You'll only get jobs explicitly available in {{geography}}.",
    flexible: "{{summary}} Likely matches are included.",
  },
  fanout: {
    titleCheck: "Browser check needed",
    titleFinishing: "Finishing discovery",
    titleSearching: "Searching jobs",
    elapsed: "{{time}} elapsed",
    stats:
      "<strong>{{termCount}}</strong> roles · <strong>{{locationCount}}</strong> locations · <strong>{{sourceCount}}</strong> job boards · <strong>{{total}}</strong> combinations",
    latestActivity: "Latest activity:",
    complete: "complete",
    searchesComplete_one: "search complete",
    searchesComplete_other: "searches complete",
    running: "running",
    check: "check",
    queued: "queued",
    results: "results",
    unique: "unique",
    progressAria:
      "{{complete}} complete, {{running}} running, {{queued}} queued",
    roleProgressAria:
      "{{role}}: {{complete}} complete, {{running}} running, {{check}} need a check, {{queued}} queued",
    challengeSkippable:
      "Solve the browser check, or keep the jobs found so far and continue with the next search.",
    challengeRequired: "Complete the browser check to continue this job board.",
    solve: "Solve",
    solving: "Solving…",
    skipSearch: "Skip this search",
    skipping: "Skipping…",
    progressByRole: "Progress by role",
    rolesQueued_one: "{{count}} role queued",
    rolesQueued_other: "{{count}} roles queued",
    rolesDone_one: "{{count}} role done",
    rolesDone_other: "{{count}} roles done",
  },
  progress: {
    stepTitles: {
      idle: "Preparing search",
      crawling: "Searching jobs",
      challenge_required: "Browser check needed",
      importing: "Importing jobs",
      scoring: "Scoring matches",
      processing: "Preparing applications",
      completed: "Search complete",
      cancelled: "Search cancelled",
      failed: "Pipeline failed",
      configuration_required: "Scoring paused",
    },
    stepLabels: {
      idle: "Connecting",
      crawling: "Searching",
      challenge_required: "Check needed",
      importing: "Importing",
      scoring: "Scoring",
      processing: "Processing",
      completed: "Complete",
      cancelled: "Cancelled",
      failed: "Failed",
      configuration_required: "Action needed",
    },
    metrics: {
      discovered: "Discovered",
      scored: "Scored",
      awaitingScore: "Awaiting score",
      prepared: "Prepared",
      exceptional: "Exceptional matches",
      toPrepare: "To prepare",
    },
    live: {
      importing: "Importing {{title}} into your workspace",
      scoring: "Ranking {{title}} against your profile",
      processing: "Preparing {{title}} for review",
    },
    elapsed: "{{time}} elapsed",
    pipelineStopped: "Pipeline stopped",
    llmConfigRequired: "LLM configuration required",
    restartScoring: "Restart scoring",
    resuming: "Resuming…",
    errors: {
      solveFailed: "Failed to solve challenge",
      skipFailed: "Failed to skip search",
      restartFailed: "Failed to restart scoring",
    },
    // Server progress text (server/pipeline/progress.ts sends these keys
    // with `messageKey` / `detailKey`). English must match the server text.
    messages: {
      ready: "Ready",
      fetchingSources: "Fetching jobs from sources...",
      fetchingSource: "Fetching jobs from {{source}}...",
      crawling:
        "Crawling jobs (list pages {{listPages}}, job pages {{jobPages}})...",
      crawlingTerms:
        "Crawling jobs (list pages {{listPages}}, job pages {{jobPages}}, terms {{termsProcessed}}/{{termsTotal}})...",
      crawlingSkipped:
        "Crawling jobs (list pages {{listPages}}, job pages {{jobPages}}, skipped {{skipped}})...",
      crawlingCards:
        "Crawling jobs (list pages {{listPages}}, job pages {{jobPages}}, cards {{cards}})...",
      crawlingTermsSkipped:
        "Crawling jobs (list pages {{listPages}}, job pages {{jobPages}}, terms {{termsProcessed}}/{{termsTotal}}, skipped {{skipped}})...",
      crawlingTermsCards:
        "Crawling jobs (list pages {{listPages}}, job pages {{jobPages}}, terms {{termsProcessed}}/{{termsTotal}}, cards {{cards}})...",
      crawlingSkippedCards:
        "Crawling jobs (list pages {{listPages}}, job pages {{jobPages}}, skipped {{skipped}}, cards {{cards}})...",
      crawlingTermsSkippedCards:
        "Crawling jobs (list pages {{listPages}}, job pages {{jobPages}}, terms {{termsProcessed}}/{{termsTotal}}, skipped {{skipped}}, cards {{cards}})...",
      foundJobs: "Found {{jobsFound}} jobs, importing to database...",
      importingJobs: "Importing jobs ({{index}}/{{total}})...",
      imported:
        "Imported {{created}} new jobs ({{skipped}} duplicates). Scoring...",
      scoringJobs: "Scoring jobs ({{index}}/{{total}})...",
      scored: "Scored {{totalScored}} jobs.",
      processingJob: "Processing job {{index}}/{{total}}...",
      complete:
        "Search complete! Discovered {{discovered}} jobs, processed {{processed}}.",
      cancelled: "Search cancelled",
      failed: "Search failed",
      configurationRequired: "Configuration required",
      challengesNeededOne:
        "{{extractors}} extractor needs a Cloudflare challenge solved",
      challengesNeededMany:
        "{{extractors}} extractors need a Cloudflare challenge solved",
      challengesRemainingOne: "{{remaining}} challenge remaining",
      challengesRemainingMany: "{{remaining}} challenges remaining",
      allChallengesSolved: "All challenges solved, resuming...",
    },
    details: {
      startingCrawler: "Starting crawler",
      runningCrawler: "Running crawler",
      listUrl: "List: {{url}}",
      jobUrl: "Job: {{url}}",
      deduplicating: "Deduplicating and saving",
      checkingDuplicates: "Checking for duplicates and saving new jobs",
      evaluatingFit: "Using AI to evaluate job fit",
      readyForManual: "Ready for manual processing",
      jobAtEmployer: "{{title}} @ {{employer}}",
      generatingSummary: "Generating summary for {{title}}...",
      generatingPdf: "Generating PDF for {{title}}...",
      jobsCompleted: "Completed {{index}}/{{total}} jobs",
      readyForReview: "Ready for review",
      rerunningExtractors: "Re-running extractors",
    },
  },
};

export default pipeline;
