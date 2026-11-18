/**
 * Shared layout components for consistent page structure.
 */

import { getAppStatus, logout } from "@client/api";
import { useQuery } from "@tanstack/react-query";
import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  BookOpen,
  type IconComponent,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  UserRound,
} from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useVersionCheck } from "../hooks/useVersionCheck";
import i18n from "../i18n";
import { queryKeys } from "../lib/queryKeys";
import {
  loadRememberedAuthUsers,
  type RememberedAuthUser,
} from "../lib/remembered-auth-users";
import { LanguageToggle } from "./LanguageToggle";
import { isNavActive, NAV_LINKS, type NavLink } from "./navigation";
import { StatusBadgeIndicator } from "./StatusIndicator";
import { ThemeToggle } from "./ThemeToggle";
import { Tip } from "./Tip";

export const AppModeContext = React.createContext({
  appMode: "local" as "local" | "hosted",
  isPending: false,
});

export const AppModeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const appStatusQuery = useQuery({
    queryKey: queryKeys.app.status(),
    queryFn: getAppStatus,
  });

  return (
    <AppModeContext.Provider
      value={{
        appMode: appStatusQuery.data?.appMode ?? "local",
        isPending: appStatusQuery.isPending,
      }}
    >
      {children}
    </AppModeContext.Provider>
  );
};

const buildSignInPath = (username: string, nextPath: string): string => {
  const params = new URLSearchParams();
  params.set("user", username);
  if (
    nextPath &&
    nextPath !== "/sign-in" &&
    !nextPath.startsWith("/sign-in?")
  ) {
    params.set("next", nextPath);
  }
  return `/sign-in?${params.toString()}`;
};

// ============================================================================
// Navigation (shared by the desktop sidebar and the mobile menu)
// ============================================================================

/** Core job-search screens; everything after them is grouped as tools. */
const PRIMARY_NAV_PATHS = new Set([
  "/overview",
  "/jobs/ready",
  "/applications/in-progress",
  "/design-resume",
]);
/** Shown in the sidebar footer instead of the main list. */
const FOOTER_NAV_PATHS = ["/guide", "/settings"];

const useNavLinks = (): NavLink[] => {
  const { appMode } = React.useContext(AppModeContext);
  return appMode === "hosted"
    ? NAV_LINKS.filter(({ to }) => to !== "/tracking-inbox")
    : NAV_LINKS;
};

interface NavItemProps {
  link: NavLink;
  active: boolean;
  collapsed?: boolean;
  onNavigate?: () => void;
}

const NavItem: React.FC<NavItemProps> = ({
  link,
  active,
  collapsed = false,
  onNavigate,
}) => {
  const { to, labelKey, icon: NavIcon } = link;
  const label = i18n.t(`shell:nav.${labelKey}`);
  const item = (
    <Link
      to={to}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      aria-label={collapsed ? label : undefined}
      className={cn(
        "group relative flex h-9 items-center gap-3 rounded-md px-2.5 text-sm font-medium outline-none transition-colors",
        "focus-visible:ring-2 focus-visible:ring-sidebar-ring",
        collapsed && "justify-center px-0",
        active
          ? "bg-card text-primary shadow-xs ring-1 ring-sidebar-border dark:bg-sidebar-accent dark:text-sidebar-accent-foreground dark:ring-0"
          : "text-sidebar-foreground/85 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
      )}
    >
      {active && (
        <span
          aria-hidden="true"
          className="absolute top-1/2 left-0 h-4 w-[3px] -translate-y-1/2 rounded-r-full bg-seal"
        />
      )}
      <NavIcon
        className={cn(
          "size-[18px] shrink-0",
          active
            ? "text-primary dark:text-sidebar-accent-foreground"
            : "text-sidebar-foreground/70 group-hover:text-sidebar-accent-foreground",
        )}
      />
      {!collapsed && <span className="truncate">{label}</span>}
    </Link>
  );

  return collapsed ? (
    <Tip asChild side="right" content={label} clickBehavior="none">
      {item}
    </Tip>
  ) : (
    item
  );
};

interface NavListProps {
  collapsed?: boolean;
  onNavigate?: () => void;
}

