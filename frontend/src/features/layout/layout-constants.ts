export const LAYOUT_ID = {
  MAIN: 'main-content',
  SIDEBAR: 'app-sidebar',
} as const;

/**
 * The shell is a desktop shell. Below this width the sidebar becomes a drawer the topbar
 * opens, as the handoff's responsive section states. Tailwind's own breakpoints do not
 * include it, so the layout uses the `min-[900px]:` arbitrary variant and this constant
 * keeps the tests honest about which width they mean.
 */
export const DESKTOP_MIN_WIDTH_PX = 900;
