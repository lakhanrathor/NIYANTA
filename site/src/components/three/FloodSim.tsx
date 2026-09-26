import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Html, OrbitControls, Sky } from '@react-three/drei'
import * as THREE from 'three'
import { Icon } from '../Icon'

/* ───────────── Terrain: a procedural Himalayan-style valley ───────────── */

const X0 = -14
const X1 = 16
const Z0 = -8
const Z1 = 8
const SEG_X = 300
const SEG_Z = 170
const X_DAM = -9
const RANGE = X1 - X_DAM // reach of the flood wave by T_MAX
const T_MAX = 12 // hours
const BREACH_TIME = 0.8 // hours, Tb

function hash(x: number, y: number) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453
  return s - Math.floor(s)
}
function vnoise(x: number, y: number) {
  const ix = Math.floor(x), iy = Math.floor(y)
  const fx = x - ix, fy = y - iy
  const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy)
  const a = hash(ix, iy), b = hash(ix + 1, iy), c = hash(ix, iy + 1), d = hash(ix + 1, iy + 1)
  return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy
}
function fbm(x: number, y: number) {
  let v = 0, a = 0.5, f = 1
  for (let i = 0; i < 5; i++) {
    v += a * vnoise(x * f, y * f)
    f *= 2.03
    a *= 0.5
  }
  return v
}

const center = (x: number) => 1.0 * Math.sin(x * 0.32 + 0.4) + 0.45 * Math.sin(x * 0.85)
const bed = (x: number) => 1.6 - 0.11 * (x - X0)
const halfWidth = (x: number) => 0.7 + 0.12 * (x - X0)
const DAM_TOP = 1.6 - 0.11 * (X_DAM - X0) + 1.7

function terrainHeight(x: number, z: number) {
  const dz = z - center(x)
  const w = halfWidth(x)
  const wall = 1 - Math.exp(-((dz / w) ** 2))
  const relief = 1.9 * wall * (1.2 - 0.03 * (x - X0))
  const rough = (fbm(x * 0.45 + 10, z * 0.45) - 0.5) * 1.5 * wall
  const fine = (fbm(x * 1.6, z * 1.6 + 5) - 0.5) * 0.25 * wall
  return bed(x) + relief + rough + fine
}

/* ───────────── Illustrative flood wave (kinematic, not solver output) ───────────── */

const smooth = (e0: number, e1: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)))
  return t * t * (3 - 2 * t)
}
const breachProgress = (T: number) => smooth(0, BREACH_TIME, T)
const arrivalTime = (x: number) => (x <= X_DAM ? 0 : T_MAX * Math.pow((x - X_DAM) / RANGE, 1 / 0.7))
const reservoirLevel = (T: number) => DAM_TOP - 0.1 - 0.85 * breachProgress(T) * (1 - Math.exp(-T / 1.6))

function sectionDepth(x: number, T: number) {
  const tau = T - arrivalTime(x)
  if (tau <= 0) return 0
  const dist = x - X_DAM
  const peak = 1.25 * Math.exp(-dist / 9) + 0.25
  const rise = 1 - Math.exp(-tau / 0.35)
  const recede = Math.exp(-tau / (5 + 0.35 * dist))
  return peak * rise * recede * breachProgress(T + 0.3)
}

const BASE_RIVER = 0.14
const TOWNS = [
  { name: 'Village A', x: -5.4, side: 0.42, homes: 14, r: 0.5, big: false },
  { name: 'Town B', x: 0.6, side: -0.38, homes: 26, r: 0.8, big: false },
  { name: 'City C', x: 7.2, side: 0.3, homes: 48, r: 1.25, big: true },
  { name: 'Town D', x: 12.6, side: -0.32, homes: 26, r: 0.9, big: false },
].map((t) => {
  const z = center(t.x) + halfWidth(t.x) * t.side
  return { ...t, z, y: terrainHeight(t.x, z), arrival: arrivalTime(t.x) }
})

type Mode = 'realistic' | 'depth' | 'velocity' | 'arrival'

/* ───────────── Scene ───────────── */

const SUN = new THREE.Vector3(-0.55, 0.42, 0.72).normalize()

/** Surface normal of the analytic terrain, by central differences. */
function terrainNormal(x: number, z: number) {
  const e = 0.05
  const dx = terrainHeight(x + e, z) - terrainHeight(x - e, z)
  const dz = terrainHeight(x, z + e) - terrainHeight(x, z - e)
  return new THREE.Vector3(-dx, 2 * e, -dz).normalize()
}

/** Deterministic PRNG so trees and houses land in the same place every load. */
function rng(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647
    return (seed - 1) / 2147483646
  }
}

