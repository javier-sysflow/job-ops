// English strings: manual job import.
const manualImport = {
  sheet: {
    title: "Add a job",
    description:
      "Add a link, description, or PDF. Review the details before adding the job.",
  },
  steps: {
    progress: "Step {{current}} of {{total}}",
    addJd: "Add JD",
    addUrls: "Add URLs",
    review: "Review & import",
  },
  fields: {
    title: {
      label: "Title",
      placeholder: "e.g. Junior Backend Engineer",
    },
    employer: {
      label: "Employer",
      placeholder: "e.g. Acme Labs",
    },
    jobDescription: {
      label: "Description",
      placeholder: "Paste the job description...",
    },
    jobUrl: {
      label: "Job URL",
      placeholder: "https://...",
    },
    location: {
      label: "Location",
      placeholder: "e.g. London, UK",
    },
    salary: {
      label: "Salary",
      placeholder: "e.g. GBP 45k-55k",
    },
    jobType: {
      label: "Job type",
      placeholder: "e.g. Full-time",
    },
    jobLevel: {
      label: "Job level",
      placeholder: "e.g. Graduate",
    },
    jobFunction: {
      label: "Job function",
      placeholder: "e.g. Software Engineering",
    },
    disciplines: {
      label: "Disciplines",
      placeholder: "e.g. Computer Science",
    },
    deadline: {
      label: "Deadline",
      placeholder: "e.g. 30 Sep 2025",
    },
    degreeRequired: {
      label: "Degree required",
      placeholder: "e.g. BSc or MSc",
    },
    starting: {
      label: "Starting",
      placeholder: "e.g. September 2026",
    },
    applicationLink: {
      label: "Application URL",
      placeholder: "https://...",
    },
  },
  paste: {
    modes: {
      single: "Single job",
      urlList: "URL list",
    },
    jobUrls: "Job URLs",
    upTo: "Up to {{max}}",
    urlListHint:
      "Paste one public job URL per line. Each page is fetched and analyzed before you review the results.",
    analyzeUrlList: "Analyze URL list",
    jobUrl: "Job URL",
    optionalHelper: "Optional helper",
    fetching: "Fetching...",
    fetch: "Fetch",
    fetchHint:
      "Fetch tries to copy the job text into the description field. If the site blocks simple fetching, paste the description manually.",
    jobDescription: "Job description",
    descriptionPlaceholder:
      "Paste the full job description here, or fetch it from a URL above...",
    analyzeJd: "Analyze JD",
    fetchNotice: "Fetched the page text. Review it below, then analyze.",
  },
  loading: {
    title: "Analyzing job description",
    description: "Extracting title, company, location, and other details.",
  },
  bulkLoading: {
    title: "Analyzing URL list",
    description:
      "Fetching and analyzing each job one at a time. This may take a moment.",
    progress: "{{done}} of {{total}} processed",
  },
  review: {
    title: "Review job details",
    description:
      "AI extracted these from the job description. Review anything missing or odd before importing.",
    required: {
      title: "Required",
      description:
        "Title, employer, job URL, and description are needed to import.",
    },
    other: {
      title: "Other details",
      description: "Useful if available; blank fields can be added later.",
    },
    tailorLabel: "Tailor automatically after import",
    tailorHint:
      "Off saves LLM tokens — the job lands in Discovered and you can tailor it later from the job detail view. Default comes from Settings → Display.",
    editJd: "Edit JD",
    importing: "Importing...",
    importAndTailor: "Import & tailor",
    importWithoutTailoring: "Import without tailoring",
    status: {
      review: "Review",
      looksGood: "Looks good",
      add: "Add",
    },
  },
  bulkReview: {
    title: "Review URL list",
    description:
      "Review the fields AI found before importing the successful rows. Failed URLs stay listed so you can retry them separately.",
    status: {
      ready: "Ready",
      imported: "Imported",
      failed: "Failed",
    },
    tailorHint:
      "Turn this off to save LLM tokens and leave jobs in Discovered.",
    editUrls: "Edit URLs",
    importReady: "Import ready jobs",
  },
  errors: {
    autofetchBlocked:
      "Auto-fetch is not supported for {{site}} links. Paste the job description manually.",
    autofetchBlockedShort: "Auto-fetch is not supported for {{site}} links.",
    fetchFailed:
      "Couldn't fetch this URL automatically. Paste the job description manually.",
    pasteDescription: "Paste a job description to continue.",
    analyzeFailed: "Failed to analyze job description",
    invalidLines_one: "Line {{lines}} is not valid http(s) URL.",
    invalidLines_other: "Lines {{lines}} are not valid http(s) URLs.",
    noUrls: "Paste at least one job URL to continue.",
    tooManyUrls: "Paste no more than {{max}} URLs at a time.",
    analyzeUrlFailed: "Could not analyze this URL.",
    importFailed: "Import failed.",
    importJobFailed: "Failed to import job",
    bulkFailed_one: "{{count}} URL could not be imported",
    bulkFailed_other: "{{count}} URLs could not be imported",
  },
  toasts: {
    imported: "Job imported",
    importedWithoutTailoring:
      "Saved to Discovered without tailoring. You can tailor it anytime from the job detail view.",
    importedTailored: "The job was tailored and moved to the ready column.",
    bulkImported_one: "Imported {{count}} job",
    bulkImported_other: "Imported {{count}} jobs",
  },
};

export default manualImport;
