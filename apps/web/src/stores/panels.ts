import { defineStore } from 'pinia'
import {
  getAllPanelIDsByLocationAndGroup,
  getPanelIdByLocation,
  hasPanel,
} from '../features/panels/registry/panelRegistry.ts'
import type { PanelMainView } from '../types/panel.ts'
import { PanelLocation } from '../types/panel.ts'

const usePanelsStorage = defineStore('panels', {
  state: () => ({
    activeMainView: null as PanelMainView | null,
    availableSidePanels: {} as Record<PanelLocation, string[] | null>,

    [PanelLocation.LeftSidebar]: null as string | null,
    [PanelLocation.RightSidebar]: null as string | null,
    [PanelLocation.MainView]: null as string | null,
  }),

  getters: {
    activePanelLeftSidebar(state): string | null {
      return state[PanelLocation.LeftSidebar]
    },
    activePanelRightSidebar(state): string | null {
      return state[PanelLocation.RightSidebar]
    },
    activePanelMainView(state): string | null {
      return state[PanelLocation.MainView]
    },
  },

  actions: {
    activateMainView(panelMainView: PanelMainView, panelId: string) {
      this.activeMainView = panelMainView
      this[PanelLocation.MainView] = getPanelIdByLocation(PanelLocation.MainView, panelId)

      this.availableSidePanels[PanelLocation.LeftSidebar] = getAllPanelIDsByLocationAndGroup(
        PanelLocation.LeftSidebar,
        panelMainView,
      )

      this.availableSidePanels[PanelLocation.RightSidebar] = getAllPanelIDsByLocationAndGroup(
        PanelLocation.RightSidebar,
        panelMainView,
      )

      this[PanelLocation.LeftSidebar] =
        this.availableSidePanels[PanelLocation.LeftSidebar]?.[0] ?? null
    },

    activateSidePanel(location: PanelLocation, panelId: string) {
      if (location === PanelLocation.MainView) {
        throw new Error('Cannot activate a side panel in the main view location.')
      }

      const availablePanels = this.availableSidePanels[location]
      if (!availablePanels || !availablePanels.includes(panelId)) {
        throw new Error(`Panel with ID "${panelId}" is not available in ${location}.`)
      }

      if (hasPanel(location, panelId)) {
        this[location] = panelId
      } else {
        throw new Error(`Panel with ID "${panelId}" is not registered in ${location}.`)
      }
    },
  },
})
