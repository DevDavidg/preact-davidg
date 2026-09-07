import { BlendFunction, Effect, EffectAttribute } from 'postprocessing'
import * as THREE from 'three'

/**
 * The well, integrated.
 *
 * This is the finale drawn as the thing it is supposed to be rather than as a
 * picture of it. What was here before was a billboard in the gate's aperture with
 * a domain-warped noise field on it, and it was a good billboard — but a
 * billboard can only ever *add light in front of the room*. It cannot bend the
 * corridor, it cannot hide behind its own shadow, and it cannot show the far side
 * of its own disk, which is the one feature that separates a black hole from a
 * whirlpool.
 *
 * So this runs as a full-screen pass instead, and for each pixel it solves where
 * the light actually came from.
 *
 * ## The physics, and why each piece is here
 *
 * A photon's path around a spherical mass, in the plane containing the ray and
 * the centre, satisfies exactly one equation. With u = 1/r and φ the angle swept
 * about the mass:
 *
 *     d²u/dφ² = -u + (3/2)·Rs·u²
 *
 * The first term alone is a straight line written in polar coordinates. The
 * second — the whole of general relativity, for this purpose — is what makes
 * light fall. Everything below follows from integrating it:
 *
 * - **The shadow.** Rays whose impact parameter is under 3√3/2·Rs reach the
 *   horizon and never come back. That closed-form radius is why the black disc
 *   is 2.6 Rs across rather than 1, and it is also the pass's cheapest and most
 *   valuable early-out.
 * - **The photon ring.** Rays just outside that radius wind several times before
 *   escaping, crossing the disk on each pass, so their brightness diverges
 *   logarithmically at the shadow's edge. It falls out of the integration for
 *   free; nothing here draws a ring.
 * - **The lensed disk.** The integration keeps going after the first crossing, so
 *   the *underside* of the far half of the disk is picked up as a second image
 *   arcing over the top of the shadow. That arc is the recognisable silhouette,
 *   and no flat billboard can produce it at any cost.
 * - **The lensed room.** A ray that escapes leaves along a different direction
 *   than it arrived on. Reprojecting that outgoing direction back to screen space
 *   and sampling the frame the composer already rendered means the corridor
 *   itself — its columns, its consoles, its type — bends around the well. That is
 *   the reason this belongs in the post chain and not in the scene.
 * - **Beaming.** The disk orbits at 0.4c at its inner edge. Relativistic Doppler
 *   makes the limb coming toward the lens brighter than the receding one by a
 *   factor of ten, and that asymmetry is most of what makes the image read as an
 *   object with a physical state rather than as a symmetrical graphic.
 * - **The jets.** What never quite falls in does not stay: the disk's field winds
 *   it up and throws it out along the axis at relativistic speed, in two opposed
 *   beams. They are drawn analytically — the closest approach of each ray to the
 *   axis line is one cross-ratio, not an integration — so the whole phenomenon
 *   costs a handful of flops and one fbm, spent only inside the beam's envelope.
 *
 * ## Why it is affordable
 *
 * Because almost no pixel pays for it. The pass is masked to a feathered disc
 * around the well's projected centre, sized from its own apparent radius, so for
 * the whole corridor it touches a patch inside the gate's doorway and nothing
 * else. Within that mask there are three tiers: pixels outside the disk's reach
 * take a closed-form weak-field deflection, pixels well inside the capture radius
 * get a short budget because their fate is already known, and only the ring — the
 * part that carries the picture — is integrated at full step count. Step count
 * itself comes from the fidelity the governor has settled on.
 *
 * It is also, deliberately, its own pass. `EffectAttribute.CONVOLUTION` is what
 * tells `@react-three/postprocessing` not to merge this into the pass that holds
 * bloom, and mounting it first is what puts it *before* bloom — so the well's
 * light, the ring and the beamed limb all bloom, and the tone mapping at the end
 * of the chain maps the result. Merged in after bloom, the brightest object the
 * site ever draws would have been the only one with no glow.
 */

