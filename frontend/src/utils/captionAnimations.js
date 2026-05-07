/**
 * Caption overlay animation presets (preview CSS + id for export).
 */
export const CAPTION_ANIMATION_IDS = [
  "none",
  "fade",
  "pop",
  "bounce",
  "karaoke",
  "word",
  "typewriter",
]

export const CAPTION_ANIMATIONS = {
  none: {
    id: "none",
    cssClass: null,
    previewClass: "cap-anim-preview-none",
  },
  fade: {
    id: "fade",
    cssClass: "cap-anim-fade",
    previewClass: "cap-anim-preview-fade",
  },
  pop: {
    id: "pop",
    cssClass: "cap-anim-pop",
    previewClass: "cap-anim-preview-pop",
  },
  bounce: {
    id: "bounce",
    cssClass: "cap-anim-bounce",
    previewClass: "cap-anim-preview-bounce",
  },
  karaoke: {
    id: "karaoke",
    cssClass: "cap-anim-karaoke",
    previewClass: "cap-anim-preview-karaoke",
  },
  word: {
    id: "word",
    cssClass: null,
    previewClass: "cap-anim-preview-word",
  },
  typewriter: {
    id: "typewriter",
    cssClass: null,
    previewClass: "cap-anim-preview-typewriter",
  },
}

export function getAnimationCssClass(animationId) {
  const id =
    animationId && CAPTION_ANIMATIONS[animationId] ? animationId : "none"
  return CAPTION_ANIMATIONS[id].cssClass
}
