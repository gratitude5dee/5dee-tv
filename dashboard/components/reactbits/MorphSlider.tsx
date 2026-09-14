'use client'
/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import * as THREE from 'three'
import { gsap } from 'gsap'
import './MorphSlider.css'

type Transition = 'melt' | 'ripple' | 'shear' | 'swirl'

export type MorphSliderItem = {
  image: string
  caption?: string
}

type MorphSliderProps = {
  items: MorphSliderItem[]
  startIndex?: number
  /** Optional external selection. The slider transitions to it without re-creating WebGL state. */
  activeIndex?: number
  transition?: Transition
  duration?: number
  ease?: string
  intensity?: number
  scale?: number
  aberration?: number
  drift?: number
  autoplay?: boolean
  autoplayDelay?: number
  loop?: boolean
  radius?: number
  overlayColor?: string
  showCaptions?: boolean
  showControls?: boolean
  showIndicators?: boolean
  className?: string
  onIndexChange?: (index: number) => void
}

const transitionModes: Record<Transition, number> = { melt: 0, ripple: 1, shear: 2, swirl: 3 }

const vertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const fragmentShader = `
precision highp float;

uniform sampler2D tCurrent;
uniform sampler2D tNext;
uniform vec2 uResolution;
uniform vec2 uCurrentSize;
uniform vec2 uNextSize;
uniform float uProgress;
uniform float uDir;
uniform int uMode;
uniform float uIntensity;
uniform float uScale;
uniform float uAberration;
uniform float uDrift;
uniform float uTime;
uniform float uReduce;
uniform vec2 uPointer;
uniform vec3 uOverlay;
varying vec2 vUv;

const float PI = 3.14159265359;

float hash11(float p) {
  p = fract(p * 0.1031);
  p *= p + 33.33;
  p *= p + p;
  return fract(p);
}

float hash21(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash21(i), hash21(i + vec2(1.0, 0.0)), u.x), mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), u.x), u.y);
}

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < 5; i++) {
    value += amplitude * noise(p);
    p *= 2.0;
    amplitude *= 0.5;
  }
  return value;
}

mat2 rot(float a) {
  float s = sin(a);
  float c = cos(a);
  return mat2(c, -s, s, c);
}

vec2 coverUV(vec2 uv, vec2 resolution, vec2 imageSize) {
  float viewportAspect = resolution.x / max(resolution.y, 1.0);
  float imageAspect = imageSize.x / max(imageSize.y, 1.0);
  vec2 scale = vec2(1.0);
  float ratio = viewportAspect / max(imageAspect, 0.0001);
  if (ratio > 1.0) scale.y = 1.0 / ratio;
  else scale.x = ratio;
  return (uv - 0.5) * scale + 0.5;
}

void main() {
  float progress = clamp(uProgress, 0.0, 1.0);
  float envelope = sin(progress * PI);
  vec2 uv = vUv;
  uv += vec2(sin(uTime * 0.25 + uv.y * 4.0), cos(uTime * 0.22 + uv.x * 4.0)) * uDrift * 0.008;
  uv = (uv - 0.5) * (1.0 - uDrift * 0.02 * sin(uTime * 0.4)) + 0.5;

  vec2 uvCurrent = uv;
  vec2 uvNext = uv;
  float mixAmount = smoothstep(0.0, 1.0, progress);

  if (uReduce < 0.5) {
    if (uMode == 3) {
      vec2 center = uv - 0.5;
      float radius = length(center);
      float angle = envelope * uIntensity * 3.5 * (1.0 - radius);
      uvCurrent = rot(angle) * center + 0.5;
      uvNext = rot(-angle) * center + 0.5;
    } else if (uMode == 1) {
      float distanceFromPointer = distance(uv, uPointer);
      float ring = progress * 1.6;
      float wave = sin((distanceFromPointer - ring) * 30.0) * envelope;
      vec2 direction = normalize(uv - uPointer + 0.0001);
      vec2 displacement = direction * wave * uIntensity * 0.25;
      uvCurrent = uv + displacement;
      uvNext = uv + displacement * 0.6;
      mixAmount = 1.0 - smoothstep(ring - 0.03, ring + 0.03, distanceFromPointer);
    } else if (uMode == 2) {
      float row = floor(uv.y * 14.0);
      float random = hash11(row);
      vec2 displacement = vec2((random - 0.5) * envelope * uIntensity * 0.6, 0.0);
      uvCurrent = uv + displacement;
      uvNext = uv + displacement;
      float localX = uDir > 0.0 ? uv.x : 1.0 - uv.x;
      float threshold = progress * 1.5 - 0.25 + (random - 0.5) * 0.25;
      mixAmount = 1.0 - smoothstep(threshold - 0.06, threshold + 0.06, localX);
    } else {
      float field = fbm(uv * uScale + uTime * 0.03);
      float warp = fbm(uv * uScale * 1.7 - uTime * 0.02);
      vec2 displacement = vec2(field, warp) - 0.5;
      uvCurrent = uv + displacement * uIntensity * 0.5 * progress;
      uvNext = uv - displacement * uIntensity * 0.5 * (1.0 - progress);
      mixAmount = smoothstep(field - 0.15, field + 0.15, progress);
    }
  }

  vec2 sampleCurrent = coverUV(uvCurrent, uResolution, uCurrentSize);
  vec2 sampleNext = coverUV(uvNext, uResolution, uNextSize);
  float chromatic = uReduce < 0.5 ? uAberration * envelope * 0.03 : 0.0;
  vec3 current = vec3(
    texture2D(tCurrent, sampleCurrent + vec2(chromatic, 0.0)).r,
    texture2D(tCurrent, sampleCurrent).g,
    texture2D(tCurrent, sampleCurrent - vec2(chromatic, 0.0)).b
  );
  vec3 next = vec3(
    texture2D(tNext, sampleNext + vec2(chromatic, 0.0)).r,
    texture2D(tNext, sampleNext).g,
    texture2D(tNext, sampleNext - vec2(chromatic, 0.0)).b
  );
  vec3 color = mix(current, next, mixAmount);
  float vignette = smoothstep(1.25, 0.25, length(uv - 0.5));
  color = mix(color, uOverlay, (1.0 - vignette) * 0.28);
  gl_FragColor = vec4(color, 1.0);
}
`

