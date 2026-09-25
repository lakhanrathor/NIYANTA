import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

const vert = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`

// Animated topographic map: fbm terrain, a carved meandering river with flowing light,
// and contour lines that bend around the cursor.
const frag = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform vec2 uRes;
  uniform vec2 uMouse;
  uniform float uHover;
  uniform float uIntro;

  vec2 hash(vec2 p) {
    p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
    return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
  }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(dot(hash(i), f), dot(hash(i + vec2(1, 0)), f - vec2(1, 0)), u.x),
               mix(dot(hash(i + vec2(0, 1)), f - vec2(0, 1)), dot(hash(i + vec2(1, 1)), f - vec2(1, 1)), u.x), u.y);
  }
  float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    mat2 r = mat2(0.8, 0.6, -0.6, 0.8);
    for (int i = 0; i < 5; i++) { v += a * noise(p); p = r * p * 2.02; a *= 0.5; }
    return v;
  }
  float riverY(float x, float t) {
    return 0.18 * sin(x * 1.6 + 0.6) + 0.08 * sin(x * 3.7 - 1.2) + 0.03 * sin(x * 7.0 + t * 0.2);
  }

  void main() {
    vec2 uv = vUv;
    float aspect = uRes.x / uRes.y;
    vec2 p = (uv - 0.5) * vec2(aspect, 1.0) * 2.2;
    float t = uTime;

    // terrain
    vec2 q = p + vec2(t * 0.012, t * 0.006);
    float h = fbm(q * 1.15) * 1.25 + 0.35 * fbm(q * 2.6 + 3.1);

    // river valley carved into the terrain
    float ry = riverY(p.x, t) - 0.05;
    float d = abs(p.y - ry);
    float valley = exp(-d * d * 9.0);
    h -= valley * 0.55;

    // cursor lens: raises a smooth hill under the mouse
    vec2 m = (uMouse - 0.5) * vec2(aspect, 1.0) * 2.2;
    float md = length(p - m);
    h += uHover * 0.35 * exp(-md * md * 5.0);

    // contour lines
    float n = 16.0;
    float hv = h * n;
    float fw = fwidth(hv);
    float dl = abs(fract(hv + 0.5) - 0.5);
    float line = 1.0 - smoothstep(0.0, fw * 1.2, dl);
    float dm = abs(fract(hv / 5.0 + 0.5) - 0.5) * 5.0;
    float major = 1.0 - smoothstep(0.0, fw * 1.8, dm);

    vec3 ink = vec3(0.020, 0.043, 0.071);
    vec3 teal = vec3(0.12, 0.56, 0.68);
    vec3 aqua = vec3(0.37, 0.83, 1.0);

    float elev = smoothstep(-0.6, 0.9, h);
    vec3 col = ink + vec3(0.0, 0.02, 0.035) * elev;
    col += teal * line * (0.18 + 0.35 * elev);
    col += aqua * major * 0.22 * elev;

    // river: glowing core + flowing pulses heading downstream
    float core = exp(-d * d * 900.0);
    float glow = exp(-d * d * 60.0);
    float flow = 0.5 + 0.5 * sin(p.x * 22.0 - t * 2.4 + sin(p.x * 3.0) * 2.0);
    col += aqua * (core * (0.55 + 0.45 * flow) + glow * 0.12);

    // cursor ring
    col += aqua * uHover * 0.12 * exp(-pow(md - 0.12, 2.0) * 600.0);

    // intro sweep and vignette
    float a = uIntro * 3.0 - 0.6;
    float revealed = 1.0 - smoothstep(a - 0.4, a, uv.x + (1.0 - uv.y));
    col = mix(ink, col, revealed);
    float vig = smoothstep(1.35, 0.2, length((uv - 0.5) * vec2(aspect * 0.8, 1.0)));
    col *= mix(0.35, 1.0, vig);
    gl_FragColor = vec4(col, 1.0);
  }
`

function Field({ reduced }: { reduced: boolean }) {
  const mat = useRef<THREE.ShaderMaterial>(null)
  const { size, gl } = useThree()
  const target = useRef(new THREE.Vector2(0.62, 0.55))
  const hoverTarget = useRef(0)
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uRes: { value: new THREE.Vector2(1, 1) },
      uMouse: { value: new THREE.Vector2(0.62, 0.55) },
      uHover: { value: 0 },
      uIntro: { value: 0 },
    }),
    [],
  )

  useEffect(() => {
    const el = gl.domElement.parentElement?.parentElement ?? gl.domElement
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect()
      target.current.set((e.clientX - r.left) / r.width, 1 - (e.clientY - r.top) / r.height)
      hoverTarget.current = 1
    }
    const leave = () => (hoverTarget.current = 0)
    window.addEventListener('pointermove', move)
    document.addEventListener('pointerleave', leave)
    return () => {
      window.removeEventListener('pointermove', move)
      document.removeEventListener('pointerleave', leave)
    }
  }, [gl])

  useFrame((_, dt) => {
    const u = mat.current!.uniforms
    const d = Math.min(dt, 0.05)
    u.uTime.value += reduced ? 0 : d
    u.uRes.value.set(size.width, size.height)
    u.uMouse.value.lerp(target.current, 1 - Math.pow(0.001, d))
    u.uHover.value += (hoverTarget.current - u.uHover.value) * (1 - Math.pow(0.01, d))
    u.uIntro.value = Math.min(1, u.uIntro.value + d * 0.45)
  })

  return (
    <mesh frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial ref={mat} vertexShader={vert} fragmentShader={frag} uniforms={uniforms} depthWrite={false} depthTest={false} />
    </mesh>
  )
}

/** Full-bleed WebGL background. Pauses rendering while scrolled out of view. */
export default function TopoField({ className }: { className?: string }) {
  const wrap = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(true)
  const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  useEffect(() => {
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting))
    if (wrap.current) io.observe(wrap.current)
    return () => io.disconnect()
  }, [])

  return (
    <div ref={wrap} className={className} aria-hidden>
      <Canvas dpr={[1, 1.75]} frameloop={visible ? 'always' : 'never'} gl={{ antialias: false, powerPreference: 'high-performance' }} orthographic camera={{ position: [0, 0, 1] }}>
        <Field reduced={reduced} />
      </Canvas>
    </div>
  )
}