function Terrain({ heights }: { heights: Float32Array }) {
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(X1 - X0, Z1 - Z0, SEG_X, SEG_Z)
    const pos = g.attributes.position as THREE.BufferAttribute
    for (let i = 0; i < pos.count; i++) pos.setXYZ(i, pos.getX(i), heights[i], -pos.getY(i))
    g.computeVertexNormals()
    const nrm = g.attributes.normal as THREE.BufferAttribute
    const colors = new Float32Array(pos.count * 3)
    const silt = new THREE.Color('#8b7b5e')
    const grass = new THREE.Color('#5f7d3b')
    const forest = new THREE.Color('#344f2a')
    const soil = new THREE.Color('#5c5645')
    const rock = new THREE.Color('#6b6d68')
    const snow = new THREE.Color('#eef3f6')
    const c = new THREE.Color()
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i)
      const z = pos.getZ(i)
      const rel = heights[i] - bed(x)
      const flat = nrm.getY(i) // 1 = flat, lower = steeper
      const n = fbm(x * 2.3 + 7, z * 2.3) // patchiness
      if (rel < 0.25) c.copy(silt).lerp(grass, rel / 0.25)
      else if (rel < 1.3) c.copy(grass).lerp(forest, THREE.MathUtils.clamp((rel - 0.25) / 1.05 + (n - 0.5), 0, 1))
      else if (rel < 2.2) c.copy(forest).lerp(soil, ((rel - 1.3) / 0.9) * 0.45)
      else c.copy(forest).lerp(soil, 0.45).lerp(rock, Math.min(1, (rel - 2.2) / 0.5))
      if (flat < 0.8) c.lerp(rock, THREE.MathUtils.clamp((0.8 - flat) * 3, 0, 1)) // cliffs are bare rock
      if (rel > 2.9 + (n - 0.5) * 0.4 && flat > 0.75) c.lerp(snow, Math.min(1, (rel - 2.9) * 1.2))
      c.multiplyScalar(0.9 + n * 0.2)
      colors.set([c.r, c.g, c.b], i * 3)
    }
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    return g
  }, [heights])
  return (
    <mesh geometry={geo} receiveShadow castShadow>
      <meshStandardMaterial vertexColors roughness={0.92} metalness={0} />
    </mesh>
  )
}

/* ───────────── Flood damage: houses, trees, bridge, debris ───────────── */

/** Water surface elevation in the downstream channel at x, time T (same formula the water mesh uses). */
const surfaceAt = (x: number, T: number) => bed(x) + BASE_RIVER + sectionDepth(x, T)

/** First time on a coarse grid at which `test` holds, or Infinity. */
function firstTime(test: (T: number) => boolean) {
  for (let T = 0; T <= T_MAX; T += 0.04) if (test(T)) return T
  return Infinity
}

type House = { x: number; y: number; z: number; w: number; d: number; h: number; rot: number; town: number; tWet: number; tFail: number; drift: number; tone: number }

const HOUSES: House[] = (() => {
  const r = rng(7)
  const out: House[] = []
  TOWNS.forEach((t, ti) => {
    let placed = 0
    for (let k = 0; k < t.homes * 20 && placed < t.homes; k++) {
      const a = r() * Math.PI * 2
      const rad = Math.sqrt(r()) * t.r
      const x = t.x + Math.cos(a) * rad
      const z = t.z + Math.sin(a) * rad * 0.8
      const y = terrainHeight(x, z)
      if (y < bed(x) + BASE_RIVER + 0.04) continue // not in the river itself
      if (terrainNormal(x, z).y < 0.78) continue
      if (out.some((o) => Math.hypot(o.x - x, o.z - z) < 0.17)) continue
      const h = 0.09 + r() * (t.big ? 0.16 : 0.05)
      out.push({
        x, y, z, h,
        w: 0.11 + r() * 0.07,
        d: 0.09 + r() * 0.06,
        rot: r() * Math.PI,
        town: ti,
        tWet: firstTime((T) => surfaceAt(x, T) > y + 0.01),
        // weaker structures give way once water is well above ground floor
        tFail: firstTime((T) => surfaceAt(x, T) > y + h * 2 + 0.12),
        drift: 0.15 + r() * 0.35,
        tone: r(),
      })
      placed++
    }
  })
  return out
})()

function damageAt(T: number) {
  let flooded = 0
  let destroyed = 0
  for (const h of HOUSES) {
    if (T >= h.tWet) flooded++
    if (T >= h.tFail) destroyed++
  }
  return { flooded, destroyed, total: HOUSES.length }
}

const WALLS = ['#e9e4d8', '#d8cbb3', '#f2efe9', '#c9bfae', '#e2d6c1']
const ROOFS = ['#9c4a36', '#7d3b2c', '#5c6166', '#8b5a3c', '#b35a3f']

