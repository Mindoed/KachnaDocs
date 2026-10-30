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
    availablePanels: {} as Record<PanelLocation, string[] | null>,

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
      return state.availablePanels[PanelLocation.LeftSidebar] ?? null
    },

    availablePanelsRightSidebar(state): string[] | null {
      return state.availablePanels[PanelLocation.RightSidebar] ?? null
    },

    countOfAvaibleLeftSidebar(state): number {
      return state.availablePanels[PanelLocation.LeftSidebar]?.length ?? 0
    },

    countOfAvaibleRightSidebar(state): number {
      return state.availablePanels[PanelLocation.RightSidebar]?.length ?? 0
    },

    countOfAvaibleMainView(state): number {
      return state.availablePanels[PanelLocation.MainView]?.length ?? 0
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

      this.availablePanels[PanelLocation.LeftSidebar] = getAllPanelIDsByLocationAndGroup(
        PanelLocation.LeftSidebar,
        this.activeMainView,
      )

      this.availablePanels[PanelLocation.RightSidebar] = getAllPanelIDsByLocationAndGroup(
        PanelLocation.RightSidebar,
        this.activeMainView,
      )

      this[PanelLocation.LeftSidebar] = this.availablePanels[PanelLocation.LeftSidebar]?.[0] ?? null

      this[PanelLocation.RightSidebar] =
        this.availablePanels[PanelLocation.RightSidebar]?.[0] ?? null
    },

    setActiveSidePanel(location: PanelLocation, panelId: string) {
      if (location === PanelLocation.MainView) {
        throw new Error('Cannot activate a side panel in the main view location.')
      }

      const availablePanels = this.availablePanels[location]
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