const fragmentShader = /* glsl */ `
uniform vec3  uCam;
uniform mat4  uToClip;
uniform mat4  uRayBasis;
uniform vec3  uHole;
uniform float uRs;
uniform vec3  uAxis;
uniform vec3  uDiskX;
uniform vec3  uDiskY;
uniform float uInner;
uniform float uOuter;
uniform float uSteps;
uniform float uStep;
uniform float uMask;
uniform float uGate;
uniform float uNearGuard;
uniform float uDepthGuard;
uniform float uSwallow;
uniform float uEclipse;
uniform float uFlow;
uniform float uCharge;
uniform float uSuction;
uniform float uSpin;
uniform float uCapturePro;
uniform float uCaptureRetro;
uniform vec3  uHot;
uniform vec3  uCool;
uniform vec3  uChill;
uniform vec3  uEmber;
uniform vec3  uVoid;

/**
 * Hard ceiling on the integration.
 *
 * GLSL ES 1.00 requires a constant loop bound, so the runtime step count arrives
 * as a uniform and leaves through a break. The ceiling is what the compiler
 * unrolls against; uSteps is what the frame actually spends.
 */
#define BH_MAX_STEPS 112

float bhHash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float bhNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 w = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(bhHash(i), bhHash(i + vec2(1.0, 0.0)), w.x),
    mix(bhHash(i + vec2(0.0, 1.0)), bhHash(i + vec2(1.0, 1.0)), w.x),
    w.y
  );
}

float bhFbm(vec2 p) {
  float total = 0.0;
  float amp = 0.5;
  for (int octave = 0; octave < 4; octave++) {
    total += bhNoise(p) * amp;
    p *= 2.03;
    amp *= 0.5;
  }
  return total;
}

/**
 * Photon Binet equation, equatorial Kerr. a = 0 drops the last two terms and
 * is the Schwarzschild polynomial this pass was born with.
 *
 * b is the signed impact parameter (metres). The 2ab u³ term is frame dragging:
 * same |b|, opposite sides, different curvature — that is the D.
 */
float bhAccel(float u, float b) {
  float acc = -u + 1.5 * uRs * u * u;
  float a = uSpin * uRs * 0.5;
  acc += -2.0 * a * b * u * u * u + a * a * u * u * u * (1.5 * uRs * u - 1.0);
  return acc;
}

/**
 * How long a copy of the gas pattern lives, in units of the flow accumulator.
 *
 * Kepler's third law is the only clock a disk has: Ω ∝ r^-3/2, so the inner rim
 * laps the outer edge, and that shear is the difference between orbiting plasma
 * and a turning decal. Advecting a noise field by an unbounded Ω·t is also how a
 * disk dies — the *radial gradient* of the phase grows without limit, so a minute
 * into the page adjacent pixels are a whole period apart and the band is hash. That
 * is the failure the note this replaced was describing, and the fix there was to
 * give up the shear and spin the pattern rigidly.
 *
 * It can be kept instead, bounded, with the advected-noise construction: the
 * displacement is Ω(r) · rate · mod(flow, period), so the thing that wraps is
 * *time* and not the wound-up phase. That is the whole of the trick and it is easy
 * to get wrong — wrapping the product instead leaves a sawtooth in radius whose
 * slope still grows with the session, which is the same divergence in a costume.
 * With time wrapped, every copy's radial gradient is bounded by
 * rate · period · |dΩ/dr| for the whole life of the page.
 *
 * Two copies, half a period out of step, cross-faded on a triangle that weights
 * each to exactly zero at the instant it is re-seeded, and to a sum of exactly one
 * everywhere. Seven flow units is a re-seed about every half minute at the
 * corridor's rate and a bit over half a turn of relative wind across the disk.
 *
 * ponytail: a gulp drives the flow rate up fifty-fold, so at the peak of one the
 * pattern re-seeds sub-second and the wind reaches two turns. Ceiling: during those
 * beats the band reads as boiling rather than as orbiting — which is close enough
 * to what a gulp is that it earns its keep. Upgrade: scale the period with the rate
 * and accept a longer wind, or advect an actual buffer.
 */
#define BH_KEP_PERIOD 7.0

/**
 * The gas pattern, in the flow's own log-polar frame.
 *
 * phi is the azimuth this copy of the gas *had* when it was seeded and lr is
 * log(r/Rs): equal steps in it are equal ratios of radius, so the turbulence has
 * the same character at the inner rim as at the outer edge and never shows a seam
 * or a scale of its own. seed walks the noise domain once per re-seed, which is
 * what stops the cross-fade from reading as one texture ghosting over itself.
 */
float bhGas(float phi, float lr, float seed, float spiral, float boost) {
  vec2 flow = vec2(phi * 1.35 + spiral + seed, lr * 2.3 - seed * 0.7);
  /*
   * One octave for the warp, four for the detail.
   *
   * This was two full fbm calls, which is six octaves spent on a *displacement* —
   * and a displacement only has to move where the octaves below land, so the high
   * frequencies in it were being thrown away by the very thing they fed. Dropping
   * them is what pays for the second advected copy above at no net cost.
   */
  vec2 warp = vec2(bhNoise(flow * 1.2), bhNoise(flow * 1.2 + vec2(4.7, 2.1)));
  /*
   * The exponent does the contrast, and it is spent on the *holes* rather than on
   * the peaks: bloom sits downstream and a new peak would wash the shadow, while
   * dark gaps between filaments are what turn a cloudy band into braided plasma.
   */
  float grain = pow(clamp(bhFbm(flow * 2.35 + warp * 1.4), 0.0, 1.0), 1.9);
  /*
   * Filaments, not arms: the magnetorotational instability shreds the flow into
   * uneven streams rather than steady spirals. Three azimuthal modes at
   * incommensurate counts and weights keep the pattern from reading as a turning
   * candy, and the sharp exponents pinch each mode into a filament feeding the rim.
   *
   * All three ride the same phi, so they shear with the gas instead of drifting
   * at three private rates of their own. They used to have those rates, and it is
   * the reason the band read as three superimposed animations: they are one fluid.
   *
   * ponytail: 4 octaves + 3 modes, twice over. Ceiling: the fbm's own lattice
   * tiles if the finale is held open for many minutes. Upgrade: a third noise
   * scale, not a 3D texture.
   */
  float stream =
    pow(abs(sin(phi * 3.0 + lr * 4.2)), 9.0) * 0.7 +
    pow(abs(sin(phi * 5.0 - lr * 6.1)), 14.0) * 0.5 +
    pow(abs(sin(phi * 8.0 + lr * 2.3)), 18.0) * 0.35;
  return max(grain, stream * boost);
}

/**
 * What the disk looks like where a ray crossed it.
 *
 * Returns emission in rgb and the opacity that emission cost, so the caller can
 * accumulate front to back: the near half of the disk genuinely occludes the far
 * half and the shadow behind it.
 *
 * column is the path length the ray just spent inside the slab, measured by the
 * caller against the slab's own thickness (1 = straight through the middle).
 */
vec4 bhDisk(vec3 pos, float radius, vec3 tangent, float column) {
  float span = max(uOuter - uInner, 0.001);
  float t = clamp((radius - uInner) / span, 0.0, 1.0);

  /*
   * The inner edge is abrupt and the outer edge is not. Inside the innermost
   * stable orbit there is nothing to hold matter in a circle, so the disk stops;
   * outward it only thins, which is why a real image has a hard bright rim facing
   * the hole and no boundary at all on the outside.
   */
  float edge = smoothstep(0.0, 0.055, t) * (1.0 - smoothstep(0.42, 1.0, t));
  if (edge < 0.002) return vec4(0.0);

  float rn = max(radius / uRs, 1.0);
  float angle = atan(dot(pos, uDiskY), dot(pos, uDiskX));

  /*
   * The flow, advected at the Keplerian rate.
   *
   * Ω ∝ r^-3/2 — Kepler's third law — so the gas at the inner rim really does lap
   * the gas at the outer edge, and the pattern it carries has to go round with it.
   * This used to be a fixed spiral turned rigidly by uFlow, with a note
   * explaining that honest differential rotation winds itself into hash. It does;
   * see BH_KEP_PERIOD, which is where the wind-up is now bounded instead of
   * avoided. Two copies of the field, half a cycle apart, each carried at most one
   * wrap before it is re-seeded, cross-faded on a triangle that hands over exactly
   * when the outgoing copy is weighted to nothing.
   *
   * spiral stays pinned to the *actual* radius rather than to the advected
   * azimuth: it is the trailing arm the shear draws out, not something the shear
   * carries, so it must not move with it.
   */
  /*
   * Kepler, with frame dragging: Ω = 1/(r^3/2 + a), in gravitational radii.
   *
   * The bare r^-3/2 law puts 20.9:1 of shear between this disk's rim and its outer
   * edge. The +a term is the dragging, and it softens that to the 17.6:1 that
   * a = 0.85 actually has — the hole pulls the outer gas along, so the inner gas
   * laps it less than Newton would have it. The 3.39 normalises Ω back to the value
   * the bare law gave at the ISCO, so the flow rate and the arm pitch below keep the
   * numbers they were tuned at and the only thing that changes is the *ratio* across
   * the disk, which is the only thing that was wrong. rn is in Rs and this wants
   * gravitational radii, hence the 2.
   */
  float omega = 3.39 / (pow(rn * 2.0, 1.5) + uSpin);
  /*
   * Where the pattern is in its own life — one number for every radius, which is
   * what makes the re-seed a global event rather than a set of rings that pop at
   * different times.
   */
  float phase = uFlow / BH_KEP_PERIOD;
  float lead = fract(phase);
  float lag = fract(phase + 0.5);
  // Triangle, zero where a copy pops and one at the middle of its life. The pair
  // sums to one everywhere, so the disk never dims or doubles at a hand-over.
  float carry = 1.0 - abs(1.0 - 2.0 * lead);
  // Radians of azimuth this copy is carried over its whole life. Ω(r) is the only
  // radius-dependent factor, so this is where Kepler enters the picture.
  float sweep =
    omega * (0.62 + uSwallow * 0.95 + uSuction * 1.35) * BH_KEP_PERIOD;
  /*
   * Inward drift, as a rigid translation of the noise domain. Unbounded is fine
   * here and only here: a translation has no radial *gradient* to accumulate, so
   * it cannot alias the way an unbounded shear can.
   */
  float lr = log(rn) - uFlow * (0.45 + uSwallow * 0.7 + uSuction * 1.1) / 2.3;
  float spiral = omega * 7.5 + uSpin * 0.55;
  float boost = 0.25 + uSuction * 0.7 + uSwallow * 0.35;
  float grain = mix(
    bhGas(angle - sweep * lag, lr, floor(phase + 0.5) * 7.31, spiral, boost),
    bhGas(angle - sweep * lead, lr, floor(phase) * 7.31, spiral, boost),
    carry
  );
  /*
   * One hot spot: a clump of gas, not a texture feature. It sits at one radius, so
   * its phase is one radius' worth of Ω rather than the field's — and a lone
   * sinusoid in azimuth has no radial gradient to accumulate, so this one can ride
   * an unbounded phase. sin of the half-angle keeps it one bump per orbit with no
   * seam at ±π.
   */
  /*
   * x*x, never pow(x, 2.0): pow of a negative base is undefined, and this base is
   * a sine, so half the disk was handing exp() a NaN. A NaN here does not stay
   * local — bloom is downstream, and one bad texel spreads through the mip chain
   * and takes the whole frame black. Same reason at the ring.
   */
  float clump = sin((angle - uFlow * 0.85) * 0.5) * 2.2;
  float spot =
    exp(-clump * clump) *
    pow(uInner / max(radius, uInner), 2.0);
  // A clump adds gas, it does not replace it — hence a sum and not a max.
  grain = min(1.35, grain + spot * 0.55);

  /*
   * Shakura–Sunyaev with the zero-torque inner boundary — Novikov–Thorne.
   *
   * T ∝ r^-3/4 on its own makes the inner rim the hottest and brightest point of
   * the disk, and it is not. No torque can be carried across the innermost stable
   * orbit, so the flux takes a [1 − sqrt(r_in/r)] factor that goes to *zero* at the
   * rim and peaks at (49/36)·r_in — 1.36 ISCO radii out. A thermal surface radiates
   * as T⁴, so emission is still r^-3 through the body of the disk; what changes is
   * the inner few Rs, and it changes the shape of the thing.
   *
   * The reference render agrees to the pixel. Its brightest and yellowest sample
   * sits at 1.20 shadow radii and falls off in *both* directions, and its visible
   * span from that peak out to the fade measures 33:1 in linear light against the
   * 39:1 this predicts. The bare law predicted 435:1 — but that is the ratio to a
   * rim nobody can see: at a = 0.85 the ISCO is 1.32 Rs while the shadow reaches
   * 1.53 to 3.37, so the disk's own inner edge stands *behind the shadow* and only
   * the lensed images ever carry it. Which is also the correction to the note above
   * about a hard bright rim: what looks like one in every real image is the photon
   * ring sitting at the shadow's edge, not the disk ending.
   *
   * Normalised so the peak is exactly 1 — the colour ramp below reads thresholds
   * off this, and pow(x, 0.25) is two sqrts, which is cheaper than a pow.
   */
  float rin = uInner / max(radius, uInner);
  float temp = 2.0496 * pow(rin, 0.75) * sqrt(sqrt(max(1.0 - sqrt(rin), 0.0)));
  float radial = temp * temp * temp * temp;

  /*
   * Doppler and gravitational shift.
   *
   * A circular orbit at r has speed sqrt(Rs/2r) in units of c — 0.41c at the
   * innermost stable orbit. toEye is the direction from the emitting material
   * back along the ray the caller is tracing, so the dot product below is the
   * component of that orbital motion aimed at the lens.
   */
  vec3 orbit = normalize(cross(uAxis, pos));
  float beta = clamp(sqrt(0.5 * uRs / max(radius, uRs * 1.001)), 0.0, 0.92);
  float lorentz = 1.0 / sqrt(max(1.0 - beta * beta, 0.001));
  vec3 toEye = -tangent;
  float doppler = 1.0 / max(lorentz * (1.0 - beta * dot(orbit, toEye)), 0.001);
  float wellShift = sqrt(max(1.0 - uRs / max(radius, uRs * 1.001), 0.02));
  float shift = doppler * wellShift;

  /*
   * Relativistic beaming, at the exponent the physics actually has.
   *
   * Observed intensity goes as the fourth power of the total shift. This ran at
   * 3.2 with an apology attached: the honest exponent was said to put a factor of
   * eighty on the approaching limb and tone-map it to a white wedge with no hue.
   * That was the wrong diagnosis. The *peak* barely moves between 3.2 and 4,
   * because at the inner rim the gravitational term cancels most of the boost and
   * the total shift is ~1 — where any exponent is 1. The whole of the extra 0.8 is
   * spent on the dark side, which is exactly where the references put it.
   *
   * The numbers: at the a = 0.85 ISCO the orbital β is 0.6185 in the local
   * non-rotating frame, so edge-on δ_app/δ_rec = (1+β)/(1−β) = 4.24 and the honest
   * ratio is 4.24⁴ = 324:1. β peaks near a = 0.94 and falls again toward extremal,
   * so 0.85 is already at 93% of the most beaming this object can have.
   *
   * What the references *display* is far less, and deliberately so. NASA's edge-on
   * render measures 2.4:1 in linear light. Thorne's own physically-correct frame
   * measures 55:1 and he threw it out — "exceedingly lopsided, with the hole's
   * shadow barely discernible, was obviously unacceptable" — so Interstellar
   * shipped with beaming at 0.80:1, which is to say off. Both are tone-mapping and
   * art-direction decisions taken *after* the physics. This pass emits linear and
   * ACES compresses it downstream, so 324 is the figure to hand it and the frame is
   * where to judge the result. If it ever needs dialling back, dial it here and
   * know that Thorne got there first.
   *
   * The cap stays as a guard rather than as a shaper: the total shift tops out
   * around 1.3 in the mid-disk on its own, so 2.4 is never reached in practice and
   * exists so a future spin or ISCO retune cannot produce an infinity.
   */
  float beam = pow(clamp(shift, 0.05, 2.4), 4.0);

  /*
   * Thickness, from geometry rather than from a volume.
   *
   * The disk is a slab now, not a plane (see the crossing test in the integrator):
   * gas with a scale height, fattest at the inner rim. The caller measured how
   * long this ray's step ran *inside* the slab, so a glancing ray — and at this
   * inclination almost every ray is glancing — arrives with a column far over
   * one, which is what turns a mathematical plane into something with a rim and
   * why the band brightens toward its own edges.
   *
   * ponytail: slab of scalar height. If a true volume is ever asked for, the
   * upgrade is a second crossing at ±h, not a 3D grid.
   */
  float density = edge * (0.34 + grain * 0.92) * column;

  /*
   * Colour by temperature, on the reference renders' own ramp.
   *
   * This mixed on t, the disk's normalised radius, which spreads the hue change
   * evenly across the band. The reference does not: NASA's edge-on visualisation
   * runs white-amber at the rim through orange in the body to a measured #bf3507 on
   * the outer arc, and two thirds of that change happens inside the first three Rs
   * — because it is a T ∝ r^-3/4 ramp, not a linear one. Driving the mix off temp
   * is what puts the change where the reference has it, and it comes free with the
   * brightness law above rather than being a second gradient to keep in step.
   *
   * Three stops the room already owns, and no fourth: a literal blackbody ramp
   * opens on blue-UV and there is no blue anywhere in this sala.
   *
   * Thresholds re-fitted to the Novikov–Thorne temp above, which peaks at 1 around
   * 1.8 Rs, sits at 0.84 by 3 Rs, 0.63 by 5 and 0.40 at the outer edge — a much
   * flatter span than the bare law's, and one that goes back to zero at the rim.
   * Measured against the render's own ramp: amber at 2 shadow radii, #a20301 at
   * three, black by four and a half.
   */
  vec3 tint = mix(uEmber, uCool, smoothstep(0.34, 0.62, temp));
  tint = mix(tint, uHot, smoothstep(0.72, 0.95, temp));
  /*
   * The same shift that set the brightness now spends itself on hue — and spends
   * enough of it that the two limbs read as different *temperatures*, not as the
   * same amber at different gain: the side coming at the lens climbs to champagne
   * (uChill, never past it), the side going away falls to ember and can keep
   * falling toward ink. Still the room's own ramp end to end — a blue-UV wedge is
   * the honest blackbody answer and the wrong one in here.
   */
  tint = mix(tint, uChill, clamp((shift - 1.0) * 0.9, 0.0, 1.0));
  tint = mix(tint, uEmber, clamp((1.0 - shift) * 1.45, 0.0, 1.0));

  /*
   * Optically *thick enough*, and that is the difference between plasma and paint.
   *
   * This returned an opacity of density once, which at the inner rim saturates —
   * the disk became a sheet that blocked everything behind it, and the outer half,
   * where emission has fallen off as r^-3, came out as a dead grey wing over the
   * shadow. A fifth of the density fixed that but left the near half too honest:
   * the front of the disk barely took light away from the lensed far side, so the
   * arc over the top read at the same level as the band crossing in front of it.
   * A third of the density is where the near half genuinely occludes the image
   * behind it — the one occlusion the picture needs — while the body of the gas
   * still shines through itself.
   *
   * The 0.5 on the emission is the counterweight to beam above. Peak brightness
   * still lands well over one — bloom is downstream and wants headroom to find —
   * but the *body* of the disk now sits inside the range tone mapping can render as
   * a colour instead of as white.
   */
  return vec4(
    tint * density * radial * beam * uCharge * (0.5 + uSuction * 1.25 + uSwallow * 0.55),
    clamp(density * 0.34, 0.0, 0.8)
  );
}

/** Rodrigues, for a vector already perpendicular to the axis. */
vec3 bhTurn(vec3 v, vec3 axis, float angle) {
  return v * cos(angle) + cross(axis, v) * sin(angle);
}

/** The frame the composer already rendered, sampled along a bent ray. */
vec3 bhSky(vec3 direction) {
  vec4 clip = uToClip * vec4(direction, 0.0);
  if (clip.w <= 0.0001) return uVoid;
  vec2 uv = clip.xy / clip.w * 0.5 + 0.5;
  /*
   * Drain the room into the well.
   *
   * A geodesic already bends the outgoing direction; this is the extra that
   * reads as suction rather than as a lens: the corridor spirals inward, harder
   * on each gulp, so matter on the sky does not merely wrap — it falls.
   */
  vec4 holeClip = uToClip * vec4(uHole, 1.0);
  if (holeClip.w > 0.0001) {
    vec2 holeUv = holeClip.xy / holeClip.w * 0.5 + 0.5;
    vec2 delta = holeUv - uv;
    float dist = length(delta);
    float drain = (uSwallow * 0.62 + uSuction * 0.34) * exp(-dist * 2.1);
    float spin = uSwallow * 0.72 + uSuction * 0.8;
    float cs = cos(spin * (1.0 - dist));
    float sn = sin(spin * (1.0 - dist));
    uv += vec2(delta.x * cs - delta.y * sn, delta.x * sn + delta.y * cs) * drain;
  }
  /*
   * A screen-space buffer only holds what was in frame. Light that should have
   * been lensed in from behind the lens was never rendered, so rather than
   * smearing the edge pixel across the gap the sample fades to the colour the
   * corridor's own air recedes to — which is what is out there anyway.
   *
   * The window is 2% of the frame rather than 5%. Five was costing the backdrop:
   * the galaxy sits behind the well and its lensed image is exactly the light that
   * comes from the widest escape angles, so a fat fade at the frame edge was
   * throwing away the outer third of the deflected sky and replacing it with the
   * abyss — the well appeared to be surrounded by nothing rather than by a wound-up
   * background. Two percent is still enough to keep the edge texel from smearing.
   */
  vec2 inside =
    smoothstep(vec2(0.0), vec2(0.02), uv) *
    (1.0 - smoothstep(vec2(0.98), vec2(1.0), uv));
  return mix(
    uVoid,
    texture2D(inputBuffer, clamp(uv, vec2(0.001), vec2(0.999))).rgb,
    inside.x * inside.y
  );
}

/**
 * The jets, analytically.
 *
 * What never quite falls in does not stay: the disk's wound-up magnetic field
 * throws it out along the axis at relativistic speed, in two opposed beams.
 * Drawn, not integrated — the closest approach of this ray to the axis line is
 * one cross-ratio, and the beam is a gaussian envelope around that distance with
 * an fbm grain sliding outward along it. The whole phenomenon costs a handful of
 * flops and one fbm, spent only inside the envelope, and the envelope is sized
 * to the mask the pass already has, not the other way round.
 */
vec3 bhJet(vec3 origin, vec3 dir) {
  vec3 w0 = origin - uHole;
  float b = dot(dir, uAxis);
  float d = dot(dir, w0);
  float e = dot(uAxis, w0);
  float denom = max(1.0 - b * b, 0.0001);
  float along = (b * e - d) / denom; // along the ray
  float up = (e - b * d) / denom;    // along the axis, signed: one lobe each way
  if (along < 0.0) return vec3(0.0);

  float jetLen = uOuter * 0.9;
  float axial = abs(up);
  if (axial > jetLen) return vec3(0.0);

  // A beam that opens slowly with distance from the throat.
  float beamR = uRs * 0.22 + axial * 0.11;
  float core = exp(-pow(length(w0 + along * dir - up * uAxis) / beamR, 2.0));
  if (core < 0.004) return vec3(0.0);

  float lobe = sign(up);
  float grain = 0.45 + 0.55 * bhFbm(vec2(
    axial * 1.6 - lobe * uFlow * 2.2,
    length(w0 + along * dir - up * uAxis) * 6.0
  ));
  float envelope = 1.0 - axial / jetLen;
  envelope *= envelope;
  // The beam fired at the lens runs a little hotter than the one fired away.
  float boost = mix(0.7, 1.35, 0.5 + 0.5 * dot(uAxis * lobe, -dir));

  // Paler than the rim, and dark until the gate is fully armed: in the corridor
  // there are no two searchlights coming out of the stator.
  // ...and "dark" means off, not dim: a window on the last sixth of the gate,
  // where the room has already gone. uGate² still left two visible beams
  // standing in the corridor at half a gate.
  vec3 tint = mix(uChill, uHot, 0.35);
  return tint * core * grain * envelope * boost *
    smoothstep(0.85, 1.0, uGate) * uCharge *
    (0.12 + uSuction * 0.5 + uSwallow * 0.3);
}

void mainImage(const in vec4 inputColor, const in vec2 uv, const in float depth, out vec4 outputColor) {
  outputColor = inputColor;
  if (uGate < 0.002 || uRs < 0.0001) return;

  // Where the well is on screen. Behind the lens, there is nothing to draw.
  vec4 holeClip = uToClip * vec4(uHole, 1.0);
  if (holeClip.w <= 0.001) return;

  // aspect is one of the pass's own uniforms, so the mask below is measured in
  // frame-height units and a wide monitor does not get a wider event horizon.
  vec2 holeUv = holeClip.xy / holeClip.w * 0.5 + 0.5;
  vec2 offset = (uv - holeUv) * 2.0 * vec2(aspect, 1.0);

  /*
   * The gate on the whole pass.
   *
   * Sized from the well's own apparent radius, feathered over its outer quarter.
   * The deflection falls off as 1/b on its own, so the feather is not hiding a
   * seam — it is buying back the ninety-odd percent of the frame where the answer
   * would have been "unchanged" at the cost of a hundred integration steps.
   */
  float mask = (1.0 - smoothstep(uMask * 0.74, uMask, length(offset))) * uGate;
  /*
   * Nothing here rides the gulp. Driving the mask off suction — its size *or* its
   * opacity — is what flashed the frame: the mask reaches the corners at its
   * ceiling, and forcing its feather opaque for a beat handed the corners to a
   * bent sample that lands off-frame, i.e. to the abyss. A gulp belongs in the
   * gas, and it is there: uSuction is in the emission, the flow, the drain, the ring.
   */

  /*
   * What the room puts in front of the well does not get bent by it.
   *
   * The pass has no idea what it is sampling — it warps whatever the composer
   * handed it — so a console plate at reading distance, sitting a couple of
   * degrees off the aperture, had the shadow drawn straight through its copy. That
   * is not a lens, it is a hole burnt in a panel: light from an object *nearer*
   * than the well never went near the well.
   *
   * uNearGuard is the window-space depth of a point well short of the
   * singularity, so anything the scene drew in front of that is left exactly as it
   * was drawn, while the gate itself — which stands almost at the well and is the
   * one structure worth seeing wound around it — is comfortably past the line.
   * Most of this room writes no depth at all (see ReconstructMaterial), and that
   * is the right answer too: light really does pass through a cloud of shards.
   *
   * The guard lifts as the room goes in. Once the corridor is inside the field,
   * "in front of" has stopped meaning anything worth protecting.
   *
   * But the guard cedes at the core, and it has to.
   *
   * A plate is a rectangle, and the guard is a step: where a plate's edge crossed
   * the lensed region the guard turned the pass off along a straight line, which
   * read as a hard vertical seam down the frame with the left half lensed and the
   * right half not. That is a worse artefact than the one the guard exists to
   * prevent, and it got obvious rather than newly-broken once the backdrop behind
   * the well grew real signal to be discontinuous *in* — the same seam over an
   * empty sky had nothing to show it. Feathering the threshold cannot fix it: the step
   * is in the plate's geometry, not in the threshold.
   *
   * So the guard is scoped to where it earns its keep. Inside a third of the mask
   * live the shadow and the photon ring — the shadow's apparent radius runs
   * 0.29 of the mask down to 0.14 as the drain opens it, so a third clears it at
   * every stop — and there the well wins unconditionally, because the one hard
   * rule of this page is that nothing stands in front of the horizon. Out at the
   * feather, where a console at reading distance actually sits and where 1/b has
   * taken the deflection down to nearly nothing anyway, the guard keeps full
   * authority. The plate edge still exists out there; it is now a step in a term
   * the mask is already fading to zero, which is why it stops reading as an edge.
   */
  float ahead = smoothstep(uNearGuard - 0.004, uNearGuard, depth);
  float cede = smoothstep(uMask * 0.34, uMask * 0.78, length(offset));
  mask *= mix(1.0, ahead, uDepthGuard * cede);
  if (mask < 0.004) return;

  vec4 far = uRayBasis * vec4(uv * 2.0 - 1.0, 1.0, 1.0);
  vec3 dir = normalize(far.xyz / far.w - uCam);

  vec3 rel = uCam - uHole;
  float startRadius = length(rel);
  vec3 radialAxis = rel / startRadius;
  vec3 plane = cross(radialAxis, dir);
  float sinA = length(plane);

  // Dead centre: no orbital plane to work in, and the ray is going straight down
  // the well. Nothing comes back out of that.
  if (sinA < 0.00002) {
    float inbound = step(dot(dir, radialAxis), 0.0);
    outputColor = vec4(mix(inputColor.rgb, vec3(0.0), clamp(mask * inbound, 0.0, 1.0)), inputColor.a);
    return;
  }

  plane /= sinA;
  vec3 swing = cross(plane, radialAxis);
  float cosA = dot(dir, radialAxis);

  float impact = startRadius * sinA;
  /*
   * Angular momentum of the ray about the spin axis, as a projection and not as a
   * verdict.
   *
   * This read sign(dot(plane, uAxis)), and that put a hard seam straight down the
   * middle of the frame. The set where the ray's orbital plane contains the spin
   * axis is a curve through the well's projected centre — with the axis near world
   * up and the lens on the corridor's Z, it is very nearly the vertical line — and
   * across it sign() flipped the frame-dragging term in bhAccel from fully prograde
   * to fully retrograde in one pixel. Every trajectory either side of that line was
   * integrated with the opposite curvature, so the disk, the ring and the lensed
   * room all stepped across a visible edge.
   *
   * The projection is also the honest quantity: a ray whose plane contains the axis
   * carries no angular momentum about it and is dragged neither way. sign() was
   * claiming the maximum of one or the other for exactly those rays.
   */
  float sense = dot(plane, uAxis);
  float b = sense * impact;
  /*
   * Silhouette by azimuth, not a left/right switch. Two capture radii with
   * step() put a crease down the middle of the shadow (1.5 vs 3.4 Rs at
   * a = 0.85). Cosine around the rim is the D a Kerr hole actually casts.
   *
   * ponytail: the cosine gets the width exactly right — 1.527 + 3.374 = 4.90 Rs
   * against Bardeen's 4.90 for a = 0.85 at this inclination — and the height 6%
   * short, 4.90 against 5.196 (the polar extent is spin-independent, because polar
   * photons carry no angular momentum about the axis to be dragged). Ceiling: a
   * shadow that is a smooth egg rather than a circle with one flattened edge, and
   * one twentieth too short. Upgrade: a second uniform for the polar semi-axis, if
   * anyone can see six percent.
   */
  float side = offset.x / max(length(offset), 0.0001);
  float capture =
    mix(uCaptureRetro, uCapturePro, 0.5 + 0.5 * side) * uRs;

  /*
   * Tier one: too far out to matter.
   *
   * Beyond the disk's own edge the ray never touches matter and the field is
   * weak, where the deflection is 2Rs/b to better than a percent. One rotation
   * replaces the whole integration, and this is the tier most of the masked area
   * falls into for most of the page.
   */
  if (impact > max(uOuter, uRs * 14.0) * 1.02) {
    vec3 bent = bhTurn(
      dir,
      plane,
      (2.0 + uSwallow * 5.2 + uSuction * 2.0) * uRs / impact +
        uSpin * 2.0 * uRs / impact * sense
    );
    outputColor = vec4(mix(inputColor.rgb, bhSky(bent), clamp(mask, 0.0, 1.0)), inputColor.a);
    return;
  }

  /*
   * Tier two: how much integration this ray has earned.
   *
   * Well inside the capture radius the outcome is already known — the ray goes in
   * — and all that is left to find is the sliver of disk it crosses on the way,
   * which takes a fraction of the budget. The full count is spent near the
   * capture radius, where rays wind repeatedly and every one of those windings is
   * a feature of the image.
   */
  float budget = uSteps * mix(
    0.3,
    1.0,
    smoothstep(capture * 0.5, capture * 1.06, impact)
  );

  // Named arc, not step: GLSL already has a step, and shadowing a builtin
  // inside the one function that also calls it is a compile error waiting to be
  // introduced by the next edit.
  float arc = uStep;
  float turnC = cos(arc);
  float turnS = sin(arc);

  float u = 1.0 / startRadius;
  float du = -u * cosA / sinA;
  float startU = u;
  float rPlus = 0.5 * uRs * (1.0 + sqrt(max(1.0 - uSpin * uSpin, 0.0)));
  float horizonU = 1.0 / max(rPlus, 0.0001);

  float cosPhi = 1.0;
  float sinPhi = 0.0;
  float height = dot(radialAxis, uAxis);
  float heightA = height;
  float heightB = dot(swing, uAxis);

  vec3 glow = vec3(0.0);
  float through = 1.0;
  float captured = 0.0;

  for (int index = 0; index < BH_MAX_STEPS; index++) {
    if (float(index) >= budget) break;

    /*
     * Classical fourth-order Runge–Kutta.
     *
     * Not an extravagance. A second-order step loses the photon sphere: rays that
     * should wind twice and come back out are thrown into the horizon instead, so
     * the ring they draw — the brightest and most recognisable feature of the
     * whole image — simply is not there. Four evaluations of a five-flop
     * polynomial is the cheapest way to keep it.
     */
    float a1 = bhAccel(u, b);
    float a2 = bhAccel(u + 0.5 * arc * du, b);
    float a3 = bhAccel(u + 0.5 * arc * (du + 0.5 * arc * a1), b);
    float a4 = bhAccel(u + arc * (du + 0.5 * arc * a2), b);

    float uPrev = u;
    float duPrev = du;
    u += arc * du + arc * arc * (a1 + a2 + a3) / 6.0;
    du += arc * (a1 + 2.0 * a2 + 2.0 * a3 + a4) / 6.0;

    // Rotate the angle rather than recomputing it: two transcendentals per step
    // over a hundred steps is a real cost, and a complex multiply is exact.
    float cosNext = cosPhi * turnC - sinPhi * turnS;
    float sinNext = sinPhi * turnC + cosPhi * turnS;

    float heightNext = cosNext * heightA + sinNext * heightB;

    /*
     * The slab: the disk has a scale height now, not just a plane.
     *
     * The signed height above the plane is still a pure sinusoid in φ, but the
     * disk is the band |height| < h(r), with h/r fattest at the inner rim (~0.08)
     * and thinner outward — gas puffed by its own radiation pressure near the
     * hole, settling where it cools. Any *overlap* of the step with that band is
     * matter, whether or not the sign changed, so a ray grazing the rim without
     * crossing still meets gas: that is where the thickness in the image comes
     * from. Emission is weighted by the share of the step spent inside, so a
     * steep puncture and a long graze each pay for exactly the gas they touched.
     */
    float radiusPrev = 1.0 / max(uPrev, 0.0001);
    float radiusNow = 1.0 / max(u, 0.0001);
    float h0 = height * radiusPrev;
    float h1 = heightNext * radiusNow;
    float radiusMid = 0.5 * (radiusPrev + radiusNow);
    float halfH = radiusMid * mix(0.08, 0.045, clamp(
      (radiusMid - uInner) / max(uOuter - uInner, 0.001), 0.0, 1.0
    ));
    float ovLo = max(min(h0, h1), -halfH);
    float ovHi = min(max(h0, h1), halfH);

    if (ovHi > ovLo && through > 0.012) {
      float blend = abs(h1 - h0) < 0.000001
        ? 0.5
        : clamp((0.5 * (ovLo + ovHi) - h0) / (h1 - h0), 0.0, 1.0);
      float crossU = mix(uPrev, u, blend);
      float radius = 1.0 / max(crossU, 0.0001);

      if (radius > uInner * 0.9 && radius < uOuter * 1.3) {
        vec2 turn = normalize(vec2(
          mix(cosPhi, cosNext, blend),
          mix(sinPhi, sinNext, blend)
        ));
        vec3 pos = radius * (turn.x * radialAxis + turn.y * swing);
        /*
         * The ray's own direction where it crossed, scaled by u² so the terms
         * stay small: the radial part carries 1/u² and the sweep carries 1/u, and
         * at large radius those are numbers a float should not be asked to hold
         * before being normalised away again.
         */
        float crossDu = mix(duPrev, du, blend);
        vec3 tangent = normalize(
          -crossDu * (turn.x * radialAxis + turn.y * swing) +
          crossU * (-turn.y * radialAxis + turn.x * swing)
        );

        /*
         * Path through the gas, in units of the slab's full thickness: one for a
         * perpendicular puncture through the middle, growing like 1/sinθ for a
         * graze, capped where the old 1/cos term was capped.
         */
        float column = min(
          3.8 + uSuction * 1.1,
          (ovHi - ovLo) / max(2.0 * halfH, 0.0001)
        );

        vec4 emission = bhDisk(pos, radius, tangent, column);
        glow += through * emission.rgb;
        through *= 1.0 - emission.a;
      }
    }

    cosPhi = cosNext;
    sinPhi = sinNext;
    height = heightNext;

    if (u >= horizonU) {
      captured = 1.0;
      break;
    }
    // On its way back out and already past where it started: gone for good.
    if (du < 0.0 && u <= startU) break;
  }

  vec3 sky = vec3(0.0);
  if (captured < 0.5) {
    float safeU = max(u, 0.0001);
    vec3 escape = normalize(
      -du * (cosPhi * radialAxis + sinPhi * swing) +
      safeU * (-sinPhi * radialAxis + cosPhi * swing)
    );
    sky = bhSky(escape);
  }

  /*
   * The photon ring, underwritten.
   *
   * The integration produces it honestly — brightness diverges as the impact
   * parameter approaches the capture radius because the number of disk crossings
   * does — but a divergence sampled on a finite grid at a finite step count comes
   * out as a dotted line. This is the analytic form of the same quantity, laid
   * over the top so the edge of the shadow is a continuous filament at every
   * resolution the site is ever drawn at.
   *
   * Width from the references rather than from taste. EHT's published rings are
   * beam-blurred to roughly half their own diameter, but the *intrinsic* photon
   * ring in every simulated image behind those papers — and the filament visibly
   * tracing the top of the shadow in NASA's edge-on render — is on the order of one
   * percent of the shadow's diameter. σ = 2.2% of the radius is that, and it is the
   * narrowest a Gaussian can be here without the line breaking up between pixels.
   */
  // Signed base — impact runs under capture everywhere inside the shadow — so
  // squared, not pow(). See the clump in bhDisk.
  float off1 = (impact - capture) / max(capture * 0.022, 0.0001);
  float ring = exp(-off1 * off1);
  /*
   * N=2: the same light after one more winding — thinner, a hair further in,
   * and about 1/e of N=1's amplitude. The cascade stops here on purpose: a
   * finite RK4 budget cannot produce N=3, and the image does not promise it.
   */
  float off2 = (impact - capture * 0.993) / max(capture * 0.010, 0.0001);
  ring += 0.37 * exp(-off2 * off2);

  /*
   * Crossing: the blaze, and then nothing.
   *
   * Falling the last stretch toward a horizon does two opposite things to what you
   * can see. Light from outside piles up into a narrowing band and *brightens* —
   * blueshifted by the fall — and then the redshift of the well wins outright and
   * every photon that ever came from anywhere is stretched past the point of being
   * light at all. So the ending is a flare and then a black frame, in that order,
   * and both are the same physics running out.
   *
   * The blaze peaks a third of the way through the crossing; survives takes it,
   * and everything else, the rest of the way to zero. It is applied to the sky as
   * well as to the disk because nothing is exempt: what goes out is not the well's
   * light, it is the whole outside.
   */
  float blaze = 1.0 + uEclipse * 14.0 * (1.0 - uEclipse) * (1.0 - uEclipse);
  float survives = 1.0 - uEclipse;
  /*
   * ...and the ring goes out last, which is why the eclipse can afford to be real.
   *
   * uEclipse used to arrive attenuated to a twelfth of its authority, because at
   * full strength the ending was an empty rectangle. The empty rectangle was not
   * the eclipse's fault: everything in frame was multiplied by the same
   * survives, so the last thing to disappear was nothing in particular.
   *
   * A fall toward a horizon does not do that. Aberration squeezes the whole
   * outside sky into a narrowing band around the direction of travel while the
   * redshift takes the rest, so the last thing there is to see is a thinning bright
   * arc at the edge of the shadow — and then it too is gone. Square-rooting the
   * ring's share of the eclipse schedules it *after* the disk and the sky instead
   * of with them: at the end of the rail the disk is at 15% and the filament at
   * 39%, so what is held is a portrait of a ring rather than a black frame.
   */
  float ringSurvives = sqrt(survives);

  // The ring is the disk's own light taken the long way round, so it is the disk's
  // own colour — a shade paler for having come from the innermost orbits, not a
  // different substance. Kept out of glow so the eclipse can outlive it: it is
  // the one thing in frame that is not on the same schedule as everything else.
  //
  // Three times its old amplitude. It was underwritten at 0.18 against a disk rim
  // that peaks near 6, which put the single most recognisable feature of the whole
  // image a factor of thirty under the band it rings — it read as a seam on the
  // shadow rather than as the filament that only a black hole can draw.
  //
  // Brighter on the flat side of the D, and not by coincidence: the side the
  // dragging pulls the capture radius in on is the side the gas co-rotates toward
  // the lens on, so the filament is beamed there for the same reason the disk's
  // limb is. Reusing side — the prograde weight the shadow was cut with — lands
  // the bright arc on the flattened edge for free. An even ring around an uneven
  // shadow is the one thing none of the references show.
  vec3 halo = mix(uHot, uChill, 0.5) * ring *
    mix(0.5, 1.5, 0.5 + 0.5 * side) *
    (0.55 + uSwallow * 0.9 + uSuction * 0.25) * uCharge * blaze;

  /*
   * The jets, last and gated by what the ray survived: through keeps them from
   * painting over the near half of the disk, and captured keeps them out of the
   * shadow — a beam that crossed the black disc would be light coming out of the
   * hole, which is the one thing this image must never show.
   */
  glow += bhJet(uCam, dir) * through * (1.0 - captured);

  vec3 lit = (glow + sky * through) * survives + halo * ringSurvives;
  outputColor = vec4(mix(inputColor.rgb, lit, clamp(mask, 0.0, 1.0)), inputColor.a);
}
`