function FloodedHouses({ time }: { time: React.MutableRefObject<number> }) {
  const walls = useRef<THREE.InstancedMesh>(null)
  const roofs = useRef<THREE.InstancedMesh>(null)
  const last = useRef(-1)
  const o = useMemo(() => new THREE.Object3D(), [])
  const c = useMemo(() => new THREE.Color(), [])
  const mud = useMemo(() => new THREE.Color('#6d5a43'), [])
  const alert = useMemo(() => new THREE.Color('#ff5a36'), [])

  useFrame(() => {
    const T = time.current
    if (T === last.current || !walls.current || !roofs.current) return
    last.current = T
    HOUSES.forEach((h, i) => {
      const fail = THREE.MathUtils.clamp((T - h.tFail) / 0.5, 0, 1)
      // collapse: tip over downstream, sink, get carried a little way
      o.position.set(h.x + fail * h.drift, h.y + h.h / 2 - fail * h.h * 0.25, h.z)
      o.rotation.set(fail * 0.25, h.rot + fail * 0.6, -fail * 1.25)
      o.scale.set(h.w, h.h * (1 - fail * 0.45), h.d)
      o.updateMatrix()
      walls.current!.setMatrixAt(i, o.matrix)
      const wet = T >= h.tWet
      c.set(WALLS[Math.floor(h.tone * WALLS.length)])
      if (wet) c.lerp(alert, 0.55)
      if (fail > 0) c.lerp(mud, 0.6)
      walls.current!.setColorAt(i, c)

      o.position.y += h.h * (1 - fail * 0.45) / 2 + h.w * 0.25
      o.scale.set(h.w * 0.78, h.w * 0.5, h.d * 0.78)
      o.updateMatrix()
      roofs.current!.setMatrixAt(i, o.matrix)
      c.set(ROOFS[Math.floor(h.tone * ROOFS.length)])
      if (fail > 0) c.lerp(mud, 0.5)
      roofs.current!.setColorAt(i, c)
    })
    for (const m of [walls.current, roofs.current]) {
      m.instanceMatrix.needsUpdate = true
      if (m.instanceColor) m.instanceColor.needsUpdate = true
    }
  })

  return (
    <>
      <instancedMesh ref={walls} args={[undefined, undefined, HOUSES.length]} castShadow receiveShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial roughness={0.85} />
      </instancedMesh>
      <instancedMesh ref={roofs} args={[undefined, undefined, HOUSES.length]} castShadow>
        <coneGeometry args={[0.72, 1, 4, 1]} />
        <meshStandardMaterial roughness={0.8} />
      </instancedMesh>
    </>
  )
}

type Tree = { x: number; y: number; z: number; s: number; tFall: number; lean: number }

function Trees({ time }: { time: React.MutableRefObject<number> }) {
  const ref = useRef<THREE.InstancedMesh>(null)
  const last = useRef(-1)
  const spots = useMemo(() => {
    const r = rng(42)
    const out: Tree[] = []
    for (let k = 0; k < 9000 && out.length < 1700; k++) {
      const x = X0 + 0.5 + r() * (X1 - X0 - 1)
      const z = Z0 + 0.5 + r() * (Z1 - Z0 - 1)
      const y = terrainHeight(x, z)
      const rel = y - bed(x)
      if (x < X_DAM + 0.4 && Math.abs(z - center(x)) < halfWidth(x) * 1.2) continue // keep the reservoir clear
      if (rel < 0.18 || rel > 1.9) continue
      if (terrainNormal(x, z).y < 0.82) continue
      if (TOWNS.some((t) => Math.hypot(t.x - x, t.z - z) < t.r + 0.1)) continue
      const s = 0.7 + r() * 0.6
      out.push({ x, y, z, s, lean: r(), tFall: x > X_DAM ? firstTime((T) => surfaceAt(x, T) > y + 0.1 * s) : Infinity })
    }
    return out
  }, [])
  const o = useMemo(() => new THREE.Object3D(), [])

  useEffect(() => {
    const m = ref.current
    if (!m) return
    const c = new THREE.Color()
    spots.forEach((_, i) => m.setColorAt(i, c.setHSL(0.27 + (i % 7) * 0.008, 0.45, 0.16 + (i % 5) * 0.02)))
    if (m.instanceColor) m.instanceColor.needsUpdate = true
  }, [spots])

  useFrame(() => {
    const T = time.current
    const m = ref.current
    if (!m || T === last.current) return
    last.current = T
    spots.forEach((p, i) => {
      const fall = THREE.MathUtils.clamp((T - p.tFall) / 0.35, 0, 1)
      o.position.set(p.x + fall * 0.08, p.y + 0.12 * p.s * (1 - fall * 0.7), p.z)
      o.rotation.set((p.lean - 0.5) * fall, 0, -fall * 1.45) // knocked flat, pointing downstream
      o.scale.setScalar(p.s)
      o.updateMatrix()
      m.setMatrixAt(i, o.matrix)
    })
    m.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, spots.length]} castShadow>
      <coneGeometry args={[0.07, 0.26, 6]} />
      <meshStandardMaterial roughness={1} />
    </instancedMesh>
  )
}

