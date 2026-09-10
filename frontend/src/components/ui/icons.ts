/**
 * Icon set of the Trycore system: Lucide, line only, `fill: none`, `currentColor`.
 *
 * The design handoff sanctions one icon per meaning, so the whole application draws from this
 * list instead of picking a look-alike: `layout-dashboard` is the portfolio, `bar-chart-2` the
 * project dashboard, `file-text` my activities, `plus` a new record, `arrow-right` the
 * affordance of a clickable row, `arrow-left` going back, `x` closing, `triangle-alert` a
 * critical activity. `menu`, `sun` and `moon` are not in the handoff's list: they serve the
 * responsive drawer and the theme toggle, which are behaviour the redesign keeps rather than
 * views it specifies.
 *
 * Unicode glyphs and emoji are never icons here.
 */
export {
  ArrowLeft,
  ArrowRight,
  BarChart2,
  Bell,
  FileText,
  LayoutDashboard,
  Menu,
  Moon,
  Plus,
  Search,
  Sun,
  TriangleAlert,
  X,
} from 'lucide-react';

export type { LucideIcon } from 'lucide-react';

/** 16px in the sidebar, 18px in content, as the handoff's iconography section states. */
export const ICON_SIZE = {
  SIDEBAR: 16,
  CONTENT: 18,
} as const;

/** 1.6 for the sidebar and light UI, 2.0 for alerts and emphasis. */
export const ICON_STROKE = {
  UI: 1.6,
  ALERT: 2,
} as const;
