import { markRaw, defineAsyncComponent } from 'vue'
import { Files, Search, Settings } from '@lucide/vue'

import { PanelLocation, PanelMainView } from '../../../types/panel.ts'
import { registerPanel } from './panelRegistry.ts'

export function registerDefaultPanels(): void {
  // registerPanel(PanelLocation.RightSidebar, PanelGroup.HomeView, {
  //   id: 'chatbot',
  //   title: 'Daffy',
  //   icon: markRaw(Settings),
  //   component: markRaw(defineAsyncComponent(() => import('@/components/panels/ChatBot.vue'))),
  //   order: 0,
  // })
}
