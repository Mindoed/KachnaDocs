import { defineStore } from 'pinia'
import {
  getAllPanelIDsByLocationAndGroup,
  getFirstPanelIdMainView,
  getPanelByLocation,
  hasPanel,
} from '../features/panels/registry/panelRegistry.ts'
import type { PanelMainView } from '../types/panel.ts'
import { PanelLocation } from '../types/panel.ts'

export const usePanelsStore = defineStore('panelsStorage', {
  state: () => ({
    activeMainView: null as PanelMainView | null,
    availableSidePanels: {} as Record<PanelLocation, string[] | null>,

    [PanelLocation.LeftSidebar]: null as string | null,
    [PanelLocation.RightSidebar]: null as string | null,
    [PanelLocation.MainView]: null as string | null,
  }),

  getters: {
    activePanelIdLeftSidebar(state): string | null {
      return state[PanelLocation.LeftSidebar]
    },
    activePanelIdRightSidebar(state): string | null {
      return state[PanelLocation.RightSidebar]
    },
    activePanelIdMainView(state): string | null {
      return state[PanelLocation.MainView]
    },

    availablePanelsLeftSidebar(state): string[] | null {
      return state.availableSidePanels[PanelLocation.LeftSidebar] ?? null
    },
    availablePanelsRightSidebar(state): string[] | null {
      return state.availableSidePanels[PanelLocation.RightSidebar] ?? null
    },
  },

  actions: {
    panelInit() {
      console.log('Initializing panels store...')
      this.setActiveMainView(getFirstPanelIdMainView()!)
    },

    setActiveMainView(panelId: string) {
      if (!hasPanel(PanelLocation.MainView, panelId)) {
        throw new Error(`Panel with ID "${panelId}" is not registered in the main view.`)
      }

      const panel = getPanelByLocation(PanelLocation.MainView, panelId)
      if (!panel || !panel.isMainView) {
        throw new Error(`Panel with ID "${panelId}" is not registered in the main view.`)
      }

      this.activeMainView = panel.isMainView
      this[PanelLocation.MainView] = panelId

      this.availableSidePanels[PanelLocation.LeftSidebar] = getAllPanelIDsByLocationAndGroup(
        PanelLocation.LeftSidebar,
        this.activeMainView,
      )

      this.availableSidePanels[PanelLocation.RightSidebar] = getAllPanelIDsByLocationAndGroup(
        PanelLocation.RightSidebar,
        this.activeMainView,
      )

      this[PanelLocation.LeftSidebar] =
        this.availableSidePanels[PanelLocation.LeftSidebar]?.[0] ?? null

      this[PanelLocation.RightSidebar] =
        this.availableSidePanels[PanelLocation.RightSidebar]?.[0] ?? null
    },

    setActiveSidePanel(location: PanelLocation, panelId: string) {
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