const BRIDGE_X = 3.6
const BRIDGE = (() => {
  const zc = center(BRIDGE_X)
  const span = halfWidth(BRIDGE_X) * 0.75
  const deckY = bed(BRIDGE_X) + 0.55
  return { zc, span, deckY, tFail: firstTime((T) => surfaceAt(BRIDGE_X, T) > deckY - 0.04) }
})()

/** Road bridge; the centre span is torn off when the flood reaches the deck. */
function Bridge({ time }: { time: React.MutableRefObject<number> }) {
  const mid = useRef<THREE.Mesh>(null)
  const { zc, span, deckY, tFail } = BRIDGE
  const seg = (span * 2) / 3
  useFrame(() => {
    const f = THREE.MathUtils.clamp((time.current - tFail) / 0.6, 0, 1)
    if (!mid.current) return
    mid.current.position.set(BRIDGE_X + f * 0.9, deckY - f * 0.45, zc + f * 0.1)
    mid.current.rotation.set(f * 0.5, f * 0.4, -f * 0.3)
  })
  const deck = <meshStandardMaterial color="#8f8d88" roughness={0.9} />
  return (
    <group>
      {[-1, 1].map((sgn) => (
        <mesh key={sgn} position={[BRIDGE_X, deckY, zc + sgn * seg]} castShadow receiveShadow>
          <boxGeometry args={[0.22, 0.05, seg]} />
          {deck}
        </mesh>
      ))}
      <mesh ref={mid} position={[BRIDGE_X, deckY, zc]} castShadow>
        <boxGeometry args={[0.22, 0.05, seg]} />
        {deck}
      </mesh>
      {[-1, 1].map((sgn) => (
        <mesh key={`p${sgn}`} position={[BRIDGE_X, (deckY + bed(BRIDGE_X)) / 2, zc + sgn * seg * 0.5]} castShadow>
          <boxGeometry args={[0.08, deckY - bed(BRIDGE_X), 0.08]} />
          {deck}
        </mesh>
      ))}
    </group>
  )
}

/** Planks, roofing and logs riding the flood wave. */
function Debris({ time }: { time: React.MutableRefObject<number> }) {
  const N = 220
  const ref = useRef<THREE.InstancedMesh>(null)
  const seeds = useMemo(() => {
    const r = rng(99)
    return Array.from({ length: N }, () => ({ lag: r() ** 1.6, lat: r() - 0.5, spin: r() * 6, s: 0.5 + r() * 1.2, kind: r() }))
  }, [])
  const o = useMemo(() => new THREE.Object3D(), [])
  useEffect(() => {
    const m = ref.current
    if (!m) return
    const c = new THREE.Color()
    seeds.forEach((d, i) => m.setColorAt(i, c.set(d.kind < 0.55 ? '#6b4f36' : d.kind < 0.8 ? '#8a3f2e' : '#c9c1b2')))
    if (m.instanceColor) m.instanceColor.needsUpdate = true
  }, [seeds])
  useFrame(({ clock }) => {
    const m = ref.current
    if (!m) return
    const T = time.current
    const front = Math.min(X1 - 0.3, X_DAM + RANGE * Math.pow(T / T_MAX, 0.7))
    const bob = clock.elapsedTime
    seeds.forEach((d, i) => {
      const x = front - 0.2 - d.lag * 7
      const depth = x > X_DAM + 0.3 ? sectionDepth(x, T) : 0
      if (depth < 0.06) {
        o.position.set(0, -50, 0)
      } else {
        const z = center(x) + d.lat * halfWidth(x) * 0.9 * Math.min(1, depth * 1.4)
        o.position.set(x, surfaceAt(x, T) + 0.01 + Math.sin(bob * 2 + d.spin) * 0.008, z)
        o.rotation.set(Math.sin(bob + d.spin) * 0.2, d.spin + bob * 0.3 * (d.lat > 0 ? 1 : -1), 0)
      }
      o.scale.set(0.12 * d.s, 0.02, 0.035 * d.s)
      o.updateMatrix()
      m.setMatrixAt(i, o.matrix)
    })
    m.instanceMatrix.needsUpdate = true
  })
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, N]} frustumCulled={false}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial roughness={0.9} />
    </instancedMesh>
  )
}

const waterVert = /* glsl */ `
  attribute float aDepth;
  attribute float aVal;
  attribute float aFoam;
  varying float vDepth;
  varying float vVal;
  varying float vFoam;
  varying vec3 vPos;
  void main() {
    vDepth = aDepth; vVal = aVal; vFoam = aFoam; vPos = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`
