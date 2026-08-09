/**
 * Soft assemble / disassemble — one calm ease in, one calm ease out.
 * No micro-shatter loops (those read as noise).
 */

export const clamp01 = (value: number) => Math.min(1, Math.max(0, value))

const smoothstep01 = (t: number) => {
  const x = clamp01(t)
  return x * x * (3 - 2 * x)
}

/** Single soft gather. `t` is 0..1 through the enter window. */
export const softAssemble = (t: number): number => smoothstep01(clamp01(t))

/**
 * Soft leave: presence fades, scatter stays near-zero so nothing explodes.
 */
export const softDisassemble = (
  t: number,
): { presence: number; scatter: number } => {
  const p = clamp01(t)
  return {
    presence: 1 - smoothstep01(p),
    scatter: smoothstep01(p) * 0.12,
  }
}

/** Gentle scale settle — tiny overshoot only. */
export const punchScale = (assemble: number, leaveScatter: number): number => {
  const overshoot = assemble * (1 - assemble) * 0.35
  const enter = 0.92 + assemble * 0.08 + overshoot * 0.04
  return enter * (1 - leaveScatter * 0.08)
}

/** @deprecated — kept as aliases so call sites can migrate without churn. */
export const tripleAssemble = softAssemble
export const tripleDisassemble = softDisassemble
