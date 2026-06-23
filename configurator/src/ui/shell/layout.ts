/** Shared chrome layout for floating panels. */

export const PANEL_INSET = 20;
export const PANEL_SECTION_GAP = 10;
export const SIDEBAR_PANEL_WIDTH = 280;
export const RIGHT_PANEL_WIDTH = 280;

export const LEFT_CHROME_OFFSET = PANEL_INSET + SIDEBAR_PANEL_WIDTH + PANEL_INSET;
export const RIGHT_CHROME_OFFSET = PANEL_INSET + RIGHT_PANEL_WIDTH + PANEL_INSET;

/** Top edge for component, artwork, project, and mode indicator row. */
export const CHROME_ROW_TOP = PANEL_INSET;

/** Gap between the project row and Save/Share/Quote action row. */
export const CHROME_ACTION_ROW_GAP = PANEL_SECTION_GAP;

/** Fixed row heights so side panels align with the toolbar chrome. */
export const CHROME_HEADER_ROW_HEIGHT = 44;
export const CHROME_ACTION_ROW_HEIGHT = 44;

/** Top edge of the Save/Share/Quote action toolbar on the right. */
export const CHROME_ACTION_ROW_TOP =
    CHROME_ROW_TOP + CHROME_HEADER_ROW_HEIGHT + CHROME_ACTION_ROW_GAP;

/** Where right-column content begins (below action row, with panel gap). */
export const TOP_CONTENT_OFFSET =
    CHROME_ROW_TOP
    + CHROME_HEADER_ROW_HEIGHT
    + CHROME_ACTION_ROW_GAP
    + CHROME_ACTION_ROW_HEIGHT
    + PANEL_SECTION_GAP;

/** More menu sits just left of the properties / project overview column. */
export const MORE_MENU_RIGHT = PANEL_INSET + RIGHT_PANEL_WIDTH + PANEL_SECTION_GAP;
export const MORE_MENU_TOP = CHROME_ACTION_ROW_TOP + CHROME_ACTION_ROW_HEIGHT + 6;
