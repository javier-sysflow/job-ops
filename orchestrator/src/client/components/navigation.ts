import {
  Columns3,
  Compass,
  Eye,
  FilePenLine,
  Home,
  Inbox,
  LayoutDashboard,
  Link2,
  Settings,
  Shield,
} from "@/components/icons";
import type shell from "../i18n/locales/en/shell";

/** Key under `shell:nav`; render with `t(\`nav.${labelKey}\`)`. */
export type NavLabelKey = keyof typeof shell.nav;

export type NavLink = {
  to: string;
  labelKey: NavLabelKey;
  icon: typeof Home;
  activePaths?: string[];
};

export const NAV_LINKS: NavLink[] = [
  { to: "/overview", labelKey: "overview", icon: Home },
  {
    to: "/jobs/ready",
    labelKey: "jobs",
    icon: LayoutDashboard,
    activePaths: [
      "/jobs/ready",
      "/jobs/discovered",
      "/jobs/applied",
      "/jobs/all",
    ],
  },
  {
    to: "/applications/in-progress",
    labelKey: "inProgress",
    icon: Columns3,
    activePaths: ["/applications/in-progress"],
  },
  {
    to: "/design-resume",
    labelKey: "resumeStudio",
    icon: FilePenLine,
    activePaths: ["/design-resume"],
  },
  { to: "/tracking-inbox", labelKey: "trackingInbox", icon: Inbox },
  {
    to: "/tracer-links",
    labelKey: "tracerLinks",
    icon: Link2,
    activePaths: ["/tracer-links"],
  },
  { to: "/visa-sponsors", labelKey: "visaSponsors", icon: Shield },
  { to: "/watchlist", labelKey: "watchlist", icon: Eye },
  { to: "/guide", labelKey: "guide", icon: Compass },
  { to: "/settings", labelKey: "settings", icon: Settings },
];

export const isNavActive = (
  pathname: string,
  to: string,
  activePaths?: string[],
) => {
  if (pathname === to) return true;
  if (!activePaths) return false;
  return activePaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
};
