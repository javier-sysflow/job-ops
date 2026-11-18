// English strings: onboarding flow.
const onboarding = {
  loading: {
    preparing: "Preparing your workspace…",
    checkFailed:
      "Job Ops could not check the workspace setup. Refresh the page to try again.",
    loadingSetup: "Loading your setup…",
  },
  header: {
    title: "Set up Job Ops",
    subtitle:
      "Three focused choices, then you’re in. Search terms wait until your first run.",
  },
  account: {
    title: "Create your workspace account",
    subtitle: "This private account owns your Job Ops workspace.",
    username: "Username",
    password: "Password",
    showPassword: "Show password",
    hidePassword: "Hide password",
    create: "Create account",
    creating: "Creating account…",
    createFailed: "Could not create the workspace account",
  },
  steps: {
    profile: "Your search",
    model: "AI connection",
    resume: "Your resume",
  },
  progress: {
    label: "Setup progress",
    complete: "Complete",
    upNext: "Up next",
    locked: "Locked",
  },
  profile: {
    title: "Where do you want to work?",
    description:
      "These preferences seed new runs and help Job Ops prioritize location-aware and visa-sponsor sources. You can change them later.",
    country: "Country or market",
    selectCountry: "Select country",
    searchCountry: "Search country...",
    noCountries: "No matching countries.",
    cities: "Preferred cities or regions (optional)",
    citiesPlaceholder: "London, Manchester",
    workplaceStyle: "Workplace style",
    workplace: {
      remote: "remote",
      hybrid: "hybrid",
      onsite: "onsite",
    },
    visaTitle: "I need employer visa sponsorship",
    visaDescription:
      "Job Ops will show sponsor information and favor sponsor-aware sources when available.",
    saveAndContinue: "Save and continue",
    saveFailed: "Could not save search preferences",
  },
  model: {
    title: "Choose how Job Ops should think",
    description:
      "Pick a provider first. Job Ops saves the configuration only after the server verifies the connection.",
    connect: "Connect and continue",
    verified: "{{provider}} connection verified.",
  },
  resume: {
    loadTitle: "Load the resume Job Ops should use",
    loadDescription:
      "Upload a file or connect Reactive Resume. After parsing, you’ll review the result before anything is marked complete.",
    checkConnection: "Check connection",
    reviewEyebrow: "Resume review",
    reviewTitle: "Is this the right resume?",
    reviewDescription:
      "Confirm the parsed identity and recent experience. Completion is tied to this exact resume source, so replacing it requires confirmation again.",
    parsedFallbackName: "Parsed resume",
    reviewDetails: "Review the imported details",
    noLocation: "No location detected",
    noExperience:
      "No experience entries were detected. Open Resume Studio to correct the document before confirming.",
    parsedSuccessfully: "Parsed successfully",
    experienceCount_one: "{{count}} experience entry",
    experienceCount_other: "{{count}} experience entries",
    editInStudio: "Edit in Resume Studio",
    useThisResume: "Use this resume",
    confirmFailed: "Could not confirm this resume",
  },
  baseResume: {
    importSteps: {
      reading: "Reading file",
      preparing: "Preparing import",
      extracting: "Extracting resume text",
      building: "Building Resume Studio document",
      saving: "Saving baseline",
      finalizing: "Finalizing setup",
    },
    longRunning:
      "Still working. Larger PDFs and DOCX files can take a little longer.",
    longRunningCodex:
      "Still working. Codex imports can take around a minute for larger resumes.",
    importing: "Importing resume",
    selectedFile: "Selected resume file",
    progressLabel: "Resume import progress",
    uploadTitle: "Upload a resume file",
    uploadTitleNoRxResume: "Upload your existing resume, PDF or DOCX",
    uploadDescription:
      "Job Ops imports Reactive Resume JSON directly. PDF and DOCX files are sent to your configured AI model and stored as a local Design Resume. That resume drives job matching, fit assessment, search terms, and application workflows.",
    uploadDescriptionNoRxResume:
      "Upload your existing resume as a PDF or DOCX. Job Ops will import it and use it as the baseline for matching, fit assessment, search terms, and application workflows.",
    supportedFormats: "Supported formats: PDF, DOCX, and Reactive Resume JSON.",
    supportedFormatsNoRxResume: "Supported formats: PDF and DOCX.",
    options: {
      upload: {
        title: "Upload a file",
        description:
          "Turn a PDF, DOCX, or Reactive Resume JSON into the baseline Job Ops uses for matching and tailoring.",
      },
      rxresume: {
        title: "Use Reactive Resume",
        description:
          "Connect an existing Reactive Resume so Job Ops can assess fit and build applications from it.",
      },
    },
    uploadButton: "Upload resume file",
    ready: "Your base resume is loaded and ready.",
  },
  rxResume: {
    intro:
      "Use Reactive Resume if your current resume already lives there. Once connected, Job Ops can use that resume for matching, fit assessment, tailoring, and application workflows.",
    apiKeyLabel: "v5 API key",
    apiKeyPlaceholder: "Enter v5 API key",
    apiKeyKeep: "Leave blank to keep the saved v5 API key.",
    selfHostedTitle: "Self-hosted Reactive Resume?",
    selfHostedDescription:
      "Turn this on only if you run your own instance and need a custom base URL.",
    customUrl: "Custom URL",
    customUrlHelper:
      "Enter the root URL for your self-hosted Reactive Resume instance, such as https://resume.yourdomain.com.",
    templateTitle: "Template resume",
    templateDescription:
      "Choose the resume Job Ops should use as the source for matching, fit assessment, and tailored applications.",
    templateOptional:
      "You already have a usable resume source, so this selection stays optional.",
    verified: "Reactive Resume connection verified.",
  },
  flow: {
    modelVerified: "Model connection verified",
    modelVerifyFailed: "Failed to verify model connection",
    resumeSourceVerified: "Resume source verified",
    rxResumeSaved: "Reactive Resume saved",
    rxResumeSaveFailed: "Failed to save Reactive Resume",
    encodeFailed: "Resume file could not be encoded for upload.",
    resumeUploaded: "Resume uploaded",
    resumeReady: "Your local Resume Studio document is ready.",
    resumeReadyTypst:
      "Your local Resume Studio document is ready and PDF rendering was switched to Typst.",
    importFailed: "Failed to import resume file",
    templateSaved: "Template saved. Recheck the resume source to continue.",
    templateSaveFailed: "Failed to save selected resume",
  },
};

export default onboarding;
