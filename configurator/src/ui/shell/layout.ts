/** Shared chrome layout for floating panels. */

export const PANEL_INSET = 20;
export const PANEL_SECTION_GAP = 10;
export const SIDEBAR_PANEL_WIDTH = 280;
export const RIGHT_PANEL_WIDTH = 280;

export const LEFT_CHROME_OFFSET = PANEL_INSET + SIDEBAR_PANEL_WIDTH + PANEL_INSET;
export const RIGHT_CHROME_OFFSET = PANEL_INSET + RIGHT_PANEL_WIDTH + PANEL_INSET;

/** Top edge for side panels. */
export const CHROME_ROW_TOP = PANEL_INSET;

/** Fallback when the Add to stand panel has not been measured yet. */
export const CHROME_PANEL_ALIGN_TOP = CHROME_ROW_TOP;
export const TOOLBAR_PANEL_PADDING = 15;
export const TOOLBAR_PANEL_TITLE_SIZE = 14;
export const TOOLBAR_PANEL_TITLE_LINE_HEIGHT = 17;
export const TOOLBAR_PANEL_SECTION_GAP = 10;
export const TOOLBAR_FIELD_LABEL_SIZE = 13;
export const TOOLBAR_FIELD_LABEL_LINE_HEIGHT = 16;
export const TOOLBAR_FIELD_INNER_GAP = 6;

/** Shared control height — matches the Component select in Toolbar. */
export const TOOLBAR_CONTROL_HEIGHT = 36;
export const TOOLBAR_CONTROL_PADDING_X = 10;

export const CHROME_COMPONENT_ALIGN_TOP =
    CHROME_ROW_TOP
    + TOOLBAR_PANEL_PADDING
    + TOOLBAR_PANEL_TITLE_LINE_HEIGHT
    + TOOLBAR_PANEL_SECTION_GAP
    + TOOLBAR_FIELD_LABEL_LINE_HEIGHT
    + TOOLBAR_FIELD_INNER_GAP;

/** Shared height for component select, artwork upload, and project controls. */
export const CHROME_INLINE_ROW_HEIGHT = TOOLBAR_CONTROL_HEIGHT;

/** Gap between the project row and Save/Share/Quote action row (legacy alias). */
export const CHROME_ACTION_ROW_GAP = PANEL_SECTION_GAP;

/** Fixed row heights so side panels align with the toolbar chrome. */
export const CHROME_HEADER_ROW_HEIGHT = CHROME_INLINE_ROW_HEIGHT;
export const CHROME_ACTION_ROW_HEIGHT = CHROME_INLINE_ROW_HEIGHT;

/** Inline row top — project, artwork, and actions share this Y position. */
export const CHROME_ACTION_ROW_TOP = CHROME_COMPONENT_ALIGN_TOP;

/** Where scrollable side-panel content begins below the inline chrome row. */
export const TOP_CONTENT_OFFSET =
    CHROME_COMPONENT_ALIGN_TOP + CHROME_INLINE_ROW_HEIGHT + PANEL_SECTION_GAP;

/** More menu sits just left of the properties / project overview column. */
export const MORE_MENU_RIGHT = PANEL_INSET + RIGHT_PANEL_WIDTH + PANEL_SECTION_GAP;
export const MORE_MENU_TOP = CHROME_COMPONENT_ALIGN_TOP + CHROME_INLINE_ROW_HEIGHT + 6;

/** Max width for the centered artwork upload control. */
export const ARTWORK_DROP_ZONE_MAX_WIDTH = 280;