export interface BlackHoleEffectOptions {
  /** Integration steps at full fidelity. */
  steps?: number
}

/** Total angle the integration is allowed to sweep, in radians. */
const PHI_SPAN = Math.PI * 2.35

export class BlackHoleEffect extends Effect {
  constructor({ steps = 88 }: BlackHoleEffectOptions = {}) {
    super('BlackHoleEffect', fragmentShader, {
      /*
       * Not a convolution in the kernel sense — this samples one texel, just not
       * the one under the fragment. The attribute is what earns the effect its own
       * `EffectPass`, and therefore its position *before* bloom in the chain, and
       * without it the pass that draws the brightest object on the site would be
       * the one object on the site with no glow.
       */
      /*
       * CONVOLUTION earns the effect its own pass — see below. DEPTH is what makes
       * the composer allocate and wire a depth texture, which the guard in
       * `mainImage` reads to leave anything drawn in front of the well alone.
       */
      attributes: EffectAttribute.CONVOLUTION | EffectAttribute.DEPTH,
      blendFunction: BlendFunction.NORMAL,
      uniforms: new Map<string, THREE.Uniform>([
        ['uCam', new THREE.Uniform(new THREE.Vector3())],
        ['uToClip', new THREE.Uniform(new THREE.Matrix4())],
        ['uRayBasis', new THREE.Uniform(new THREE.Matrix4())],
        ['uHole', new THREE.Uniform(new THREE.Vector3())],
        ['uRs', new THREE.Uniform(0)],
        ['uAxis', new THREE.Uniform(new THREE.Vector3(0, 1, 0))],
        ['uDiskX', new THREE.Uniform(new THREE.Vector3(1, 0, 0))],
        ['uDiskY', new THREE.Uniform(new THREE.Vector3(0, 0, 1))],
        ['uInner', new THREE.Uniform(0)],
        ['uOuter', new THREE.Uniform(0)],
        ['uSteps', new THREE.Uniform(steps)],
        ['uStep', new THREE.Uniform(PHI_SPAN / steps)],
        ['uMask', new THREE.Uniform(0)],
        ['uGate', new THREE.Uniform(0)],
        ['uNearGuard', new THREE.Uniform(0)],
        ['uDepthGuard', new THREE.Uniform(0)],
        ['uSwallow', new THREE.Uniform(0)],
        ['uEclipse', new THREE.Uniform(0)],
        ['uFlow', new THREE.Uniform(0)],
        ['uCharge', new THREE.Uniform(0)],
        ['uSuction', new THREE.Uniform(0)],
        ['uSpin', new THREE.Uniform(0)],
        ['uCapturePro', new THREE.Uniform(2.5980762)],
        ['uCaptureRetro', new THREE.Uniform(2.5980762)],
        ['uHot', new THREE.Uniform(new THREE.Color())],
        ['uCool', new THREE.Uniform(new THREE.Color())],
        ['uChill', new THREE.Uniform(new THREE.Color())],
        ['uEmber', new THREE.Uniform(new THREE.Color())],
        ['uVoid', new THREE.Uniform(new THREE.Color())],
      ]),
    })
  }

  /**
   * Sets the integration budget.
   *
   * The φ span is fixed, so the step count and the step size move together — a
   * coarser budget must not also mean a shorter trajectory, or the secondary
   * image drops out of the picture on exactly the devices that most need it to
   * still look like the same site.
   */
  setSteps(steps: number) {
    const clamped = Math.max(16, Math.min(112, Math.round(steps)))
    this.uniforms.get('uSteps')!.value = clamped
    this.uniforms.get('uStep')!.value = PHI_SPAN / clamped
  }

  uniform(name: string): THREE.Uniform {
    const found = this.uniforms.get(name)
    if (!found) throw new Error(`BlackHoleEffect: no uniform ${name}`)
    return found
  }
}
