/**
 * Sample a headshot into opaque coloured cubes. Cover-crops like CSS
 * `object-fit: cover` + face bias, then drops the flat studio backdrop so the
 * figure reads as a person — not a grey brick of wall voxels.
 */

export interface PortraitVoxelSpec {
  width: number
  height: number
  cols: number
  rows: number
  layers: number
  /** 0 top → 1 bottom — matches CSS object-position Y. */
  focusY: number
  /**
   * Drop near-neutral samples brighter than this (0–1 luma). Tuned for a light
   * studio wall behind a darker subject.
   */
  bgLuma?: number
}

export interface PortraitVoxelField {
  count: number
  chaos: Float32Array
  home: Float32Array
  color: Float32Array
  axis: Float32Array
  seed: Float32Array
  size: Float32Array
}

const hash01 = (value: number) => {
  const wave = Math.sin(value * 127.1 + 311.7) * 43758.5453
  return wave - Math.floor(wave)
}

const luminance = (r: number, g: number, b: number) =>
  (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255

const chroma = (r: number, g: number, b: number) =>
  (Math.max(r, g, b) - Math.min(r, g, b)) / 255

/** Cover-crop source rect into the panel aspect with a vertical focus bias. */
const coverSampleRect = (
  imgW: number,
  imgH: number,
  panelAspect: number,
  focusY: number,
) => {
  const imageAspect = imgW / Math.max(imgH, 1)
  if (imageAspect > panelAspect) {
    const cropW = imgH * panelAspect
    const x = (imgW - cropW) * 0.5
    return { x, y: 0, w: cropW, h: imgH }
  }
  const cropH = imgW / panelAspect
  const focusFromTop = focusY * imgH
  const y = Math.max(0, Math.min(imgH - cropH, focusFromTop - cropH * 0.5))
  return { x: 0, y, w: imgW, h: cropH }
}

/** True for the flat light wall — keep skin, hair, shirt, glasses. */
const isStudioBackground = (
  r: number,
  g: number,
  b: number,
  bgLuma: number,
) => {
  const luma = luminance(r, g, b)
  if (luma < bgLuma) return false
  // Neutral wall: low chroma. Skin / glasses reflections keep more chroma.
  return chroma(r, g, b) < 0.11
}

/** Close 1-cell holes inside the silhouette so cheeks/forehead don't pucker. */
const dilateMask = (mask: Uint8Array, cols: number, rows: number) => {
  const next = new Uint8Array(mask)
  for (let row = 1; row < rows - 1; row++) {
    for (let column = 1; column < cols - 1; column++) {
      const index = row * cols + column
      if (mask[index]) continue
      let neighbours = 0
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue
          if (mask[(row + dy) * cols + (column + dx)]) neighbours += 1
        }
      }
      if (neighbours >= 5) next[index] = 1
    }
  }
  return next
}

