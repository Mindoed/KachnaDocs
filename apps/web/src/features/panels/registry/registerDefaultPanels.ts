import { markRaw, defineAsyncComponent } from 'vue'
import { BookDashed, Files, Search, Settings } from '@lucide/vue'

import { createPanel, PanelLocation, PanelMainView } from '../../../types/panel.ts'
import { registerPanel } from './panelRegistry.ts'

export function registerDefaultPanels(): void {
  registerPanel(
    PanelLocation.LeftSidebar,
    PanelMainView.EmptyView,
    createPanel(
      'Empty Left Sidebar',
      BookDashed,
      defineAsyncComponent(() => import('@/components/EmptyComponents/EmptyLeftSidebar.vue')),
    ),
  )

  registerPanel(
    PanelLocation.LeftSidebar,
    PanelMainView.EmptyView,
    createPanel(
      'Empty Right Sidebar',
      BookDashed,
      defineAsyncComponent(() => import('@/components/EmptyComponents/EmptyRightSidebar.vue')),
    ),
  )

  registerPanel(
    PanelLocation.RightSidebar,
    PanelMainView.EmptyView,
    createPanel(
      'Empty Right Sidebar',
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

  registerPanel(
    PanelLocation.MainView,
    PanelMainView.DocumentView,
    createPanel(
      'Empty Page With Only Left Sidebar',
      BookDashed,
      defineAsyncComponent(() => import('@/components/EmptyComponents/EmptyRightSidebar.vue')),
      PanelMainView.DocumentView,
    ),
  )

  registerPanel(
    PanelLocation.LeftSidebar,
    PanelMainView.DocumentView,
    createPanel(
      'Empty Right Sidebar From Document View',
      BookDashed,
      defineAsyncComponent(() => import('@/components/EmptyComponents/EmptyLeftSidebar.vue')),
      null,
      1,
    ),
  )
}
