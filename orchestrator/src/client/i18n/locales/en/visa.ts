// English strings: visa sponsors.
const visa = {
  page: {
    title: "Visa Sponsors",
    subtitle: "Search sponsor data across available sources",
    updating: "Updating",
    sponsorCount: "{{value}} sponsors",
    never: "Never",
    updateList: "Update sponsor list",
  },
  search: {
    companyName: "Company name",
    placeholder: "Search for a company name...",
    hintAll:
      "Enter a company name to check if they're a licensed visa sponsor in all sources.",
    hintCountry:
      "Enter a company name to check if they're a licensed visa sponsor in the {{country}} source.",
    source: "Source",
    selectSource: "Select sponsor source",
    allSources: "All sources",
  },
  results: {
    count_one: "{{count}} result",
    count_other: "{{count}} results",
    noDataTitle: "No sponsor data available",
    noDataDescription: "The visa sponsor list hasn't been downloaded yet.",
    downloading: "Downloading...",
    downloadList: "Download List",
    searchTitle: "Search for a company",
    searchPromptAll: "Enter a company name above to search all sources.",
    searchPromptCountry:
      "Enter a company name above to search the {{country}} source.",
    noMatchesTitle: "No matches found",
    noMatchesDescription:
      'No sponsors match "{{query}}". Try a different spelling.',
  },
  detail: {
    selectTitle: "Select a company",
    selectDescription: "Pick a company from the results to see details here.",
    licensedSponsor: "Licensed Sponsor",
    match: "{{score}}% Match",
    source: "Source: {{country}}",
    location: "Location",
    licensedRoutes: "Licensed Routes ({{value}})",
    typeRating: "Type & Rating:",
    infoTitle: "What does this mean?",
    infoBody:
      "This organisation appears in the selected sponsor source and may be able to sponsor workers on the routes listed above. Always verify the latest source entry before relying on it.",
    drawerTitle: "Sponsor details",
  },
  toasts: {
    statusFailed: "Failed to fetch status",
    searchFailed: "Search failed",
    detailsFailed: "Failed to fetch details",
    updateFailed: "Update failed",
  },
};

export default visa;