type SliderOptions = Required<Omit<MorphSliderProps, 'items' | 'className' | 'onIndexChange' | 'startIndex' | 'activeIndex' | 'showCaptions' | 'showControls' | 'showIndicators'>>

class MorphEngine {
  private readonly renderer: THREE.WebGLRenderer
  private readonly scene = new THREE.Scene()
  private readonly camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
  private readonly material: THREE.ShaderMaterial
  private readonly mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>
  private readonly textures: THREE.Texture[]
  private readonly sizes: THREE.Vector2[]
  private readonly fallback: THREE.DataTexture
  private readonly observer: ResizeObserver
  private animationFrame = 0
  private tween: gsap.core.Tween | null = null
  private current: number
  private shown: number
  private animating = false
  private dragging = false
  private dragDirection = 0

  constructor(
    private readonly container: HTMLDivElement,
    private readonly items: MorphSliderItem[],
    startIndex: number,
    private readonly reducedMotion: boolean,
    private readonly getOptions: () => SliderOptions,
    private readonly onIndexChange?: (index: number) => void,
  ) {
    this.current = this.wrap(startIndex)
    this.shown = this.current
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    this.renderer.domElement.className = 'morph-slider-canvas'
    this.container.appendChild(this.renderer.domElement)

    const pixels = new Uint8Array([12, 13, 19, 255, 12, 13, 19, 255, 12, 13, 19, 255, 12, 13, 19, 255])
    this.fallback = new THREE.DataTexture(pixels, 2, 2, THREE.RGBAFormat)
    this.fallback.needsUpdate = true
    this.textures = items.map(() => this.fallback)
    this.sizes = items.map(() => new THREE.Vector2(1, 1))

    const options = getOptions()
    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        tCurrent: { value: this.fallback },
        tNext: { value: this.fallback },
        uResolution: { value: new THREE.Vector2(1, 1) },
        uCurrentSize: { value: this.sizes[this.current] },
        uNextSize: { value: this.sizes[this.current] },
        uProgress: { value: 0 },
        uDir: { value: 1 },
        uMode: { value: transitionModes[options.transition] },
        uIntensity: { value: options.intensity },
        uScale: { value: options.scale },
        uAberration: { value: options.aberration },
        uDrift: { value: options.drift },
        uTime: { value: 0 },
        uReduce: { value: reducedMotion ? 1 : 0 },
        uPointer: { value: new THREE.Vector2(0.5, 0.5) },
        uOverlay: { value: new THREE.Color(options.overlayColor) },
      },
    })
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.material)
    this.scene.add(this.mesh)

    this.observer = new ResizeObserver(() => this.resize())
    this.observer.observe(container)
    this.resize()
    this.loadTextures()
    this.loop = this.loop.bind(this)
    this.animationFrame = requestAnimationFrame(this.loop)
  }

  private loadTextures() {
    const loader = new THREE.TextureLoader()
    loader.setCrossOrigin('anonymous')
    this.items.forEach((item, index) => {
      loader.load(
        item.image,
        (texture) => {
          texture.colorSpace = THREE.SRGBColorSpace
          texture.minFilter = THREE.LinearFilter
          texture.magFilter = THREE.LinearFilter
          texture.generateMipmaps = false
          this.textures[index] = texture
          const image = texture.image as { naturalWidth?: number; naturalHeight?: number; width?: number; height?: number }
          this.sizes[index] = new THREE.Vector2(image.naturalWidth ?? image.width ?? 1, image.naturalHeight ?? image.height ?? 1)
          if (index === this.current) {
            this.material.uniforms.tCurrent.value = texture
            this.material.uniforms.tNext.value = texture
            this.material.uniforms.uCurrentSize.value = this.sizes[index]
            this.material.uniforms.uNextSize.value = this.sizes[index]
          }
        },
        undefined,
        () => undefined,
      )
    })
  }

  private resize() {
    const rect = this.container.getBoundingClientRect()
    this.renderer.setSize(Math.max(rect.width, 1), Math.max(rect.height, 1), false)
    this.material.uniforms.uResolution.value.set(this.renderer.domElement.width, this.renderer.domElement.height)
  }

  private syncOptions() {
    const options = this.getOptions()
    this.material.uniforms.uMode.value = transitionModes[options.transition]
    this.material.uniforms.uIntensity.value = options.intensity
    this.material.uniforms.uScale.value = options.scale
    this.material.uniforms.uAberration.value = options.aberration
    this.material.uniforms.uDrift.value = options.drift
    this.material.uniforms.uOverlay.value.set(options.overlayColor)
  }

  private loop(time: number) {
    this.material.uniforms.uTime.value = time * 0.001
    if (!this.dragging && !this.animating) this.syncOptions()
    this.renderer.render(this.scene, this.camera)
    this.animationFrame = requestAnimationFrame(this.loop)
  }

  private wrap(index: number) {
    return ((index % this.items.length) + this.items.length) % this.items.length
  }

  private announce(index: number) {
    if (this.shown === index) return
    this.shown = index
    this.onIndexChange?.(index)
  }

  private prepareNext(direction: number) {
    const next = this.wrap(this.current + direction)
    return this.prepare(next, direction)
  }

  private prepare(next: number, direction: number) {
    this.material.uniforms.tCurrent.value = this.textures[this.current]
    this.material.uniforms.tNext.value = this.textures[next]
    this.material.uniforms.uCurrentSize.value = this.sizes[this.current]
    this.material.uniforms.uNextSize.value = this.sizes[next]
    this.material.uniforms.uDir.value = direction
    return next
  }

  private commit(next: number) {
    this.current = next
    this.material.uniforms.tCurrent.value = this.textures[next]
    this.material.uniforms.uCurrentSize.value = this.sizes[next]
    this.material.uniforms.uProgress.value = 0
    this.animating = false
    this.tween = null
    this.announce(next)
  }

  move(direction: number) {
    if (this.animating || this.dragging || this.items.length < 2) return
    const options = this.getOptions()
    const raw = this.current + direction
    if (!options.loop && (raw < 0 || raw >= this.items.length)) return
    this.syncOptions()
    const next = this.prepareNext(direction)
    this.animating = true
    this.announce(next)
    this.tween = gsap.fromTo(
      this.material.uniforms.uProgress,
      { value: 0 },
      { value: 1, duration: this.reducedMotion ? Math.min(options.duration, 0.35) : options.duration, ease: options.ease, onComplete: () => this.commit(next) },
    )
  }

  goTo(index: number) {
    if (this.animating || this.dragging || index === this.current || index < 0 || index >= this.items.length) return
    const clockwise = (index - this.current + this.items.length) % this.items.length
    const counterClockwise = (this.current - index + this.items.length) % this.items.length
    const direction = clockwise <= counterClockwise ? 1 : -1
    const options = this.getOptions()
    this.syncOptions()
    const next = this.prepare(index, direction)
    this.animating = true
    this.announce(next)
    this.tween = gsap.fromTo(
      this.material.uniforms.uProgress,
      { value: 0 },
      { value: 1, duration: this.reducedMotion ? Math.min(options.duration, 0.35) : options.duration, ease: options.ease, onComplete: () => this.commit(next) },
    )
  }

  getCurrentIndex() { return this.current }

  setPointer(x: number, y: number) {
    this.material.uniforms.uPointer.value.set(x, y)
  }

  beginDrag() {
    if (this.animating || this.items.length < 2) return false
    this.dragging = true
    this.dragDirection = 0
    this.syncOptions()
    return true
  }

  drag(delta: number) {
    if (!this.dragging) return
    const direction = delta < 0 ? 1 : -1
    const options = this.getOptions()
    const raw = this.current + direction
    if (!options.loop && (raw < 0 || raw >= this.items.length)) {
      this.material.uniforms.uProgress.value = 0
      return
    }
    if (direction !== this.dragDirection) {
      this.dragDirection = direction
      this.prepareNext(direction)
    }
    const progress = Math.min(Math.abs(delta), 1)
    this.material.uniforms.uProgress.value = progress
    this.announce(progress > 0.5 ? this.wrap(this.current + direction) : this.current)
  }

  endDrag() {
    if (!this.dragging) return
    this.dragging = false
    if (this.dragDirection === 0) return
    const next = this.wrap(this.current + this.dragDirection)
    const progress = this.material.uniforms.uProgress.value as number
    this.animating = true
    if (progress > 0.4) {
      this.announce(next)
      this.tween = gsap.to(this.material.uniforms.uProgress, { value: 1, duration: this.reducedMotion ? 0.2 : 0.45, ease: 'power2.out', onComplete: () => this.commit(next) })
    } else {
      this.announce(this.current)
      this.tween = gsap.to(this.material.uniforms.uProgress, {
        value: 0,
        duration: this.reducedMotion ? 0.2 : 0.4,
        ease: 'power2.out',
        onComplete: () => { this.animating = false; this.tween = null },
      })
    }
  }

  destroy() {
    cancelAnimationFrame(this.animationFrame)
    this.tween?.kill()
    this.observer.disconnect()
    this.textures.forEach((texture) => { if (texture !== this.fallback) texture.dispose() })
    this.fallback.dispose()
    this.mesh.geometry.dispose()
    this.material.dispose()
    this.renderer.dispose()
    this.renderer.domElement.remove()
  }
}