const NavList: React.FC<NavListProps> = ({ collapsed, onNavigate }) => {
  const location = useLocation();
  const links = useNavLinks().filter(
    ({ to }) => !FOOTER_NAV_PATHS.includes(to),
  );
  const primary = links.filter(({ to }) => PRIMARY_NAV_PATHS.has(to));
  const tools = links.filter(({ to }) => !PRIMARY_NAV_PATHS.has(to));

  const renderGroup = (group: NavLink[]) =>
    group.map((link) => (
      <NavItem
        key={link.to}
        link={link}
        collapsed={collapsed}
        onNavigate={onNavigate}
        active={isNavActive(location.pathname, link.to, link.activePaths)}
      />
    ));

  return (
    <div className="flex flex-col gap-0.5">
      {renderGroup(primary)}
      {tools.length > 0 && (
        <div
          aria-hidden="true"
          className="mx-2.5 my-2 h-px bg-sidebar-border"
        />
      )}
      {renderGroup(tools)}
    </div>
  );
};

const FooterNavItems: React.FC<NavListProps> = ({ collapsed, onNavigate }) => {
  const location = useLocation();
  const links = FOOTER_NAV_PATHS.flatMap(
    (path) => NAV_LINKS.find(({ to }) => to === path) ?? [],
  );
  return (
    <>
      {links.map((link) => (
        <NavItem
          key={link.to}
          link={link}
          collapsed={collapsed}
          onNavigate={onNavigate}
          active={isNavActive(location.pathname, link.to, link.activePaths)}
        />
      ))}
    </>
  );
};

interface AccountMenuProps {
  collapsed?: boolean;
  onBeforeAction?: () => void;
}