const waterFrag = /* glsl */ `
  uniform float uTime;
  uniform int uMode;
  uniform vec3 uSun;
  uniform float uDamX;
  varying float vDepth;
  varying float vVal;
  varying float vFoam;
  varying vec3 vPos;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
  }
  vec3 ramp(vec3 a, vec3 b, vec3 c, float t) {
    t = clamp(t, 0.0, 1.0);
    return t < 0.5 ? mix(a, b, t * 2.0) : mix(b, c, t * 2.0 - 1.0);
  }

  void main() {
    if (vDepth < 0.015) discard;

    // surface normal from geometry + small ripples flowing downstream (+x)
    vec3 n = normalize(cross(dFdx(vPos), dFdy(vPos)));
    if (n.y < 0.0) n = -n;
    vec2 q = vPos.xz * 6.0 - vec2(uTime * 1.6, 0.0);
    float r1 = noise(q), r2 = noise(q * 2.3 + 11.0);
    n = normalize(n + vec3(r1 - 0.5, 0.0, r2 - 0.5) * 0.3);

    vec3 v = normalize(cameraPosition - vPos);
    float fres = pow(1.0 - max(dot(n, v), 0.0), 3.0);
    float spec = pow(max(dot(reflect(-uSun, n), v), 0.0), 40.0);
    vec3 sky = vec3(0.32, 0.42, 0.52);

    vec3 col;
    if (uMode == 0) {
      // realistic: silt-laden flood water, darker where deep
      // clear reservoir upstream, silt-laden flood downstream
      float lake = 1.0 - smoothstep(uDamX - 0.2, uDamX + 0.6, vPos.x);
      vec3 shallow = mix(vec3(0.12, 0.075, 0.03), vec3(0.03, 0.11, 0.12), lake);
      vec3 deep = mix(vec3(0.045, 0.035, 0.02), vec3(0.008, 0.035, 0.055), lake);
      col = mix(shallow, deep, smoothstep(0.0, 1.2, vDepth));
      // flow streaks stretched along the current
      float streak = noise(vec2(vPos.x * 3.0 - uTime * 2.2, vPos.z * 28.0));
      col *= 1.0 - (1.0 - lake) * smoothstep(0.55, 0.9, streak) * 0.35;
      col *= 0.75 + 0.35 * max(dot(n, uSun), 0.0);
      col = mix(col, sky, 0.04 + fres * 0.5);
      col += spec * vec3(1.0, 0.9, 0.75) * 1.6;
      // churning white water at the breach and the wave front
      float froth = smoothstep(0.35, 0.75, noise(vPos.xz * 14.0 - vec2(uTime * 4.0, uTime)) * vFoam + vFoam * 0.45);
      col = mix(col, vec3(0.75, 0.72, 0.66), froth);
    } else {
      if (uMode == 1) col = ramp(vec3(0.62, 0.93, 1.0), vec3(0.18, 0.62, 0.95), vec3(0.05, 0.18, 0.55), vVal);
      else if (uMode == 2) col = ramp(vec3(0.15, 0.55, 0.65), vec3(1.0, 0.82, 0.3), vec3(1.0, 0.35, 0.2), vVal);
      else col = ramp(vec3(1.0, 0.35, 0.25), vec3(1.0, 0.85, 0.35), vec3(0.37, 0.83, 1.0), vVal);
      col = mix(col, sky, fres * 0.25) + spec * 0.6;
    }
    float a = smoothstep(0.015, 0.1, vDepth) * (uMode == 0 ? 0.8 : 0.85);
    gl_FragColor = vec4(col, a);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`

const MODE_ID: Record<Mode, number> = { realistic: 0, depth: 1, velocity: 2, arrival: 3 }

