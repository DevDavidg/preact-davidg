import * as THREE from 'three'

/**
 * The shared reflection studio: a dark room, a crisp horizon, a champagne key,
 * a cool fill and a low kicker. Any polished surface in the scene — the hero
 * shell, the finale gate — reflects the same room, which is what keeps
 * machined metal reading as one material across the corridor instead of as
 * two separately-lit renders glued together.
 *
 * Authored 2:1, because an equirectangular map is a sphere unwrapped and a
 * square canvas stretches the whole room vertically.
 */
export const createStudioEquirect = (
  width: number,
  height: number,
): THREE.CanvasTexture => {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')

  if (ctx) {
    const room = ctx.createLinearGradient(0, 0, 0, height)
    room.addColorStop(0, '#2c3844')
    room.addColorStop(0.3, '#141a22')
    room.addColorStop(0.49, '#06080b')
    room.addColorStop(0.51, '#08090a')
    room.addColorStop(0.8, '#0f100f')
    room.addColorStop(1, '#181510')
    ctx.fillStyle = room
    ctx.fillRect(0, 0, width, height)

    const softbox = (
      x: number,
      y: number,
      w: number,
      h: number,
      colour: string,
      blur: number,
    ) => {
      ctx.save()
      ctx.filter = `blur(${blur}px)`
      ctx.fillStyle = colour
      ctx.fillRect(x - w / 2, y - h / 2, w, h)
      ctx.restore()
    }

    softbox(width * 0.66, height * 0.24, width * 0.32, height * 0.22, 'rgba(255,216,170,0.8)', 26)
    softbox(width * 0.66, height * 0.24, width * 0.19, height * 0.11, 'rgba(255,238,214,0.72)', 8)
    softbox(width * 0.2, height * 0.3, width * 0.24, height * 0.18, 'rgba(162,196,230,0.58)', 22)
    softbox(width * 0.9, height * 0.66, width * 0.16, height * 0.11, 'rgba(255,180,84,0.45)', 18)

    ctx.save()
    ctx.filter = 'blur(1.5px)'
    const horizon = ctx.createLinearGradient(0, 0, width, 0)
    horizon.addColorStop(0, 'rgba(120,140,165,0.05)')
    horizon.addColorStop(0.35, 'rgba(206,222,244,0.72)')
    horizon.addColorStop(0.7, 'rgba(246,222,186,0.85)')
    horizon.addColorStop(1, 'rgba(120,140,165,0.05)')
    ctx.fillStyle = horizon
    ctx.fillRect(0, height * 0.5 - 1.5, width, 3)
    ctx.restore()
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.mapping = THREE.EquirectangularReflectionMapping
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}