export default function MorphSlider({
  items,
  startIndex = 0,
  activeIndex,
  transition = 'melt',
  duration = 1.1,
  ease = 'power2.inOut',
  intensity = 0.5,
  scale = 2.4,
  aberration = 0.28,
  drift = 0.25,
  autoplay = false,
  autoplayDelay = 5,
  loop = true,
  radius = 18,
  overlayColor = '#070712',
  showCaptions = true,
  showControls = true,
  showIndicators = true,
  className = '',
  onIndexChange,
}: MorphSliderProps) {
  const stageRef = useRef<HTMLDivElement>(null)
  const engineRef = useRef<MorphEngine | null>(null)
  const onIndexChangeRef = useRef(onIndexChange)
  const optionsRef = useRef<SliderOptions>({ transition, duration, ease, intensity, scale, aberration, drift, autoplay, autoplayDelay, loop, radius, overlayColor })
  const [index, setIndex] = useState(Math.min(Math.max(startIndex, 0), Math.max(items.length - 1, 0)))
  const [hovering, setHovering] = useState(false)
  const [webglFailed, setWebglFailed] = useState(false)
  optionsRef.current = { transition, duration, ease, intensity, scale, aberration, drift, autoplay, autoplayDelay, loop, radius, overlayColor }
  onIndexChangeRef.current = onIndexChange

  useEffect(() => {
    const stage = stageRef.current
    if (!stage || items.length === 0) return undefined
    try {
      const engine = new MorphEngine(stage, items, startIndex, window.matchMedia('(prefers-reduced-motion: reduce)').matches, () => optionsRef.current, (nextIndex) => {
        setIndex(nextIndex)
        onIndexChangeRef.current?.(nextIndex)
      })
      engineRef.current = engine
      setWebglFailed(false)
      setIndex(Math.min(Math.max(startIndex, 0), items.length - 1))
      return () => { engine.destroy(); engineRef.current = null }
    } catch {
      setWebglFailed(true)
      return undefined
    }
  }, [items, startIndex])

  useEffect(() => {
    if (activeIndex === undefined || activeIndex === engineRef.current?.getCurrentIndex()) return
    engineRef.current?.goTo(activeIndex)
  }, [activeIndex])

  useEffect(() => {
    if (!autoplay || hovering || items.length < 2) return undefined
    const timeout = window.setTimeout(() => engineRef.current?.move(1), Math.max(autoplayDelay, 1) * 1000)
    return () => window.clearTimeout(timeout)
  }, [autoplay, autoplayDelay, hovering, index, items.length])

  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return undefined
    let startX = 0
    let width = 1
    let active = false
    const down = (event: PointerEvent) => {
      const rect = stage.getBoundingClientRect()
      startX = event.clientX
      width = rect.width || 1
      engineRef.current?.setPointer((event.clientX - rect.left) / width, 1 - (event.clientY - rect.top) / Math.max(rect.height, 1))
      active = engineRef.current?.beginDrag() ?? false
      if (active) stage.setPointerCapture?.(event.pointerId)
    }
    const move = (event: PointerEvent) => { if (active) engineRef.current?.drag((event.clientX - startX) / width) }
    const end = () => { if (active) { active = false; engineRef.current?.endDrag() } }
    stage.addEventListener('pointerdown', down)
    stage.addEventListener('pointermove', move)
    stage.addEventListener('pointerup', end)
    stage.addEventListener('pointercancel', end)
    return () => {
      stage.removeEventListener('pointerdown', down)
      stage.removeEventListener('pointermove', move)
      stage.removeEventListener('pointerup', end)
      stage.removeEventListener('pointercancel', end)
    }
  }, [])

  const move = useCallback((direction: number) => engineRef.current?.move(direction), [])
  const keyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowRight') { event.preventDefault(); move(1) }
    if (event.key === 'ArrowLeft') { event.preventDefault(); move(-1) }
  }, [move])

  const activeItem = items[index]
  const style = { borderRadius: `${radius}px`, '--ms-swap': `${duration * 0.66}s`, '--ms-dot': `${duration * 0.45}s` } as CSSProperties
  if (items.length === 0) return <div className={`morph-slider morph-slider-empty ${className}`.trim()} style={style} />

  return (
    <div className={`morph-slider ${className}`.trim()} style={style} onMouseEnter={() => setHovering(true)} onMouseLeave={() => setHovering(false)}>
      <div ref={stageRef} className="morph-slider-stage" role="group" aria-roledescription="carousel" aria-label="Coast audio artwork" tabIndex={0} onKeyDown={keyDown}>
        {webglFailed && <img src={activeItem.image} alt="" className="morph-slider-fallback" />}
      </div>
      {showCaptions && activeItem?.caption && <div className="morph-slider-caption" aria-live="polite"><span className="morph-slider-caption-text is-active">{activeItem.caption}</span></div>}
      {showControls && items.length > 1 && <div className="morph-slider-controls">
        <button type="button" className="morph-slider-btn" aria-label="Previous song artwork" onClick={() => move(-1)}>‹</button>
        <button type="button" className="morph-slider-btn" aria-label="Next song artwork" onClick={() => move(1)}>›</button>
      </div>}
      {showIndicators && items.length > 1 && <div className="morph-slider-indicators" role="tablist" aria-label="Song artwork">
        {items.map((item, itemIndex) => <button key={`${item.caption ?? 'cover'}-${itemIndex}`} type="button" role="tab" aria-selected={itemIndex === index} aria-label={`Show ${item.caption ?? `cover ${itemIndex + 1}`}`} className={`morph-slider-dot ${itemIndex === index ? 'is-active' : ''}`} onClick={() => engineRef.current?.goTo(itemIndex)} />)}
      </div>}
    </div>
  )
}