function Water({ heights, time, mode }: { heights: Float32Array; time: React.MutableRefObject<number>; mode: Mode }) {
  const { geo, xs } = useMemo(() => {
    const g = new THREE.PlaneGeometry(X1 - X0, Z1 - Z0, SEG_X, SEG_Z)
    const pos = g.attributes.position as THREE.BufferAttribute
    const xs = new Float32Array(pos.count)
    for (let i = 0; i < pos.count; i++) {
      xs[i] = pos.getX(i)
      pos.setXYZ(i, pos.getX(i), heights[i], -pos.getY(i))
    }
    for (const k of ['aDepth', 'aVal', 'aFoam']) g.setAttribute(k, new THREE.BufferAttribute(new Float32Array(pos.count), 1))
    return { geo: g, xs }
  }, [heights])

  const uniforms = useMemo(() => ({ uTime: { value: 0 }, uMode: { value: 0 }, uSun: { value: SUN }, uDamX: { value: X_DAM } }), [])
  const lastT = useRef(-1)
  const lastMode = useRef<Mode | null>(null)

  useFrame((_, dt) => {
    uniforms.uTime.value += Math.min(dt, 0.05)
    uniforms.uMode.value = MODE_ID[mode]
    const T = time.current
    if (T === lastT.current && mode === lastMode.current) return
    lastT.current = T
    lastMode.current = mode

    const pos = geo.attributes.position as THREE.BufferAttribute
    const P = pos.array as Float32Array
    const D = (geo.attributes.aDepth as THREE.BufferAttribute).array as Float32Array
    const V = (geo.attributes.aVal as THREE.BufferAttribute).array as Float32Array
    const F = (geo.attributes.aFoam as THREE.BufferAttribute).array as Float32Array
    const L = reservoirLevel(T)
    const b = breachProgress(T)
    const front = X_DAM + RANGE * Math.pow(T / T_MAX, 0.7)
    const outburst = b * Math.exp(-Math.max(0, T - BREACH_TIME) / 2.5) // strongest right after the breach opens
    const rowLen = SEG_X + 1
    const colSurface = new Float32Array(rowLen)
    const colSection = new Float32Array(rowLen)
    const colFoam = new Float32Array(rowLen)
    for (let c = 0; c < rowLen; c++) {
      const x = xs[c]
      if (x < X_DAM - 0.2) {
        colSurface[c] = L
      } else {
        const d = sectionDepth(x, T)
        colSection[c] = d
        colSurface[c] = bed(x) + BASE_RIVER + d
        if (x < X_DAM + 0.25) colSurface[c] = Math.max(colSurface[c], L * b + bed(x) * (1 - b))
        const atFront = T > 0.05 && x <= front ? Math.exp(-(((front - x) / 0.9) ** 2)) : 0
        const atBreach = Math.exp(-(((x - X_DAM) / 1.6) ** 2)) * outburst
        colFoam[c] = Math.min(1, atFront * 0.9 + atBreach)
      }
    }
    for (let i = 0; i < pos.count; i++) {
      const c = i % rowLen
      const x = xs[c]
      const h = heights[i]
      const s = colSurface[c]
      const inValley = x >= X_DAM - 0.2 || Math.abs(P[i * 3 + 2] - center(x)) < halfWidth(x) * 1.5
      const depth = inValley ? Math.max(0, s - h) : 0
      D[i] = depth
      F[i] = colFoam[c]
      P[i * 3 + 1] = depth > 0 ? s : h - 0.05
      if (mode === 'depth') V[i] = depth / 1.5
      else if (mode === 'velocity') V[i] = x < X_DAM ? 0.05 : Math.sqrt(colSection[c] / 1.4) * Math.exp(-(x - X_DAM) / 16) * 1.25
      else V[i] = x < X_DAM ? 0 : arrivalTime(x) / T_MAX
    }
    pos.needsUpdate = true
    for (const k of ['aDepth', 'aVal', 'aFoam']) (geo.attributes[k] as THREE.BufferAttribute).needsUpdate = true
  })

  return (
    <mesh geometry={geo} renderOrder={2}>
      <shaderMaterial vertexShader={waterVert} fragmentShader={waterFrag} uniforms={uniforms} transparent depthWrite={false} side={THREE.DoubleSide} />
    </mesh>
  )
}

/** White spray and mist blasting out of the breach while the reservoir drains. */
function Spray({ time }: { time: React.MutableRefObject<number> }) {
  const N = 900
  const ref = useRef<THREE.Points>(null)
  const state = useMemo(() => ({ p: new Float32Array(N * 3), v: new Float32Array(N * 3), life: new Float32Array(N) }), [])
  const zc = center(X_DAM)
  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05)
    const T = time.current
    const b = breachProgress(T)
    const intensity = b * Math.exp(-Math.max(0, T - BREACH_TIME) / 2.5)
    const { p, v, life } = state
    const L = reservoirLevel(T)
    for (let i = 0; i < N; i++) {
      if (life[i] <= 0) {
        if (Math.random() > intensity * 0.35) {
          p[i * 3 + 1] = -100 // parked off-screen
          continue
        }
        life[i] = 0.6 + Math.random() * 0.9
        p[i * 3] = X_DAM + 0.25
        p[i * 3 + 1] = bed(X_DAM) + Math.random() * Math.max(0.1, L - bed(X_DAM)) * 0.8
        p[i * 3 + 2] = zc + (Math.random() - 0.5) * 0.55 * b
        v[i * 3] = 1.2 + Math.random() * 2.2
        v[i * 3 + 1] = 0.4 + Math.random() * 1.4
        v[i * 3 + 2] = (Math.random() - 0.5) * 1.2
      }
      life[i] -= dt
      v[i * 3 + 1] -= 2.2 * dt
      p[i * 3] += v[i * 3] * dt
      p[i * 3 + 1] += v[i * 3 + 1] * dt
      p[i * 3 + 2] += v[i * 3 + 2] * dt
    }
    const g = ref.current!.geometry
    ;(g.attributes.position as THREE.BufferAttribute).needsUpdate = true
  })
  return (
    <points ref={ref} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[state.p, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#f4f6f7" size={0.07} sizeAttenuation transparent opacity={0.55} depthWrite={false} />
    </points>
  )
}

