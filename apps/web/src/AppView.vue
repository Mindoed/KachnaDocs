<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { SidebarProvider } from '@/components/ui/sidebar'
import LeftRibbon from '@/components/LeftRibbon/LeftRibbon.vue'
import LeftSidebar from '@/components/LeftSidebar/LeftSidebar.vue'
import RightSidebar from '@/components/RightSidebar/RightSidebar.vue'
import TitleBar from '@/components/TitleBar/TitleBar.vue'
import ResizablePanelGroup from './components/ui/resizable/ResizablePanelGroup.vue'
import ResizablePanel from './components/ui/resizable/ResizablePanel.vue'
import ResizableHandle from './components/ui/resizable/ResizableHandle.vue'
import { useCollapsiblePanel } from './components/ui/resizable/useCollapsiblePanel'
import type { ResizablePanelHandle } from './components/ui/resizable/useCollapsiblePanel'
import type { DiscordUser } from '@kachnadocs/shared'
import { usePanelsStore } from './stores/panelsStorage.ts'
import { getAllPanelsByLocation } from './features/panels/registry/panelRegistry'
import { PanelLocation } from './types/panel.ts'
import { registerDefaultPanels } from './features/panels/registry/registerDefaultPanels.ts'

// Separate from the SidebarProvider's `open`, which drives the ribbon only.
const leftSidebarOpen = ref(true)
const rightSidebarOpen = ref(true)

// The panels own the sidebar widths: dragging a handle changes them, and the toggles above only
// collapse/expand around the size the last drag left. useCollapsiblePanel keeps flag and panel
// in step in both directions.
const leftPanel = ref<ResizablePanelHandle | null>(null)
const rightPanel = ref<ResizablePanelHandle | null>(null)

const { onResize: onLeftPanelResize } = useCollapsiblePanel(leftSidebarOpen, leftPanel)
const { onResize: onRightPanelResize } = useCollapsiblePanel(rightSidebarOpen, rightPanel)

// Sidebar sizes are in pixels (the panels set size-unit="px"); collapsedSize is implicitly 0,
// so a sidebar can be dragged fully shut and dragging back out restores its previous width.
const LEFT_SIDEBAR_WIDTH = 256
const LEFT_SIDEBAR_MIN_WIDTH = 192
const RIGHT_SIDEBAR_WIDTH = 256
const RIGHT_SIDEBAR_MIN_WIDTH = 192
const CONTENT_MIN_WIDTH = 500

/** Shape of GET /api/auth/me — the user is nested under `user`. */
interface MeResponse {
  authenticated: boolean
  user: DiscordUser | null
}

const user = ref<DiscordUser | null>(null)
const store = usePanelsStore()

onMounted(async () => {
  try {
    const response = await fetch('http://localhost:3000/api/auth/me', {
      credentials: 'include',
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const body = (await response.json()) as MeResponse
    if (!body.authenticated) {
      throw new Error('User is not authenticated.')
    }

    user.value = body.user
    console.log('Authenticated user loaded:', user.value)
  } catch (error) {
    console.error('Could not load authenticated user.', error)
    window.location.href = '/auth'
  } finally {
    registerDefaultPanels()
    store.panelInit()
  }
})
</script>

<template>
  <!-- The titlebar offset lives here rather than on SidebarProvider's wrapper: percentage
       heights resolve against the parent's *padding* box, so the padding has to sit outside the
       element whose height the panel group measures itself against. -->
  <main class="overflow-x-clip pt-(--titlebar-height)">
    <!-- SidebarProvider is a flex row, so its children sit side by side: the 3rem ribbon rail,
         then the panel group.

         The wrapper needs a *definite* height, not just a min-height: SplitterGroup writes
         `height: 100%` inline on its own element, and a percentage only resolves against a
         definite parent height. Against a min-height-only parent it fell back to the group's
         content height, which is why the row came out half as tall as the window. min-h-0
         drops the base min-h-svh, which would otherwise outvote this height and push the row a
         titlebar past the bottom of the viewport.

         The ribbon stays outside the group on purpose — its panel is fixed to the viewport and
         only leaves a spacer in flow — so the group splits the width that is left over, measured
         from its own edges. That is what makes the sidebars keep exactly the pixels their
         handles were dragged through, at any window width. -->
    <SidebarProvider :open="false" class="h-[calc(100svh-var(--titlebar-height))] min-h-0">
      <TitleBar
        :user="user"
        :leftSidebarOpen="leftSidebarOpen"
        @toggle-left-sidebar="leftSidebarOpen = !leftSidebarOpen"
        :rightSidebarOpen="rightSidebarOpen"
        @toggle-right-sidebar="rightSidebarOpen = !rightSidebarOpen"
      />
      <LeftRibbon :user="user" />
      <ResizablePanelGroup direction="horizontal" class="h-full min-w-0 flex-1">
        <ResizablePanel
          ref="leftPanel"
          class="min-w-0"
          size-unit="px"
          collapsible
          :collapsed-size="0"
          :default-size="LEFT_SIDEBAR_WIDTH"
          :min-size="LEFT_SIDEBAR_MIN_WIDTH"
          @resize="onLeftPanelResize"
          v-show="store.countOfAvaibleLeftSidebar > 0"
        >
          <LeftSidebar />
        </ResizablePanel>
        <ResizableHandle />
        <!-- Pixels again, because that is the only way the floor means pixels: reka-ui converts a
             px panel's minSize against the measured group width, but passes a `%` panel's through
             as a percentage — :min-size="320" there would mean 320%. No defaultSize, so the panel
             still opens at whatever width the two sidebars leave. -->
        <ResizablePanel class="flex min-w-0 flex-col" size-unit="px" :min-size="CONTENT_MIN_WIDTH">
          <component
            :is="p.component"
            v-for="p in getAllPanelsByLocation(PanelLocation.MainView)"
            v-show="store.activePanelIdMainView === p.id"
            :key="p.id"
          />
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel
          ref="rightPanel"
          class="min-w-0"
          size-unit="px"
          collapsible
          :collapsed-size="0"
          :default-size="RIGHT_SIDEBAR_WIDTH"
          :min-size="RIGHT_SIDEBAR_MIN_WIDTH"
          @resize="onRightPanelResize"
          v-show="store.countOfAvaibleRightSidebar > 0"
        >
          <RightSidebar />
        </ResizablePanel>
      </ResizablePanelGroup>
    </SidebarProvider>
  </main>
</template>
