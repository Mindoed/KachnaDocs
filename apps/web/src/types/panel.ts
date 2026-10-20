import type { Component } from 'vue'

// document the panel interface:
/**
 * @property {string} id - The unique identifier of the panel.
 * @property {string} title - The title of the panel, used for tooltip and aria-label on the tabstrip button.
 * @property {Component} icon - The icon component for the panel, typically from lucide-vue-next, marked as raw.
 * @property {Component} component - The main component of the panel, marked as raw and can be an async component.
 * @property {boolean} isAvailable - Used by registery Indicates whether the panel is currently active.
 * @property {number} [order] - Optional order of the panel in the tabstrip; falls back to registration order if not provided.
 * @property {() => boolean} [enabled] - Optional function to determine if the panel is enabled; returns false to hide the button entirely (useful for auth/feature gating).
 */
export interface Panel {
  id: string // 'doc-tree' — the only identity the store knows
  title: string // tooltip + aria-label on the tabstrip button
  icon: Component // lucide-vue-next, markRaw'd
  component: Component // markRaw(defineAsyncComponent(...))
  order?: number // tabstrip order; falls back to registration order, 0 - is always shown (default panels)
  enabled?: () => boolean // false → no button at all (auth/feature gating)
}

export interface MainPanel extends Panel {
  group: PanelMainView // the main view group this panel belongs to
}

/**
 * @enum {string} PanelLocation - The location where the panel is registered.
 * @property {string} LeftSidebar - Panels for the left sidebar.
 * @property {string} RightSidebar - Panels for the right sidebar.
 * @property {string} MainView - Panels for the main view area (icon is shown in the ribbon).
 */
export const enum PanelLocation {
  LeftSidebar = 'left',
  RightSidebar = 'right',
  MainView = 'main',
  // Possible to add panels to the main view area in the future? (e.g. generally floating pannels, side panels, etc.)
}

export const enum PanelMainView {
  DocumentView = 'document-view',
  HomeView = 'home-view',

  // Add more groups which are specific to a main view
}

export type PanelGroupIcons = Record<PanelMainView, Component | null> // used for the ribbon icons
export type PanelMap = Record<PanelLocation, Record<PanelMainView, Panel[]>>
export type PanelArray = Record<PanelLocation, Panel[]> // used for rendering all panels at a location
export type PanelLookup = Record<PanelLocation, Map<string, Panel>>
