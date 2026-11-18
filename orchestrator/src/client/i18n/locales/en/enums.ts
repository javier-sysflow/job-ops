// English strings: labels for shared enums (application stages, job statuses, outcomes).
// Keep these identical to the English labels in shared/ so existing tests
// and server-side text stay consistent.
const enums = {
  jobStatus: {
    discovered: "Discovered",
    processing: "Processing",
    ready: "Ready",
    applied: "Applied",
    in_progress: "In Progress",
    skipped: "Skipped",
    expired: "Expired",
  },
  applicationStage: {
    applied: "Applied",
    recruiter_screen: "Recruiter Screen",
    assessment: "Assessment",
    hiring_manager_screen: "Team Match",
    technical_interview: "Technical Interview",
    onsite: "Final Round",
    offer: "Offer",
    closed: "Closed",
    no_change: "No change",
  },
  // Fork: the same stages labelled as the Japanese hiring sequence, used when
  // the "Application stages" display setting is "Japanese hiring process".
  applicationStageJapanese: {
    applied: "Applied",
    recruiter_screen: "Document screening",
    assessment: "Aptitude test",
    hiring_manager_screen: "1st interview",
    technical_interview: "2nd interview",
    onsite: "Final interview",
    offer: "Offer",
    closed: "Closed",
    no_change: "No change",
  },
  outcome: {
    offer_accepted: "Offer accepted",
    offer_declined: "Offer declined",
    rejected: "Rejected",
    withdrawn: "Withdrawn",
    no_response: "No response",
    ghosted: "Ghosted",
  },
  taskType: {
    prep: "Prep",
    todo: "To do",
    follow_up: "Follow up",
    check_status: "Check status",
  },
  interviewType: {
    recruiter_screen: "Recruiter screen",
    technical: "Technical",
    onsite: "Onsite",
    panel: "Panel",
    behavioral: "Behavioral",
    final: "Final",
  },
  interviewOutcome: {
    pass: "Pass",
    fail: "Fail",
    pending: "Pending",
    cancelled: "Cancelled",
  },
  workplaceType: {
    remote: "Remote",
    hybrid: "Hybrid",
    onsite: "Onsite",
  },
  typstTheme: {
    classic: "Classic",
    "clean-print-cv": "Clean Print CV",
    compact: "Compact",
    "shokumu-keirekisho": "職務経歴書 (Japanese career history)",
  },
};

export default enums;
