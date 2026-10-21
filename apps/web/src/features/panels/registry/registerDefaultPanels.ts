import { markRaw, defineAsyncComponent } from 'vue'
import { BookDashed, Files, Search, Settings } from '@lucide/vue'

import { createPanel, PanelLocation, PanelMainView } from '../../../types/panel.ts'
import { registerPanel } from './panelRegistry.ts'

export function registerDefaultPanels(): void {
  registerPanel(
    PanelLocation.LeftSidebar,
    PanelMainView.EmptyView,
    createPanel(
      'Empty Page Left Sidebar',
      BookDashed,
      defineAsyncComponent(() => import('@/components/EmptyComponents/EmptyLeftSidebar.vue')),
    ),
  )

  registerPanel(
    PanelLocation.LeftSidebar,
    PanelMainView.EmptyView,
    createPanel(
      'Empty Page Right Sidebar',
      BookDashed,
      defineAsyncComponent(() => import('@/components/EmptyComponents/EmptyRightSidebar.vue')),
    ),
  )

  registerPanel(
    PanelLocation.RightSidebar,
    PanelMainView.EmptyView,
    createPanel(
      'Empty Page Right Sidebar',
      BookDashed,
      defineAsyncComponent(() => import('@/components/EmptyComponents/EmptyRightSidebar.vue')),
    ),
  )

  registerPanel(
    PanelLocation.MainView,
    PanelMainView.EmptyView,
    createPanel(
      'Empty Page',
      BookDashed,
      defineAsyncComponent(() => import('@/components/EmptyComponents/EmptyPage.vue')),
      PanelMainView.EmptyView,
    ),
  )
}
