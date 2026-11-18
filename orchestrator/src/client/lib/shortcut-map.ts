import i18n from "@client/i18n";
import { getMetaShortcutLabel } from "@client/lib/meta-key";
import type { FilterTab } from "@client/pages/orchestrator/constants";

// ─── Types ───────────────────────────────────────────────────────────────────

export type ShortcutGroup = "navigation" | "actions" | "tabs" | "meta";

export interface ShortcutDef {
  /** tinykeys key descriptor, e.g. "j", "Shift+S", "$mod+K" */
  key: string;
  /** Human-readable key label shown in the UI, e.g. "j", "Shift+S", "Cmd+K" */
  displayKey: string;
  /** Short description shown in hints/help */
  label: string;
  /** Grouping for the help dialog */
  group: ShortcutGroup;
  /** Tabs where the shortcut is active. undefined = all tabs. */
  scope?: FilterTab[];
}

// ─── Definitions ─────────────────────────────────────────────────────────────

// Labels are getters so they are translated when read (at render time).

export const SHORTCUTS = {
  // Navigation
  nextJob: {
    key: "j",
    displayKey: "j",
    get label() {
      return i18n.t("jobs:shortcuts.labels.nextJob");
    },
    group: "navigation",
  },
  nextJobArrow: {
    key: "ArrowDown",
    displayKey: "\u2193",
    get label() {
      return i18n.t("jobs:shortcuts.labels.nextJob");
    },
    group: "navigation",
  },
  prevJob: {
    key: "k",
    displayKey: "k",
    get label() {
      return i18n.t("jobs:shortcuts.labels.prevJob");
    },
    group: "navigation",
  },
  prevJobArrow: {
    key: "ArrowUp",
    displayKey: "\u2191",
    get label() {
      return i18n.t("jobs:shortcuts.labels.prevJob");
    },
    group: "navigation",
  },

  // Tabs
  tabReady: {
    key: "1",
    displayKey: "1",
    get label() {
      return i18n.t("jobs:shortcuts.labels.tabReady");
    },
    group: "tabs",
  },
  tabDiscovered: {
    key: "2",
    displayKey: "2",
    get label() {
      return i18n.t("jobs:shortcuts.labels.tabDiscovered");
    },
    group: "tabs",
  },
  tabAll: {
    key: "3",
    displayKey: "3",
    get label() {
      return i18n.t("jobs:shortcuts.labels.tabAll");
    },
    group: "tabs",
  },
  prevTabArrow: {
    key: "ArrowLeft",
    displayKey: "\u2190",
    get label() {
      return i18n.t("jobs:shortcuts.labels.prevTab");
    },
    group: "tabs",
  },
  nextTabArrow: {
    key: "ArrowRight",
    displayKey: "\u2192",
    get label() {
      return i18n.t("jobs:shortcuts.labels.nextTab");
    },
    group: "tabs",
  },

  // Context actions
  skip: {
    key: "s",
    displayKey: "s",
    get label() {
      return i18n.t("jobs:shortcuts.labels.skip");
    },
    group: "actions",
    scope: ["discovered", "ready"],
  },
  moveToReady: {
    key: "r",
    displayKey: "r",
    get label() {
      return i18n.t("jobs:shortcuts.labels.moveToReady");
    },
    group: "actions",
    scope: ["discovered"],
  },
  markApplied: {
    key: "a",
    displayKey: "a",
    get label() {
      return i18n.t("jobs:shortcuts.labels.markApplied");
    },
    group: "actions",
    scope: ["ready"],
  },
  viewPdf: {
    key: "p",
    displayKey: "p",
    get label() {
      return i18n.t("jobs:shortcuts.labels.viewPdf");
    },
    group: "actions",
    scope: ["ready"],
  },
  downloadPdf: {
    key: "d",
    displayKey: "d",
    get label() {
      return i18n.t("jobs:shortcuts.labels.downloadPdf");
    },
    group: "actions",
    scope: ["ready"],
  },
  openListing: {
    key: "o",
    displayKey: "o",
    get label() {
      return i18n.t("jobs:shortcuts.labels.openListing");
    },
    group: "actions",
  },
  toggleSelect: {
    key: "x",
    displayKey: "x",
    get label() {
      return i18n.t("jobs:shortcuts.labels.toggleSelect");
    },
    group: "actions",
  },
  clearSelection: {
    key: "Escape",
    displayKey: "Esc",
    get label() {
      return i18n.t("jobs:shortcuts.labels.clearSelection");
    },
    group: "actions",
  },

  // Meta
  search: {
    key: "$mod+k",
    displayKey: "$mod+K",
    get label() {
      return i18n.t("jobs:shortcuts.labels.search");
    },
    group: "meta",
  },
  searchSlash: {
    key: "/",
    displayKey: "/",
    get label() {
      return i18n.t("jobs:shortcuts.labels.search");
    },
    group: "meta",
  },
  help: {
    key: "Shift+?",
    displayKey: "?",
    get label() {
      return i18n.t("jobs:shortcuts.labels.help");
    },
    group: "meta",
  },
} as const satisfies Record<string, ShortcutDef>;

export type ShortcutId = keyof typeof SHORTCUTS;

// ─── Utilities ───────────────────────────────────────────────────────────────

/**
 * Return shortcuts that are active for the given tab, grouped by category.
 * Useful for rendering the bottom hint bar.
 */
export function getShortcutsForTab(tab: FilterTab): ShortcutDef[] {
  return (Object.values(SHORTCUTS) as ShortcutDef[]).filter(
    (s) => !s.scope || s.scope.includes(tab),
  );
}

/**
 * Group an array of ShortcutDefs by their `group` field.
 */
export function groupShortcuts(
  defs: ShortcutDef[],
): Record<ShortcutGroup, ShortcutDef[]> {
  const result: Record<ShortcutGroup, ShortcutDef[]> = {
    navigation: [],
    tabs: [],
    actions: [],
    meta: [],
  };
  for (const def of defs) {
    result[def.group].push(def);
  }
  return result;
}

/**
 * Get the platform-correct display label for a shortcut definition.
 */
export function getDisplayKey(def: ShortcutDef): string {
  if (def.displayKey.includes("$mod+")) {
    return getMetaShortcutLabel(def.displayKey.replace("$mod+", ""));
  }
  return def.displayKey;
}

/**
 * Deduplicate shortcuts that share the same label (e.g. j and ArrowDown both
 * map to "Next job"). Keeps the first occurrence and appends alternative
 * display keys.
 */
export interface DisplayShortcut {
  displayKeys: string[];
  label: string;
  group: ShortcutGroup;
}

export function dedupeShortcuts(defs: ShortcutDef[]): DisplayShortcut[] {
  const seen = new Map<string, DisplayShortcut>();
  const result: DisplayShortcut[] = [];
  for (const def of defs) {
    const displayKey = getDisplayKey(def);
    const existing = seen.get(def.label);
    if (existing) {
      existing.displayKeys.push(displayKey);
    } else {
      const entry: DisplayShortcut = {
        displayKeys: [displayKey],
        label: def.label,
        group: def.group,
      };
      seen.set(def.label, entry);
      result.push(entry);
    }
  }
  return result;
}
