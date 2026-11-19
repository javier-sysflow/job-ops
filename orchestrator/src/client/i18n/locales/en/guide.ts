// English strings: the in-app guide page and the first-run welcome dialog.
const guide = {
  page: {
    title: "Guide",
    subtitle: "How to use JobOps, step by step",
    replayWelcome: "Show welcome again",
  },
  intro: {
    title: "From search to offer, in one place",
    body: "JobOps finds jobs for you, scores how well each one fits your resume, prepares a tailored resume for the best matches, and keeps track of every application. This is the usual flow.",
  },
  flow: {
    title: "The basic flow",
    stepLabel: "Step {{number}}",
    steps: {
      resume: {
        title: "Check your resume",
        body: "Your base resume drives the match scores, the tailoring and every document JobOps writes. Make sure it is complete before your first search.",
        tip1: "In Resume Studio, fill in your skills, languages and certifications.",
        tip2: "Use the Resume layout switch above the preview: 職務経歴書 for Japanese applications, English resume for English ones. With 職務経歴書, also check 履歴書 details (ふりがな, date of birth and so on).",
        action: "Open Resume Studio",
      },
      search: {
        title: "Find jobs",
        body: "On the Jobs page, press Find jobs and describe the work you want in your own words. JobOps turns it into search terms and job sites for you to review.",
        tip1: "Example: “Bilingual customer success roles in Tokyo, or fully remote.”",
        tip2: "Nothing runs until you start the search. A search takes a few minutes.",
        action: "Go to Jobs",
      },
      review: {
        title: "Review the matches",
        body: "Every job gets a match score from 0 to 100 against your resume. The best matches get a tailored resume automatically and land in Ready. The rest wait in Discovered.",
        tip1: "Open a job and read the Brief tab to see why it got its score.",
        tip2: "Move promising jobs to Ready and skip the ones you don't want.",
        action: "See discovered jobs",
      },
      apply: {
        title: "Tailor and apply",
        body: "Each job in Ready has its own tailored resume PDF. Polish it, prepare your application, then apply on the company's site.",
        tip1: "Tailoring tab: adjust the summary, skills and projects for this job.",
        tip2: "Documents: download the resume and 履歴書 PDFs. The AI writes the 履歴書's 志望動機 for this company, and you can edit or copy it. Ask Ghostwriter for a cover letter.",
        tip3: "Once you have applied, press Mark Applied so JobOps tracks it.",
        action: "See ready jobs",
      },
      track: {
        title: "Track your progress",
        body: "Applied jobs move to the In Progress board. Drag a card when you reach a new stage, or log interviews and results.",
        tip1: "The Overview page shows how many applications you send and how many get a reply.",
        action: "Open the board",
      },
    },
  },
  tools: {
    title: "More tools",
    open: "Open",
    items: {
      addJob: {
        title: "Add a job yourself",
        body: "Found a job somewhere else? On the Jobs page, press Add a job and paste its link, description or PDF.",
      },
      ghostwriter: {
        title: "Ghostwriter",
        body: "An AI writing assistant in each job's Apply tab. It already knows the job and your resume, so ask it for cover letters, answers to application questions or interview talking points.",
      },
      trackingInbox: {
        title: "Tracking Inbox",
        body: "Connect Gmail and JobOps matches replies from companies to your applications, so the timeline updates itself.",
      },
      watchlist: {
        title: "Watchlist",
        body: "Keep an eye on the career pages of companies you like and bring new openings into JobOps.",
      },
      tracerLinks: {
        title: "Tracer Links",
        body: "See when someone opens the links in the resumes you send.",
      },
      visaSponsors: {
        title: "Visa Sponsors",
        body: "Check whether a company is a registered visa sponsor in the countries JobOps has data for.",
      },
      settings: {
        title: "Settings",
        body: "Change your search defaults, scoring rules, Ghostwriter's writing style, language and time zone.",
      },
    },
  },
  tips: {
    title: "Good to know",
    language:
      "Switch between 日本語 and English with the language button at the top right.",
    theme: "The button next to it switches between light and dark mode.",
    shortcuts: "On the Jobs page, press ? to see the keyboard shortcuts.",
    score:
      "A score is a guide, not a verdict. Read the fit assessment before you skip a job you like.",
  },
  welcome: {
    title: "Welcome to JobOps",
    description: "Your whole job search in one place, in four steps.",
    steps: {
      search: {
        title: "Find",
        body: "Describe the jobs you want and start a search.",
      },
      review: {
        title: "Review",
        body: "Check the match scores and keep the jobs worth applying to.",
      },
      apply: {
        title: "Apply",
        body: "Use the tailored resume and Ghostwriter, then mark the job applied.",
      },
      track: {
        title: "Track",
        body: "Move each application through its stages on the board.",
      },
    },
    openGuide: "Read the full guide",
    start: "Start finding jobs",
    footnote: "You can open the guide again anytime from Guide in the sidebar.",
  },
};

export default guide;