export const buildPortraitVoxels = (
  image: HTMLImageElement | ImageBitmap,
  spec: PortraitVoxelSpec,
): PortraitVoxelField => {
  const bgLuma = spec.bgLuma ?? 0.56
  const { cols, rows, layers, width, height } = spec
  const cellW = width / cols
  const cellH = height / rows
  // Near-full cell — gaps between cubes read as holes in the face.
  const edge = Math.min(cellW, cellH) * 0.97
  const layerPitch = edge * 0.72

  const canvas = document.createElement('canvas')
  canvas.width = cols
  canvas.height = rows
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) {
    return {
      count: 0,
      chaos: new Float32Array(0),
      home: new Float32Array(0),
      color: new Float32Array(0),
      axis: new Float32Array(0),
      seed: new Float32Array(0),
      size: new Float32Array(0),
    }
  }

  const imgW =
    'naturalWidth' in image ? image.naturalWidth || image.width : image.width
  const imgH =
    'naturalHeight' in image ? image.naturalHeight || image.height : image.height
  const crop = coverSampleRect(imgW, imgH, width / height, spec.focusY)

  ctx.clearRect(0, 0, cols, rows)
  ctx.drawImage(image, crop.x, crop.y, crop.w, crop.h, 0, 0, cols, rows)
  const pixels = ctx.getImageData(0, 0, cols, rows).data

  const keepCell = (column: number, row: number) => {
    const index = (row * cols + column) * 4
    const r = pixels[index]
    const g = pixels[index + 1]
    const b = pixels[index + 2]
    const alpha = pixels[index + 3]
    if (alpha < 16) return false
    if (isStudioBackground(r, g, b, bgLuma)) return false
    return true
  }

  let cellMask = new Uint8Array(cols * rows)
  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < cols; column++) {
      if (!keepCell(column, row)) continue
      cellMask[row * cols + column] = 1
    }
  }

  // Cull too aggressive (odd lighting) — keep mid/dark ink so cinema never
  // ships an empty About lane.
  let kept = 0
  for (let index = 0; index < cellMask.length; index++) kept += cellMask[index]
  if (kept === 0) {
    for (let row = 0; row < rows; row++) {
      for (let column = 0; column < cols; column++) {
        const index = (row * cols + column) * 4
        if (pixels[index + 3] < 16) continue
        if (luminance(pixels[index], pixels[index + 1], pixels[index + 2]) > 0.78)
          continue
        cellMask[row * cols + column] = 1
      }
    }
  }

  cellMask = dilateMask(cellMask, cols, rows)
  let keepers = 0
  for (let index = 0; index < cellMask.length; index++) {
    if (cellMask[index]) keepers += layers
  }

  const chaos = new Float32Array(keepers * 3)
  const home = new Float32Array(keepers * 3)
  const color = new Float32Array(keepers * 3)
  const axis = new Float32Array(keepers * 3)
  const seed = new Float32Array(keepers)
  const size = new Float32Array(keepers)

  const sampleRgb = (column: number, row: number) => {
    const index = (row * cols + column) * 4
    let r = pixels[index]
    let g = pixels[index + 1]
    let b = pixels[index + 2]
    // Dilated holes may land on studio wall — borrow a neighbour face colour.
    if (isStudioBackground(r, g, b, bgLuma)) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = column + dx
          const ny = row + dy
          if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue
          const ni = (ny * cols + nx) * 4
          if (isStudioBackground(pixels[ni], pixels[ni + 1], pixels[ni + 2], bgLuma))
            continue
          return [pixels[ni], pixels[ni + 1], pixels[ni + 2]] as const
        }
      }
    }
    return [r, g, b] as const
  }

  let cursor = 0
  const originX = -width * 0.5
  const originY = height * 0.5

  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < cols; column++) {
      if (!cellMask[row * cols + column]) continue

      const [r, g, b] = sampleRgb(column, row)
      const homeX = originX + (column + 0.5) * cellW
      const homeY = originY - (row + 0.5) * cellH

      for (let layer = 0; layer < layers; layer++) {
        const seedValue = hash01(column * 19.1 + row * 7.3 + layer * 3.7 + 2.4)
        const homeZ = (layer - (layers - 1) * 0.5) * layerPitch
        const i3 = cursor * 3

        home[i3] = homeX
        home[i3 + 1] = homeY
        home[i3 + 2] = homeZ

        // Debris sprays toward camera — shorter throw so the face lands earlier.
        const spray = 0.85 + seedValue * 1.6
        chaos[i3] = homeX + (hash01(seedValue + 1.1) - 0.5) * spray * 1.8
        chaos[i3 + 1] = homeY + (hash01(seedValue + 2.2) - 0.5) * spray * 2.0
        chaos[i3 + 2] = homeZ + 0.7 + hash01(seedValue + 3.3) * 1.8

        const depthTint = 1 - layer * 0.06
        color[i3] = (r / 255) * depthTint
        color[i3 + 1] = (g / 255) * depthTint
        color[i3 + 2] = (b / 255) * depthTint

        const ax = hash01(seedValue + 4.4) * 2 - 1
        const ay = hash01(seedValue + 5.5) * 2 - 1
        const az = hash01(seedValue + 6.6) * 2 - 1
        const axisLen = Math.hypot(ax, ay, az) || 1
        axis[i3] = ax / axisLen
        axis[i3 + 1] = ay / axisLen
        axis[i3 + 2] = az / axisLen

        seed[cursor] = seedValue
        size[cursor] = edge
        cursor += 1
      }
    }
  }

  return { count: cursor, chaos, home, color, axis, seed, size }
}
