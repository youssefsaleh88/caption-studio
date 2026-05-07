/**
 * Scroll `element` into view inside `container` only (not the window).
 */
export function scrollElementIntoContainer(element, container, options = {}) {
  const { behavior = "smooth", margin = 8 } = options
  if (!element || !container) return

  const cRect = container.getBoundingClientRect()
  const eRect = element.getBoundingClientRect()

  const viewTop = container.scrollTop
  const viewBottom = viewTop + container.clientHeight

  const elTop = eRect.top - cRect.top + container.scrollTop
  const elBottom = elTop + eRect.height

  if (elTop < viewTop + margin) {
    container.scrollTo({
      top: Math.max(0, elTop - margin),
      behavior,
    })
  } else if (elBottom > viewBottom - margin) {
    container.scrollTo({
      top: Math.max(0, elBottom - container.clientHeight + margin),
      behavior,
    })
  }
}
