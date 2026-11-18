// English strings: in-progress (kanban) board.
const inProgress = {
  page: {
    title: "In Progress Board",
    subtitle: "Kanban view of application stages",
  },
  sort: {
    recent: "Recent",
    title: "Title",
    company: "Company",
  },
  board: {
    loading: "Loading board...",
    laneLabel: "{{stage}} lane",
    expandApplied: "Expand Applied lane",
    collapseApplied: "Collapse Applied lane",
    emptyLane: "Drop a card here or log a stage.",
  },
  toasts: {
    loadFailed: "Failed to load in-progress board",
    movedTo: "Moved to {{stage}}",
    moveFailed: "Failed to move stage",
    eventLogged: "Event logged",
    logFailed: "Failed to log event",
  },
  card: {
    actionsFor: "Actions for {{title}}",
    logEvent: "Log event",
    updated: "Updated {{date}}",
    noEvents: "No stage events yet",
  },
};

export default inProgress;
