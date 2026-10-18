import type { Component } from 'vue'

// document the panel interface:
/**
 * @property {string} id - The unique identifier of the panel.
 * @property {string} title - The title of the panel, used for tooltip and aria-label on the tabstrip button.
 * @property {Component} icon - The icon component for the panel, typically from lucide-vue-next, marked as raw.
 * @property {Component} component - The main component of the panel, marked as raw and can be an async component.
 * @property {number} [order] - Optional order of the panel in the tabstrip; falls back to registration order if not provided.
 * @property {() => boolean} [enabled] - Optional function to determine if the panel is enabled; returns false to hide the button entirely (useful for auth/feature gating).
 */
export interface Panel {
  id: string // 'doc-tree' — the only identity the store knows
  title: string // tooltip + aria-label on the tabstrip button
  icon: Component // lucide-vue-next, markRaw'd
  component: Component // markRaw(defineAsyncComponent(...))
  order?: number // tabstrip order; falls back to registration order
  enabled?: () => boolean // false → no button at all (auth/feature gating)
}

type PanelMap = {
  [L in PanelLocation]: {
    [G in PanelGroup]: Panel[]
  }
}

type PanelArray = {
  [L in PanelLocation]: Map<string, Panel>
}

export enum PanelLocation {
  LeftSidebar = 'left',
  RightSidebar = 'right',

  // Possible to add panels to the main view area in the future? (e.g. generally floating pannels, side panels, etc.)
}

export enum PanelGroup {
  DocumentView = 'document-view',
  HomeView = 'home-view',

  // Add more groups which are specific to a main view
}

export const panelRegistery: PanelMap = {
  [PanelLocation.LeftSidebar]: {
    [PanelGroup.DocumentView]: [],
    [PanelGroup.HomeView]: [],
  },

  [PanelLocation.RightSidebar]: {
    [PanelGroup.DocumentView]: [],
    [PanelGroup.HomeView]: [],
  },
}

export const panelArray: PanelArray = {
  [PanelLocation.LeftSidebar]: new Map(),
  [PanelLocation.RightSidebar]: new Map(),
}

export const addPanelToRegistery = <L extends PanelLocation, G extends PanelGroup>(
  location: L,
  group: G,
  panel: Panel,
) => {
  if (!panelRegistery[location][group]) {
    panelRegistery[location][group] = []
  }
  panelRegistery[location][group].push(panel)
  panelArray[location].set(panel.id, panel)
}

export const getPanels = <L extends PanelLocation>(location: L): PanelArray[L] => {
  return panelArray[location]
}