const AccountMenu: React.FC<AccountMenuProps> = ({
  collapsed = false,
  onBeforeAction,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [rememberedUsers, setRememberedUsers] = useState<RememberedAuthUser[]>(
    () => loadRememberedAuthUsers(),
  );

  const handleRememberedUserClick = async (username: string) => {
    onBeforeAction?.();
    await logout({ redirect: false });
    navigate(buildSignInPath(username, location.pathname), { replace: true });
  };

  const handleSignOut = async () => {
    onBeforeAction?.();
    await logout();
  };

  return (
    <DropdownMenu
      onOpenChange={(open) => {
        if (open) setRememberedUsers(loadRememberedAuthUsers());
      }}
    >
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          aria-label={collapsed ? i18n.t("shell:header.account") : undefined}
          className={cn(
            "h-9 w-full justify-start gap-3 px-2.5 text-sidebar-foreground/85 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            collapsed && "justify-center px-0",
          )}
        >
          <UserRound className="size-[18px]! text-sidebar-foreground/70" />
          {!collapsed && <span>{i18n.t("shell:header.account")}</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        side={collapsed ? "right" : "top"}
        className="w-56"
      >
        <DropdownMenuLabel>
          {i18n.t("shell:header.remembered")}
        </DropdownMenuLabel>
        {rememberedUsers.length > 0 ? (
          rememberedUsers.map((user) => (
            <DropdownMenuItem
              key={user.username}
              onSelect={() => void handleRememberedUserClick(user.username)}
              className="flex min-w-0 items-start gap-2"
            >
              <UserRound className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span className="min-w-0">
                <span className="block truncate font-medium">
                  {user.displayName ?? user.username}
                </span>
                {user.displayName ? (
                  <span className="block truncate text-xs text-muted-foreground">
                    {user.username}
                  </span>
                ) : null}
              </span>
            </DropdownMenuItem>
          ))
        ) : (
          <DropdownMenuItem disabled>
            {i18n.t("shell:header.rememberedEmpty")}
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() => void handleSignOut()}
          className="gap-2"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>{i18n.t("shell:header.signOut")}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

interface SidebarFooterRowProps {
  collapsed?: boolean;
  onBeforeAction?: () => void;
  /** Collapse toggle for the desktop sidebar; omitted in the mobile menu. */
  collapseToggle?: React.ReactNode;
}

const SidebarFooterRow: React.FC<SidebarFooterRowProps> = ({
  collapsed = false,
  onBeforeAction,
  collapseToggle,
}) => {
  const { version, updateAvailable } = useVersionCheck();
  const docsButton = (
    <Tip
      asChild
      side={collapsed ? "right" : "top"}
      clickBehavior="none"
      content={i18n.t("shell:header.documentation")}
    >
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={i18n.t("shell:header.documentation")}
        onClick={() => {
          onBeforeAction?.();
          window.open("/docs", "_blank", "noopener,noreferrer");
        }}
        className="h-8 w-8 shrink-0 text-muted-foreground hover:bg-sidebar-accent"
      >
        <BookOpen />
      </Button>
    </Tip>
  );

  if (collapsed) {
    return (
      <div className="flex flex-col items-center gap-0.5 pt-1">
        {docsButton}
        {collapseToggle}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 pt-1 pl-2.5">
      <a
        href="https://github.com/DaKheera47/job-ops/releases"
        target="_blank"
        rel="noopener noreferrer"
        className="mr-auto flex min-w-0 items-center gap-2 rounded-sm text-xs text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className="truncate">
          {i18n.t("shell:header.version", { version })}
        </span>
        {updateAvailable && (
          <Tip
            asChild
            content={<p>{i18n.t("shell:header.updateAvailable")}</p>}
          >
            <span className="h-2 w-2 shrink-0 cursor-pointer rounded-full bg-emerald-500" />
          </Tip>
        )}
      </a>
      {docsButton}
      {collapseToggle}
    </div>
  );
};

const BrandMark: React.FC<{ collapsed?: boolean }> = ({ collapsed }) => (
  <Link
    to="/jobs/ready"
    aria-label="JobOps" // i18n-ignore
    className={cn(
      "flex min-w-0 items-center gap-2.5 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
      collapsed && "justify-center",
    )}
  >
    <img src="/favicon.png" alt="" className="size-8 shrink-0 rounded-lg" />
    {!collapsed && (
      <span className="truncate text-[15px] font-semibold tracking-tight text-foreground">
        JobOps{/* i18n-ignore */}
      </span>
    )}
  </Link>
);

// ============================================================================
// App Shell (persistent sidebar on desktop)
// ============================================================================

const SIDEBAR_COLLAPSED_KEY = "jobops.sidebarCollapsed";

const readSidebarCollapsed = (): boolean => {
  try {
    return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "1";
  } catch {
    return false;
  }
};

/** Below this width the desktop sidebar shows as an icon rail. */
const WIDE_SIDEBAR_QUERY = "(min-width: 1280px)";

const matchesQuery = (query: string): boolean =>
  typeof window !== "undefined" && typeof window.matchMedia === "function"
    ? window.matchMedia(query).matches
    : true;

const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState(() => matchesQuery(query));
  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const media = window.matchMedia(query);
    const onChange = () => setMatches(media.matches);
    onChange();
    media.addEventListener?.("change", onChange);
    return () => media.removeEventListener?.("change", onChange);
  }, [query]);
  return matches;
};

/** Lets page headers know a desktop sidebar already provides navigation. */
const AppShellContext = React.createContext({ hasSidebar: false });

interface AppShellProps {
  /** Off for screens that should not show navigation (sign-in, onboarding). */
  enabled: boolean;
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ enabled, children }) => {
  const [collapsedPreference, setCollapsed] = useState(readSidebarCollapsed);
  // Small laptops get the icon rail so pages keep their working width.
  const isWide = useMediaQuery(WIDE_SIDEBAR_QUERY);
  const collapsed = collapsedPreference || !isWide;

  const toggleCollapsed = () => {
    setCollapsed((current) => {
      const next = !current;
      try {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? "1" : "0");
      } catch {
        // Storage unavailable: the choice lasts for this visit only.
      }
      return next;
    });
  };

  if (!enabled) return <div>{children}</div>;

  return (
    <AppShellContext.Provider value={{ hasSidebar: true }}>
      <div
        className={cn(
          "lg:flex",
          collapsed
            ? "lg:[--app-sidebar-width:4.25rem]"
            : "lg:[--app-sidebar-width:15rem]",
        )}
      >
        <aside
          aria-label={i18n.t("shell:header.mainNavigation")}
          className="sticky top-0 z-30 hidden h-dvh w-[var(--app-sidebar-width)] shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200 ease-out lg:flex"
        >
          <div
            className={cn(
              "flex h-[4.3125rem] shrink-0 items-center border-b border-sidebar-border px-4",
              collapsed && "justify-center px-0",
            )}
          >
            <BrandMark collapsed={collapsed} />
          </div>
          <nav className="flex-1 overflow-y-auto px-3 py-3">
            <NavList collapsed={collapsed} />
          </nav>
          <div className="flex shrink-0 flex-col gap-0.5 border-t border-sidebar-border px-3 py-3">
            <FooterNavItems collapsed={collapsed} />
            <AccountMenu collapsed={collapsed} />
            <SidebarFooterRow
              collapsed={collapsed}
              collapseToggle={
                !isWide ? null : (
                  <Tip
                    asChild
                    side="right"
                    clickBehavior="none"
                    content={
                      collapsed
                        ? i18n.t("shell:header.expandSidebar")
                        : i18n.t("shell:header.collapseSidebar")
                    }
                  >
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={toggleCollapsed}
                      aria-label={
                        collapsed
                          ? i18n.t("shell:header.expandSidebar")
                          : i18n.t("shell:header.collapseSidebar")
                      }
                      aria-expanded={!collapsed}
                      className="h-8 w-8 shrink-0 text-muted-foreground hover:bg-sidebar-accent"
                    >
                      {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
                    </Button>
                  </Tip>
                )
              }
            />
          </div>
        </aside>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </AppShellContext.Provider>
  );
};

// ============================================================================
// Page Header
// ============================================================================

interface PageHeaderProps {
  icon: IconComponent | React.FC<{ className?: string }>;
  title: string;
  subtitle: string;
  badge?: string;
  statusIndicator?: React.ReactNode;
  actions?: React.ReactNode;
  showVersionFooter?: boolean;
  navOpen?: boolean;
  onNavOpenChange?: (open: boolean) => void;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  icon: Icon,
  title,
  subtitle,
  badge,
  statusIndicator,
  actions,
  showVersionFooter = true,
  navOpen: controlledNavOpen,
  onNavOpenChange,
}) => {
  const [internalNavOpen, setInternalNavOpen] = useState(false);
  const navOpen = controlledNavOpen ?? internalNavOpen;
  const setNavOpen = onNavOpenChange ?? setInternalNavOpen;
  const { hasSidebar } = React.useContext(AppShellContext);
  const closeNav = () => setNavOpen(false);

  useEffect(() => {
    if (!navOpen) return;
    const media = window.matchMedia?.("(min-width: 1024px)");
    if (!hasSidebar || !media) return;
    // The sidebar takes over on wide screens; drop a menu left open.
    const onChange = () => media.matches && setNavOpen(false);
    media.addEventListener?.("change", onChange);
    return () => media.removeEventListener?.("change", onChange);
  }, [hasSidebar, navOpen, setNavOpen]);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md supports-[backdrop-filter]:bg-background/75">
      <div className="container mx-auto flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <Sheet open={navOpen} onOpenChange={setNavOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn("-ml-2 shrink-0", hasSidebar && "lg:hidden")}
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">
                  {i18n.t("shell:header.openNavigation")}
                </span>
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="flex w-72 flex-col gap-0 bg-sidebar p-0 text-sidebar-foreground"
            >
              <SheetHeader className="h-[4.3125rem] shrink-0 justify-center border-b border-sidebar-border px-4 text-left">
                <SheetTitle className="sr-only">
                  JobOps{/* i18n-ignore */}
                </SheetTitle>
                <BrandMark />
              </SheetHeader>
              <nav className="flex-1 overflow-y-auto px-3 py-3">
                <NavList onNavigate={closeNav} />
              </nav>
              <div className="flex shrink-0 flex-col gap-0.5 border-t border-sidebar-border px-3 py-3">
                <FooterNavItems onNavigate={closeNav} />
                <AccountMenu onBeforeAction={closeNav} />
                {showVersionFooter && (
                  <SidebarFooterRow onBeforeAction={closeNav} />
                )}
              </div>
            </SheetContent>
          </Sheet>

          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-primary shadow-xs">
            <Icon className="size-[18px]" />
          </div>
          <div className="min-w-0 leading-tight">
            <h1 className="truncate text-[15px] font-semibold tracking-tight">
              {title}
            </h1>
            <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
          </div>
          {badge && (
            <Badge variant="outline" className="uppercase tracking-wide">
              {badge}
            </Badge>
          )}
          {statusIndicator}
        </div>

        <div className="flex w-full min-w-0 flex-wrap items-center gap-2 sm:w-auto sm:flex-nowrap sm:justify-end">
          {actions}
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
};

export const StatusIndicator = StatusBadgeIndicator;

// ============================================================================
// Split Layout (List + Detail panels)
// ============================================================================

interface SplitLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export const SplitLayout: React.FC<SplitLayoutProps> = ({
  children,
  className,
}) => (
  <section
    className={cn(
      "grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)]",
      className,
    )}
  >
    {children}
  </section>
);

// ============================================================================
// List Panel (left side of split)
// ============================================================================

interface ListPanelProps {
  children: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export const ListPanel: React.FC<ListPanelProps> = ({
  children,
  header,
  footer,
  className,
}) => (
  <div
    className={cn(
      "min-w-0 rounded-xl border border-border bg-card shadow-xs flex flex-col",
      className,
    )}
  >
    {header && <div className="border-b border-border px-4 py-3">{header}</div>}
    <div className="flex-1 divide-y divide-border/70 overflow-y-auto">
      {children}
    </div>
    {footer && <div className="border-t border-border px-4 py-2">{footer}</div>}
  </div>
);

// ============================================================================
// List Item (clickable row in list)
// ============================================================================

interface ListItemProps {
  selected?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
}

export const ListItem: React.FC<ListItemProps> = ({
  selected,
  onClick,
  children,
  className,
}) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      "flex w-full items-start gap-4 px-4 py-3 text-left transition-colors",
      selected ? "bg-accent" : "hover:bg-muted/60",
      className,
    )}
    aria-pressed={selected}
  >
    {children}
  </button>
);