/** Concrete gravity dam: two abutments stay, the centre section washes out. */
function Dam({ time }: { time: React.MutableRefObject<number> }) {
  const mid = useRef<THREE.Mesh>(null)
  const zc = center(X_DAM)
  const base = bed(X_DAM) - 0.3
  const H = DAM_TOP - base
  const hw = halfWidth(X_DAM) * 2.2
  useFrame(() => {
    const b = breachProgress(time.current)
    const h = Math.max(0.001, H * (1 - b * 0.95))
    if (mid.current) {
      mid.current.scale.y = h / H
      mid.current.position.y = base + h / 2
    }
  })
  const mat = <meshStandardMaterial color="#b9b6ae" roughness={0.85} />
  const side = (hw - 0.35) / 1
  return (
    <group position={[X_DAM, 0, zc]}>
      <mesh position={[0, base + H / 2, -(0.35 + side / 2)]} castShadow receiveShadow>
        <boxGeometry args={[0.45, H, side]} />
        {mat}
      </mesh>
      <mesh ref={mid} position={[0, base + H / 2, 0]} castShadow>
        <boxGeometry args={[0.45, H, 0.7]} />
        {mat}
      </mesh>
      <mesh position={[0, base + H / 2, 0.35 + side / 2]} castShadow receiveShadow>
        <boxGeometry args={[0.45, H, side]} />
        {mat}
      </mesh>
      <Html position={[0, DAM_TOP + 0.8, 0]} center zIndexRange={[10, 0]}>
        <div className="pointer-events-none whitespace-nowrap rounded-full bg-ink/80 px-3 py-1 font-mono text-[11px] text-fg ring-1 ring-line-strong">Dam · breach site</div>
      </Html>
    </group>
  )
}

function Town({ t, index, now }: { t: (typeof TOWNS)[number]; index: number; now: number }) {
  const mine = HOUSES.filter((h) => h.town === index)
  const wet = mine.filter((h) => now >= h.tWet).length
  const gone = mine.filter((h) => now >= h.tFail).length
  const hit = wet > 0
  return (
    <group position={[t.x, t.y, t.z]}>
      <Html position={[0, 1.7, 0]} center zIndexRange={[10, 0]}>
        <div className={`pointer-events-none whitespace-nowrap rounded-lg px-2 py-1 text-center font-mono text-[10px] ring-1 transition-colors duration-500 ${hit ? 'bg-flare text-white ring-white/40 shadow-md' : 'bg-ink/80 text-fg ring-line-strong'}`}>
          <div className="font-sans text-[11px] font-semibold">{t.name}</div>
          <div>{hit ? `${wet} flooded${gone ? ` · ${gone} lost` : ''}` : `T+${t.arrival.toFixed(1)} h`}</div>
        </div>
      </Html>
    </group>
  )
}

function Clock({ time, playing, speed, onTick }: { time: React.MutableRefObject<number>; playing: boolean; speed: number; onTick: (t: number) => void }) {
  const acc = useRef(0)
  useFrame((_, dt) => {
    if (!playing) return
    time.current = Math.min(T_MAX, time.current + Math.min(dt, 0.05) * speed)
    acc.current += dt
    if (acc.current > 1 / 30 || time.current >= T_MAX) {
      acc.current = 0
      onTick(time.current)
    }
  })
  return null
}

/** Pulls the camera back on narrow (portrait) screens so the whole valley stays in frame. */
function CameraFit() {
  const { camera, size } = useThree()
  useEffect(() => {
    const aspect = size.width / size.height
    const base = new THREE.Vector3(-12, 12, 13)
    camera.position.copy(base.multiplyScalar(aspect < 1 ? 1.25 / Math.max(aspect, 0.45) : 1))
    camera.updateProjectionMatrix()
  }, [camera, size.width, size.height])
  return null
}

/* ───────────── Public component ───────────── */

