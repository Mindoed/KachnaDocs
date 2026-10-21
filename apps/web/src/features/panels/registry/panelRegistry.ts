import { shallowReactive } from 'vue'
import type { Panel, PanelMap, PanelArray, PanelLookup } from '../../../types/panel.ts'
import { PanelMainView, PanelLocation } from '../../../types/panel.ts'
import { usePanelsStore } from '../../../stores/panelsStorage.ts'

// --------------------------------------------------
// Registry storage
// --------------------------------------------------

// Group-specific arrays
const panelRegistry: PanelMap = {
  [PanelLocation.LeftSidebar]: {
    [PanelMainView.DocumentView]: shallowReactive<Panel[]>([]),
    [PanelMainView.HomeView]: shallowReactive<Panel[]>([]),
    [PanelMainView.EmptyView]: shallowReactive<Panel[]>([]),
  },

  [PanelLocation.RightSidebar]: {
    [PanelMainView.DocumentView]: shallowReactive<Panel[]>([]),
    [PanelMainView.HomeView]: shallowReactive<Panel[]>([]),
    [PanelMainView.EmptyView]: shallowReactive<Panel[]>([]),
  },
  [PanelLocation.MainView]: {
    [PanelMainView.EmptyView]: shallowReactive<Panel[]>([]),
    [PanelMainView.DocumentView]: shallowReactive<Panel[]>([]),
    [PanelMainView.HomeView]: shallowReactive<Panel[]>([]),
  },
}

// Flat arrays for rendering all panels at a location
const panelArray: PanelArray = {
  [PanelLocation.LeftSidebar]: shallowReactive<Panel[]>([]),
  [PanelLocation.RightSidebar]: shallowReactive<Panel[]>([]),
  [PanelLocation.MainView]: shallowReactive<Panel[]>([]),
}

// Fast lookup by panel ID
const panelsByLocation: PanelLookup = {
  [PanelLocation.LeftSidebar]: new Map(),
  [PanelLocation.RightSidebar]: new Map(),
  [PanelLocation.MainView]: new Map(),
}

const panelsAll: Map<string, Panel> = new Map()

// --------------------------------------------------
// Registration
// --------------------------------------------------

/**
 * Register a panel at the specified location and group.
 *
 * Average complexity: O(1)
 */
export function registerPanel(location: PanelLocation, group: PanelMainView, panel: Panel): void {
  // if (panel.enabled && !panel.enabled()) {
  //   console.warn(`Panel '${panel.id}' is not enabled and will not be registered.`)
  //   return
  // }

  const lookup = panelsByLocation[location]

  if (lookup.has(panel.id)) {
    throw new Error(`Panel '${panel.id}' is already registered at '${location}'`)
  }

  lookup.set(panel.id, panel)
  panelRegistry[location][group].push(panel)
  panelArray[location].push(panel)

  if (location === PanelLocation.MainView) {
    const store = usePanelsStore()
    if (!store.activeMainView) {
      store.setActiveMainView(panel.id)
    }
  }
}

/**
 * Remove a panel by its ID.
 *
 * Complexity: O(n), due to array removal.
 */
export function removePanel(location: PanelLocation, panelId: string): boolean {
  const panel = panelsByLocation[location].get(panelId)

  if (!panel) {
    return false
  }

  // Find the group containing the panel
  for (const group of Object.values(panelRegistry[location])) {
    const index = group.findIndex((p) => p.id === panelId)

    if (index !== -1) {
      group.splice(index, 1)
      break
    }
  }

  // Remove from flat array
  const panels = panelArray[location]
  const index = panels.findIndex((p) => p.id === panelId)

  if (index !== -1) {
    panels.splice(index, 1)
  }

  // Remove from lookup
  panelsByLocation[location].delete(panelId)

  return true
}

// --------------------------------------------------
// Retrieval
// --------------------------------------------------

export function getFirstPanelIdMainView(): string | null {
  return panelArray[PanelLocation.MainView].length > 0
    ? panelArray[PanelLocation.MainView][0]!.id
    : null
}

/**
 * Get all registered panels at a given location.
 *
 * Returns a reactive array.
 */
export function getAllPanelsByLocation(location: PanelLocation): readonly Panel[] {
  return panelArray[location]
}

/**
 * Get all panels in a location/group combination.
 *
 * @returns a reactive array.
 */
export function getAllPanelsByLocationAndGroup(
  location: PanelLocation,
  group: PanelMainView,
): readonly Panel[] {
  return panelRegistry[location][group]
}

/**
 *
 * @returns
 */
export function getAllPanelIDsByLocationAndGroup(
  location: PanelLocation,
  group: PanelMainView,
): string[] {
  return panelRegistry[location][group].map((panel) => panel.id)
}

/**
 * Get a single panel by ID.
 *
 * Average complexity: O(1)
 */
export function getPanelIdByLocation(location: PanelLocation, panelId: string): string | null {
  return panelsByLocation[location].get(panelId)?.id ?? null
}

export function getPanelByLocation(location: PanelLocation, panelId: string): Panel | null {
  return panelsByLocation[location].get(panelId) ?? null
}

/**
 * Check whether a panel exists.
 */
export function hasPanel(location: PanelLocation, panelId: string): boolean {
  return panelsByLocation[location].has(panelId)
}