// ============================================================================
// Detail Panel (right side of split)
// ============================================================================

interface DetailPanelProps {
  children: React.ReactNode;
  className?: string;
  sticky?: boolean;
}

export const DetailPanel: React.FC<DetailPanelProps> = ({
  children,
  className,
  sticky = true,
}) => (
  <div
    className={cn(
      "min-w-0 rounded-xl border border-border bg-card p-4 shadow-xs",
      sticky && "lg:sticky lg:top-24 lg:self-start",
      className,
    )}
  >
    {children}
  </div>
);

// ============================================================================
// Empty State
// ============================================================================

interface EmptyStateProps {
  icon?: IconComponent;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
}) => (
  <div className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
    {Icon && (
      <div className="mb-2 flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Icon className="size-6" />
      </div>
    )}
    <div className="text-base font-semibold">{title}</div>
    {description && (
      <p className="max-w-md text-sm text-muted-foreground">{description}</p>
    )}
    {action && <div className="mt-2">{action}</div>}
  </div>
);

// ============================================================================
// Score Meter
// ============================================================================

interface ScoreMeterProps {
  score: number | null;
  showLabel?: boolean;
}

const getScoreTokens = (score: number) => {
  if (score >= 90) return { bar: "bg-emerald-500/80" };
  if (score >= 70) return { bar: "bg-amber-500/80" };
  if (score >= 50) return { bar: "bg-orange-500/80" };
  return { bar: "bg-rose-500/80" };
};

