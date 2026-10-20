import { shallowReactive } from 'vue'
import type {
  Panel,
  PanelMap,
  PanelArray,
  PanelLookup,
  PanelGroupIcons,
} from '../../../types/panel.ts'
import { PanelMainView, PanelLocation } from '../../../types/panel.ts'

// --------------------------------------------------
// Registry storage
// --------------------------------------------------

// Group-specific arrays
const panelRegistry: PanelMap = {
  [PanelLocation.LeftSidebar]: {
    [PanelMainView.DocumentView]: shallowReactive<Panel[]>([]),
    [PanelMainView.HomeView]: shallowReactive<Panel[]>([]),
  },

  [PanelLocation.RightSidebar]: {
    [PanelMainView.DocumentView]: shallowReactive<Panel[]>([]),
    [PanelMainView.HomeView]: shallowReactive<Panel[]>([]),
  },
  [PanelLocation.MainView]: {
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
const panelsById: PanelLookup = {
  [PanelLocation.LeftSidebar]: new Map(),
  [PanelLocation.RightSidebar]: new Map(),
  [PanelLocation.MainView]: new Map(),
}

const ribbonIcons: PanelGroupIcons = {
  [PanelMainView.DocumentView]: null,
  [PanelMainView.HomeView]: null,
}

// --------------------------------------------------
// Registration
// --------------------------------------------------

export function registerMainView() {}

/**
 * Register a panel at the specified location and group.
 *
 * Average complexity: O(1)
 */
export function registerPanel(location: PanelLocation, group: PanelMainView, panel: Panel): void {
  const lookup = panelsById[location]

  if (lookup.has(panel.id)) {
    throw new Error(`Panel '${panel.id}' is already registered at '${location}'`)
  }

  lookup.set(panel.id, panel)
  panelRegistry[location][group].push(panel)
  panelArray[location].push(panel)
}

/**
 * Remove a panel by its ID.
 *
 * Complexity: O(n), due to array removal.
 */
export function removePanel(location: PanelLocation, panelId: string): boolean {
  const panel = panelsById[location].get(panelId)

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
  panelsById[location].delete(panelId)

  return true
}

// --------------------------------------------------
// Retrieval
// --------------------------------------------------

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
  return panelsById[location].get(panelId)?.id ?? null
}

/**
 * Check whether a panel exists.
 */
export function hasPanel(location: PanelLocation, panelId: string): boolean {
  return panelsById[location].has(panelId)
}
