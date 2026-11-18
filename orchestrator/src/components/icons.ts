/**
 * App icon set: MingCute (https://github.com/mingcute-design/mingcute-icons),
 * Core Regular style, bundled from @mingcute/react.
 *
 * Exports keep the lucide-react names the app used before, so call sites only
 * had to change their import path. Pick icons at https://www.mingcute.com/ and
 * add them here under a descriptive name. Each line imports one icon file
 * directly, so the bundle only contains the icons listed below.
 *
 * Icons are decorative by default (aria-hidden). Size them with Tailwind
 * classes (h-4 w-4 / size-4) and colour them with text-* classes; they paint
 * with currentColor.
 */
import type { IconProps } from "@mingcute/react";
import type { ForwardRefExoticComponent, RefAttributes, SVGProps } from "react";

/** Any icon component from this module. */
export type IconComponent = ForwardRefExoticComponent<
  Omit<IconProps, "ref"> & RefAttributes<SVGSVGElement>
>;
/** Alias kept for code written against lucide-react. */
export type LucideIcon = IconComponent;
export type LucideProps = SVGProps<SVGSVGElement> & { size?: number | string };

export { default as Plus } from "@mingcute/react/core-regular/add";
export { default as PlusCircle } from "@mingcute/react/core-regular/add-circle";
export { default as AlertTriangle } from "@mingcute/react/core-regular/alert";
export { default as Archive } from "@mingcute/react/core-regular/archive";
export { default as ArrowDown } from "@mingcute/react/core-regular/arrow-down";
export { default as ArrowLeft } from "@mingcute/react/core-regular/arrow-left";
export { default as ArrowRight } from "@mingcute/react/core-regular/arrow-right";
export { default as Paperclip } from "@mingcute/react/core-regular/attachment";
export { default as Award } from "@mingcute/react/core-regular/award";
export { default as ArrowDownAZ } from "@mingcute/react/core-regular/az-sort-ascending-letters";
export { default as Undo2 } from "@mingcute/react/core-regular/back-2";
export { default as Bold } from "@mingcute/react/core-regular/bold";
export { default as BookOpen } from "@mingcute/react/core-regular/book-6";
export { default as BookmarkPlus } from "@mingcute/react/core-regular/bookmark-add";
export { default as Briefcase } from "@mingcute/react/core-regular/briefcase";
export { default as BriefcaseBusiness } from "@mingcute/react/core-regular/briefcase-2";
export { default as Building2 } from "@mingcute/react/core-regular/building-2";
export { default as Lightbulb } from "@mingcute/react/core-regular/bulb";
export { default as Calendar } from "@mingcute/react/core-regular/calendar";
export { default as CalendarDays } from "@mingcute/react/core-regular/calendar-month";
export {
  default as Banknote,
  default as DollarSign,
} from "@mingcute/react/core-regular/cash";
export { default as BadgeCheck } from "@mingcute/react/core-regular/certificate";
export { default as ChartColumn } from "@mingcute/react/core-regular/chart-column-big";
export { default as BarChart3 } from "@mingcute/react/core-regular/chart-vertical";
export { default as Check } from "@mingcute/react/core-regular/check";
export {
  default as CheckCircle,
  default as CheckCircle2,
} from "@mingcute/react/core-regular/check-circle";
export { default as Chrome } from "@mingcute/react/core-regular/chrome";
export { default as CircleUserRound } from "@mingcute/react/core-regular/circle-user";
export { default as ClipboardList } from "@mingcute/react/core-regular/clipboard";
export { default as X } from "@mingcute/react/core-regular/close";
export {
  default as CircleX,
  default as XCircle,
} from "@mingcute/react/core-regular/close-circle";
export { default as Columns3 } from "@mingcute/react/core-regular/columns-3";
export { default as Compass } from "@mingcute/react/core-regular/compass";
export { default as Copy } from "@mingcute/react/core-regular/copy";
export { default as Trash2 } from "@mingcute/react/core-regular/delete-2";
export { default as FileText } from "@mingcute/react/core-regular/document";
export { default as GripHorizontal } from "@mingcute/react/core-regular/dot-grid";
export { default as GripVertical } from "@mingcute/react/core-regular/dots";
export { default as ChevronDown } from "@mingcute/react/core-regular/down";
export { default as Download } from "@mingcute/react/core-regular/download";
export { default as PenSquare } from "@mingcute/react/core-regular/edit";
export { default as Eraser } from "@mingcute/react/core-regular/eraser";
export { default as LogOut } from "@mingcute/react/core-regular/exit";
export {
  default as ExternalLink,
  default as ExternalLinkIcon,
} from "@mingcute/react/core-regular/external-link";
export { default as Eye } from "@mingcute/react/core-regular/eye-2";
export { default as EyeOff } from "@mingcute/react/core-regular/eye-2-off";
export { default as Glasses } from "@mingcute/react/core-regular/eyeglass";
export { default as File } from "@mingcute/react/core-regular/file";
export { default as FileCheck2 } from "@mingcute/react/core-regular/file-check";
export { default as FileDown } from "@mingcute/react/core-regular/file-download";
export { default as FileImage } from "@mingcute/react/core-regular/file-image";
export { default as Import } from "@mingcute/react/core-regular/file-import";
export { default as FilePenLine } from "@mingcute/react/core-regular/file-pen-line";
export { default as FileSpreadsheet } from "@mingcute/react/core-regular/file-spreadsheet";
export { default as Filter } from "@mingcute/react/core-regular/filter";
export { default as FlaskConical } from "@mingcute/react/core-regular/flask";
export { default as Folder } from "@mingcute/react/core-regular/folder";
export { default as FolderInput } from "@mingcute/react/core-regular/folder-input";
export { default as FolderKanban } from "@mingcute/react/core-regular/folder-kanban";
export { default as ShieldBan } from "@mingcute/react/core-regular/forbid-circle";
export { default as Redo2 } from "@mingcute/react/core-regular/forward-2";
export { default as Maximize2 } from "@mingcute/react/core-regular/fullscreen-2";
export { default as Minimize2 } from "@mingcute/react/core-regular/fullscreen-exit-2";
export { default as GitCompareArrows } from "@mingcute/react/core-regular/git-compare";
export { default as Github } from "@mingcute/react/core-regular/github";
export { default as Google } from "@mingcute/react/core-regular/google";
export { default as Users } from "@mingcute/react/core-regular/group";
export { default as HeartHandshake } from "@mingcute/react/core-regular/handshake";
export { default as Activity } from "@mingcute/react/core-regular/heartbeat";
export { default as History } from "@mingcute/react/core-regular/history";
export { default as Home } from "@mingcute/react/core-regular/home-4";
export { default as ImagePlus } from "@mingcute/react/core-regular/image-plus";
export { default as Inbox } from "@mingcute/react/core-regular/inbox";
export { default as Info } from "@mingcute/react/core-regular/information";
export { default as Italic } from "@mingcute/react/core-regular/italic";
export { default as KeyRound } from "@mingcute/react/core-regular/key-2";
export { default as Keyboard } from "@mingcute/react/core-regular/keyboard";
export { default as LayoutDashboard } from "@mingcute/react/core-regular/layout-grid";
export { default as PanelLeftClose } from "@mingcute/react/core-regular/layout-leftbar-close";
export { default as PanelLeftOpen } from "@mingcute/react/core-regular/layout-leftbar-open";
export { default as PanelRightOpen } from "@mingcute/react/core-regular/layout-rightbar-open";
export { default as ChevronLeft } from "@mingcute/react/core-regular/left";
export { default as Link } from "@mingcute/react/core-regular/link";
export { default as Link2 } from "@mingcute/react/core-regular/link-2";
export { default as List } from "@mingcute/react/core-regular/list-check";
export { default as ListChecks } from "@mingcute/react/core-regular/list-check-2";
export { default as ListOrdered } from "@mingcute/react/core-regular/list-ordered";
export { default as ListPlus } from "@mingcute/react/core-regular/list-plus";
export { default as Loader2 } from "@mingcute/react/core-regular/loading";
export { default as LocateFixed } from "@mingcute/react/core-regular/locate";
export { default as MapPin } from "@mingcute/react/core-regular/location";
export { default as LockKeyhole } from "@mingcute/react/core-regular/lock";
export { default as Mail } from "@mingcute/react/core-regular/mail";
export { default as MailCheck } from "@mingcute/react/core-regular/mail-check";
export { default as MailWarning } from "@mingcute/react/core-regular/mail-warning";
export { default as Menu } from "@mingcute/react/core-regular/menu";
export { default as MessageSquareText } from "@mingcute/react/core-regular/message-square-text";
export { default as Minus } from "@mingcute/react/core-regular/minimize";
export { default as Moon } from "@mingcute/react/core-regular/moon";
export { default as MoreHorizontal } from "@mingcute/react/core-regular/more-1";
export { default as MoreVertical } from "@mingcute/react/core-regular/more-2";
export { default as GraduationCap } from "@mingcute/react/core-regular/mortarboard";
export { default as ScrollText } from "@mingcute/react/core-regular/paper";
export { default as Pause } from "@mingcute/react/core-regular/pause";
export {
  default as Edit2,
  default as Pencil,
} from "@mingcute/react/core-regular/pencil";
export { default as PhoneCall } from "@mingcute/react/core-regular/phone-call";
export { default as ImageIcon } from "@mingcute/react/core-regular/pic";
export { default as Play } from "@mingcute/react/core-regular/play";
export { default as Unplug } from "@mingcute/react/core-regular/plugin";
export { default as Presentation } from "@mingcute/react/core-regular/presentation-2";
export { default as Quote } from "@mingcute/react/core-regular/quote-left";
export { default as RefreshCw } from "@mingcute/react/core-regular/refresh-2";
export {
  default as RefreshCcw,
  default as RotateCcw,
} from "@mingcute/react/core-regular/refresh-anticlockwise-1";
export { default as ChevronRight } from "@mingcute/react/core-regular/right";
export { default as Bot } from "@mingcute/react/core-regular/robot";
export { default as Rocket } from "@mingcute/react/core-regular/rocket";
export { default as Circle } from "@mingcute/react/core-regular/round";
export { default as ShieldAlert } from "@mingcute/react/core-regular/safe-alert";
export { default as Save } from "@mingcute/react/core-regular/save";
export { default as CalendarClock } from "@mingcute/react/core-regular/schedule";
export { default as Search } from "@mingcute/react/core-regular/search";
export { default as SearchCheck } from "@mingcute/react/core-regular/search-3";
export { default as ChevronsUpDown } from "@mingcute/react/core-regular/selector-vertical";
export { default as Send } from "@mingcute/react/core-regular/send-plane";
export { default as Settings } from "@mingcute/react/core-regular/settings-3";
export { default as Settings2 } from "@mingcute/react/core-regular/settings-6";
export { default as Shield } from "@mingcute/react/core-regular/shield-shape";
export { default as Sparkles } from "@mingcute/react/core-regular/sparkles";
export { default as Star } from "@mingcute/react/core-regular/star";
export { default as Square } from "@mingcute/react/core-regular/stop";
export { default as Sun } from "@mingcute/react/core-regular/sun";
export { default as Tag } from "@mingcute/react/core-regular/tag";
export {
  default as Clock,
  default as Clock3,
} from "@mingcute/react/core-regular/time";
export { default as Wrench } from "@mingcute/react/core-regular/tool";
export { default as ArrowDownUp } from "@mingcute/react/core-regular/transfer-vertical";
export { default as Languages } from "@mingcute/react/core-regular/translate";
export { default as TrendingDown } from "@mingcute/react/core-regular/trending-down";
export { default as TrendingUp } from "@mingcute/react/core-regular/trending-up";
export { default as Trophy } from "@mingcute/react/core-regular/trophy";
export { default as Unlink } from "@mingcute/react/core-regular/unlink";
export { default as ChevronUp } from "@mingcute/react/core-regular/up";
export { default as Upload } from "@mingcute/react/core-regular/upload";
export { default as UserRound } from "@mingcute/react/core-regular/user-3";
export { default as UserPlus } from "@mingcute/react/core-regular/user-add";
export { default as Video } from "@mingcute/react/core-regular/video";
export {
  default as AlertCircle,
  default as CircleAlert,
} from "@mingcute/react/core-regular/warning";
export { default as WifiOff } from "@mingcute/react/core-regular/wifi-off";
export { default as Globe } from "@mingcute/react/core-regular/world";