export const ScoreMeter: React.FC<ScoreMeterProps> = ({
  score,
  showLabel = true,
}) => {
  if (score == null) {
    return (
      <span className="text-xs text-muted-foreground">
        {i18n.t("shell:scoreMeter.notScored")}
      </span>
    );
  }

  const tokens = getScoreTokens(score);
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <div className="h-1.5 w-12 rounded-full bg-muted">
        <div
          className={cn("h-1.5 rounded-full", tokens.bar)}
          style={{ width: `${Math.max(4, Math.min(100, score))}%` }}
        />
      </div>
      {showLabel && (
        <span className="tabular-nums text-foreground">{score}%</span>
      )}
    </div>
  );
};

// ============================================================================
// Full Height Split Layout (for pages like VisaSponsors that use full viewport)
// ============================================================================

interface FullHeightSplitProps {
  sidebar: React.ReactNode;
  sidebarWidth?: string;
  children: React.ReactNode;
}

export const FullHeightSplit: React.FC<FullHeightSplitProps> = ({
  sidebar,
  sidebarWidth = "lg:w-[420px]",
  children,
}) => (
  <div className="flex flex-1 flex-col overflow-hidden lg:flex-row">
    <div
      className={cn(
        "flex w-full flex-col border-b lg:border-b-0 lg:border-r",
        sidebarWidth,
      )}
    >
      {sidebar}
    </div>
    <div className="flex-1 overflow-y-auto">{children}</div>
  </div>
);

// ============================================================================
// Section Card (for forms, stats, etc.)
// ============================================================================

interface SectionCardProps {
  children: React.ReactNode;
  className?: string;
}

export const SectionCard: React.FC<SectionCardProps> = ({
  children,
  className,
}) => (
  <section
    className={cn(
      "rounded-xl border border-border bg-card p-4 shadow-xs",
      className,
    )}
  >
    {children}
  </section>
);

// ============================================================================
// Page Main Content Wrapper
// ============================================================================

interface PageMainProps {
  children: React.ReactNode;
  className?: string;
}

export const PageMain: React.FC<PageMainProps> = ({ children, className }) => (
  <main
    className={cn("container mx-auto space-y-6 px-4 py-6 pb-12", className)}
  >
    {children}
  </main>
);