export default function FloodSim() {
  const heights = useMemo(() => {
    const g = new THREE.PlaneGeometry(X1 - X0, Z1 - Z0, SEG_X, SEG_Z)
    const pos = g.attributes.position
    const h = new Float32Array(pos.count)
    for (let i = 0; i < pos.count; i++) h[i] = terrainHeight(pos.getX(i), -pos.getY(i))
    g.dispose()
    return h
  }, [])

  const time = useRef(0)
  const [t, setT] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [mode, setMode] = useState<Mode>('realistic')
  const [visible, setVisible] = useState(true)
  const wrap = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const io = new IntersectionObserver(([e]) => {
      setVisible(e.isIntersecting)
      if (e.isIntersecting && time.current === 0) setPlaying(true)
    }, { threshold: 0.35 })
    if (wrap.current) io.observe(wrap.current)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    if (t >= T_MAX) setPlaying(false)
  }, [t])

  const front = Math.min(X1, X_DAM + RANGE * Math.pow(t / T_MAX, 0.7))
  const frontKm = Math.max(0, (front - X_DAM) * 2.5)
  const dmg = damageAt(t)
  const scrub = (v: number) => {
    time.current = v
    setT(v)
  }

  const legend = {
    realistic: { from: '', to: '', grad: 'transparent' },
    depth: { from: 'Shallow', to: 'Deep', grad: 'linear-gradient(90deg,#9eedff,#2e9ef2,#0d2e8c)' },
    velocity: { from: 'Slow', to: 'Fast', grad: 'linear-gradient(90deg,#268ca6,#ffd14d,#ff5933)' },
    arrival: { from: 'Early', to: 'Late', grad: 'linear-gradient(90deg,#ff5940,#ffd959,#5fd4ff)' },
  }[mode]

  return (
    <div ref={wrap} className="relative h-full min-h-[300px] overflow-hidden rounded-2xl bg-[radial-gradient(ellipse_at_top,var(--color-deep),var(--color-abyss)_70%)]">
      <Canvas
        shadows
        dpr={[1, 1.75]}
        frameloop={visible ? 'always' : 'never'}
        camera={{ position: [-12, 12, 13], fov: 38, near: 0.1, far: 220 }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05 }}
        onCreated={({ scene }) => {
          scene.fog = new THREE.Fog('#c3cfd6', 34, 80)
        }}
      >
        <Sky distance={180} sunPosition={SUN.clone().multiplyScalar(100).toArray()} turbidity={6} rayleigh={1.2} mieCoefficient={0.006} mieDirectionalG={0.85} />
        <hemisphereLight args={['#dbe9f5', '#3b3a2e', 0.9]} />
        <directionalLight
          position={SUN.clone().multiplyScalar(20).toArray()}
          intensity={2.6}
          color="#fff0dc"
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-bias={-0.0004}
          shadow-camera-left={-18}
          shadow-camera-right={18}
          shadow-camera-top={12}
          shadow-camera-bottom={-12}
          shadow-camera-near={1}
          shadow-camera-far={70}
        />
        <Terrain heights={heights} />
        <Water heights={heights} time={time} mode={mode} />
        <Dam time={time} />
        <Spray time={time} />
        <Trees time={time} />
        <FloodedHouses time={time} />
        <Bridge time={time} />
        <Debris time={time} />
        {TOWNS.map((tw, i) => (
          <Town key={tw.name} t={tw} index={i} now={t} />
        ))}
        <CameraFit />
        <Clock time={time} playing={playing} speed={1.1} onTick={setT} />
        <OrbitControls enablePan={false} enableZoom minDistance={5} maxDistance={32} enableDamping dampingFactor={0.06} minPolarAngle={0.35} maxPolarAngle={1.25} target={[1, -0.4, 0]} rotateSpeed={0.6} />
      </Canvas>

      {/* HUD */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex flex-wrap items-start justify-between gap-2 p-3">
        <div className="pointer-events-auto rounded-xl bg-ink/80 px-3 py-2 ring-1 ring-line-strong backdrop-blur">
          <p className="font-mono text-lg leading-none tabular-nums">T+{t.toFixed(1)}<span className="text-xs text-muted"> h</span></p>
          <p className="mt-1 whitespace-nowrap font-mono text-[10px] text-muted">Front {frontKm.toFixed(1)} km · breach {Math.round(breachProgress(t) * 100)}%</p>
          <p className="mt-1 whitespace-nowrap font-mono text-[10px]">
            <span className="text-flare">{dmg.flooded} flooded</span>
            <span className="text-muted"> · </span>
            <span className="text-fg">{dmg.destroyed} destroyed</span>
            <span className="hidden text-muted sm:inline"> · bridge {t >= BRIDGE.tFail ? 'lost' : 'standing'}</span>
          </p>
        </div>
        <div className="pointer-events-auto flex rounded-full bg-ink/80 p-0.5 ring-1 ring-line-strong backdrop-blur">
          {(['realistic', 'depth', 'velocity', 'arrival'] as Mode[]).map((m) => (
            <button key={m} onClick={() => setMode(m)} className={`rounded-full px-1.5 py-1 text-[10px] capitalize transition-colors sm:px-2.5 sm:text-[11px] ${mode === m ? 'bg-fg text-ink' : 'text-muted hover:text-fg'}`}>
              {m}
            </button>
          ))}
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 z-20 p-3">
        <div className="flex items-center gap-3 rounded-xl bg-ink/80 px-3 py-2 ring-1 ring-line-strong backdrop-blur">
          <button onClick={() => { if (t >= T_MAX) scrub(0); setPlaying((p) => !p) }} className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-fg text-ink" aria-label={playing ? 'Pause' : 'Play'}>
            <Icon name={playing ? 'pause' : 'play'} className="h-3 w-3" />
          </button>
          <input
            type="range"
            className="range flex-1"
            min={0}
            max={T_MAX}
            step={0.01}
            value={t}
            style={{ ['--p' as string]: `${(t / T_MAX) * 100}%` }}
            onChange={(e) => { setPlaying(false); scrub(parseFloat(e.target.value)) }}
            aria-label="Simulation time in hours"
          />
          <span className="hidden h-1.5 w-20 shrink-0 rounded-full sm:block" style={{ background: legend.grad }} title={`${legend.from} → ${legend.to}`} />
        </div>
      </div>
    </div>
  )
}
