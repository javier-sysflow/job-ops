// English strings: tracer links.
const tracer = {
  page: {
    title: "Tracer Links",
    subtitle: "Outbound resume link analytics",
  },
  filters: {
    title: "Filters",
    fromDate: "From date",
    toDate: "To date",
    includeBots: "Include likely bots",
  },
  stats: {
    totalViews: "Total Views",
    uniqueJobsReached: "Unique Jobs Reached",
    humanClicks: "Human Clicks",
  },
  chart: {
    title: "Resume Clicks Last {{days}} Days",
    description: "Daily click activity from tracer links.",
    loading: "Loading analytics...",
    series: "Clicks",
  },
  activity: {
    title: "Application Activity",
    job: "Job",
    clicks: "Clicks",
    lastActive: "Last active",
    empty: "No tracer-link activity yet.",
  },
  drilldown: {
    title: "Job Links",
    titleWithJob: "Job Links: {{title}}",
    description: "Destination links and click activity for the selected job.",
    loading: "Loading links...",
    humanClicks: "Human clicks:",
    totalClicks: "Total clicks:",
    lastActivity: "Last activity:",
    humanOnly: "Human only",
    humanAndBots: "Human + bots",
    lastClick: "Last click: {{date}}",
    rowClicks: "{{value}} Clicks",
    inactiveLinks: "No activity yet ({{value}})",
    noLinks: "No tracer links recorded for this job yet.",
    selectJob: "Select a job from Application Activity.",
  },
  time: {
    today: "Today {{time}}",
    yesterday: "Yesterday {{time}}",
    noActivity: "No activity yet",
    justNow: "just now",
    minutesAgo_one: "{{count}} minute ago",
    minutesAgo_other: "{{count}} minutes ago",
    hoursAgo_one: "{{count}} hour ago",
    hoursAgo_other: "{{count}} hours ago",
    daysAgo_one: "{{count}} day ago",
    daysAgo_other: "{{count}} days ago",
  },
  toasts: {
    linkCopied: "Link copied",
    copyFailed: "Could not copy link",
  },
};

export default tracer;
