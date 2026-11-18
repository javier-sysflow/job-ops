// English strings: user-facing error messages and server error code translations.
const errors = {
  unknown: "Something went wrong. Please try again.",
  // Japanese UI: translated code message followed by the original server text.
  withServerDetail: "{{message}} ({{detail}})",
  fields: {
    jobDescription: "job description",
    jobUrl: "job URL",
    applicationUrl: "application URL",
    skillName: "skill name",
    projectName: "project name",
  },
  validation: {
    jobDescriptionRequired: "Please enter a job description before continuing.",
    skillRequired: "Please enter a skill (e.g., Python, SQL).",
    invalidField: "Please enter a valid {{label}}.",
    invalidUrl: "Please enter a valid URL.",
    passwordRequired: "Please enter a password before continuing.",
    passwordTooShort: "Password must be at least {{minimum}} characters.",
    passwordTooLong: "Password is too long.",
    passwordMaxLength: "Password must be {{maximum}} characters or fewer.",
    fieldTooLong: "{{label}} is too long.",
    fieldMaxLength: "{{label}} must be {{maximum}} characters or fewer.",
    fieldRequired: "Please enter a {{label}} before continuing.",
    requiredField: "Please fill in the required field before continuing.",
    fieldInvalidType: "Please provide a valid {{label}}.",
    checkValue: "Please check the entered value and try again.",
    fieldInvalid: "{{label}} is invalid. Please review and try again.",
  },
  // Generic API error codes (see server/infra/errors.ts).
  codes: {
    INVALID_REQUEST: "The request was invalid.",
    UNAUTHORIZED: "You need to sign in to continue.",
    FORBIDDEN: "You don't have permission to do that.",
    NOT_FOUND: "The requested item was not found.",
    REQUEST_TIMEOUT: "The request timed out. Please try again.",
    CONFLICT: "This conflicts with another change. Reload and try again.",
    UNPROCESSABLE_ENTITY:
      "The request could not be processed. Check the details and try again.",
    INTERNAL_ERROR: "The server hit an error. Please try again later.",
    UPSTREAM_ERROR:
      "An external service returned an error. Please try again later.",
    SERVICE_UNAVAILABLE:
      "The service is temporarily unavailable. Please try again later.",
  },
  // Exact English messages from the server or the browser. Each value must
  // match the original text; the Japanese file holds the translation.
  server: {
    apiRequestFailed: "API request failed",
    malformedJson: "API request failed: malformed JSON response",
    unexpectedShape: "API request failed: unexpected response shape",
    streamingUnsupported: "Streaming not supported by this browser",
    invalidCredentials: "Invalid credentials",
    authenticationRequired: "Authentication required",
    unauthorized: "Unauthorized",
    forbidden: "Forbidden",
    notFound: "Not found",
    requestTimedOut: "Request timed out",
    invalidRequestBody: "Invalid request body",
    usernameExists: "Username already exists",
    signupDisabledLocal: "Account signup is disabled on this instance",
    invalidInviteCode: "Invalid invite code",
    signupsDisabled: "Hosted signups are disabled",
    setupRequired: "Initial setup is required before sign-in",
    setupCompleted: "Initial setup has already been completed",
    setupDisabledHosted: "First-run setup is disabled in hosted mode",
    failedToFetch: "Failed to fetch",
    networkError: "NetworkError when attempting to fetch resource.",
    loadFailed: "Load failed",
  },
  // English messages with a number in them, matched by pattern.
  serverPatterns: {
    htmlInsteadOfJson:
      "Server error ({{status}}): Expected JSON but received HTML. Is the backend server running?",
    streamFailed: "Stream request failed with status {{status}}",
  },
};

export default errors;
