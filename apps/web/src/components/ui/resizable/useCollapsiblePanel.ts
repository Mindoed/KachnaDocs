import type { Ref } from 'vue'
import { nextTick, onMounted, watch } from 'vue'

/** The imperative handle reka-ui's SplitterPanel exposes, forwarded by ResizablePanel. */
export interface ResizablePanelHandle {
  collapse: () => void
  expand: () => void
  /** Current size in the panel's own `sizeUnit` — pixels for the side panels. */
  getSize: () => number
  resize: (size: number) => void
}

// Anything narrower than this counts as shut, so dragging a panel past it flips `open` (and
// with it the TitleBar icon) instead of waiting for the drag to reach exactly 0.
const CLOSED_PX = 16

/**
 * Keeps a boolean `open` flag and a collapsible, px-sized ResizablePanel in step.
 *
 * The flag is what the rest of the app reads (button icons, and the sidebars themselves); the
 * panel owns the width, because only the splitter knows what a handle drag did to it. So each
 * side has to follow the other: toggling the flag collapses/expands the panel, and dragging a
 * handle past CLOSED_PX updates the flag. `applying` records the change a side is causing
 * itself, so the two never echo each other back into a loop.
 */
export function useCollapsiblePanel(
  open: Ref<boolean>,
  panel: Readonly<Ref<ResizablePanelHandle | null>>,
) {
  let applying = false

  function applyPanelSize(value: boolean) {
    const instance = panel.value
    if (!instance) return

    applying = true
    try {
      // expand() is a no-op on a panel that is already open, so this is safe to call blindly.
      if (value) instance.expand()
      else instance.collapse()
    } finally {
      applying = false
    }
  }

  // flush: sync so the panel size matches the flag within the same tick — a later flush would
  // leave one render where the flag says open and the panel is still 0px wide.
  watch(
    open,
    (value) => {
      if (applying) return
      applyPanelSize(value)
    },
    { flush: 'sync' },
  )

  function onResize(size: number) {
    if (applying) return

    const value = size > CLOSED_PX
    if (value === open.value) return

    applying = true
    try {
      open.value = value
    } finally {
      applying = false
    }
  }

  onMounted(async () => {
    // Panels register (and the group then picks its initial layout) in their own onMounted
    // hooks, so the size is not settled until the mount pass is done.
    await nextTick()
    applyPanelSize(open.value)
  })

  return { onResize }
}
