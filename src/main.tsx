import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { ContactShadows, Environment, Grid, RoundedBox, useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { Camera, ChevronDown, Grid3X3, ImagePlus, Lightbulb, LogIn, Maximize2, Moon, Play, RotateCcw, Sun, Video, ZoomIn } from 'lucide-react'
import './styles.css'

type Vec3 = { x: number; y: number; z: number }
type AspectKey = '16:9' | '4:3' | '1:1' | '9:16'
type CaptureMode = 'photo' | 'video'
type MotionMode = 'manual' | 'orbit' | 'tilt'

type ExportApi = {
  exportStill: () => Promise<void>
  startRecording: (seconds?: number) => Promise<void>
}

const ASPECTS: Record<AspectKey, number> = {
  '16:9': 16 / 9,
  '4:3': 4 / 3,
  '1:1': 1,
  '9:16': 9 / 16,
}

function makeDemoSvg(title: string, accent: string, variant: number) {
  const cards = variant === 0
    ? `<rect x="116" y="170" width="455" height="244" rx="24" fill="#171a20"/><rect x="598" y="170" width="486" height="244" rx="24" fill="#f2f3f5"/><rect x="116" y="444" width="968" height="196" rx="24" fill="#f2f3f5"/>`
    : variant === 1
      ? `<rect x="116" y="164" width="968" height="128" rx="22" fill="#15171b"/><rect x="116" y="322" width="296" height="318" rx="22" fill="#eef0f3"/><rect x="442" y="322" width="642" height="318" rx="22" fill="#eef0f3"/>`
      : `<rect x="116" y="164" width="626" height="476" rx="22" fill="#eef0f3"/><rect x="772" y="164" width="312" height="224" rx="22" fill="#15171b"/><rect x="772" y="418" width="312" height="222" rx="22" fill="#eef0f3"/>`
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="720" viewBox="0 0 1200 720">
    <rect width="1200" height="720" rx="32" fill="#fbfbfc"/>
    <rect width="1200" height="76" fill="#ffffff"/>
    <circle cx="42" cy="38" r="8" fill="#ff605c"/><circle cx="68" cy="38" r="8" fill="#ffbd44"/><circle cx="94" cy="38" r="8" fill="#00ca4e"/>
    <rect x="134" y="27" width="280" height="20" rx="10" fill="#e8eaed"/>
    <text x="116" y="132" fill="#17181b" font-size="30" font-family="Arial, sans-serif" font-weight="700">${title}</text>
    <circle cx="1048" cy="126" r="18" fill="${accent}"/><rect x="1077" y="114" width="72" height="24" rx="12" fill="#17181b"/>
    ${cards}
    <rect x="146" y="204" width="190" height="18" rx="9" fill="${accent}" opacity=".94"/>
    <rect x="146" y="238" width="304" height="12" rx="6" fill="#69707b" opacity=".45"/>
    <rect x="146" y="268" width="244" height="12" rx="6" fill="#69707b" opacity=".25"/>
  </svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

const DEMOS = [
  { name: 'Dashboard', src: makeDemoSvg('Revenue dashboard', '#f4c84c', 0) },
  { name: 'Workspace', src: makeDemoSvg('Project workspace', '#8aa4ff', 1) },
  { name: 'Analytics', src: makeDemoSvg('Product analytics', '#9ce0bf', 2) },
]

function ScreenProduct({
  textureUrl,
  rotation,
  scale,
  aspect,
  grid,
  motion,
  recording,
}: {
  textureUrl: string
  rotation: Vec3
  scale: number
  aspect: number
  grid: boolean
  motion: MotionMode
  recording: boolean
}) {
  const group = useRef<THREE.Group>(null)
  const texture = useTexture(textureUrl)
  const baseHeight = 2.8
  const width = baseHeight * aspect
  const height = baseHeight

  useEffect(() => {
    texture.colorSpace = THREE.SRGBColorSpace
    texture.anisotropy = 16
    texture.needsUpdate = true
  }, [texture])

  useFrame((state, delta) => {
    if (!group.current || !recording || motion === 'manual') return
    if (motion === 'orbit') {
      group.current.rotation.y += delta * 0.42
    } else if (motion === 'tilt') {
      group.current.rotation.x = THREE.MathUtils.degToRad(rotation.x + Math.sin(state.clock.elapsedTime * 1.15) * 13)
      group.current.rotation.y = THREE.MathUtils.degToRad(rotation.y + Math.sin(state.clock.elapsedTime * 0.72) * 8)
    }
  })

  useEffect(() => {
    if (!group.current || (recording && motion !== 'manual')) return
    group.current.rotation.set(
      THREE.MathUtils.degToRad(rotation.x),
      THREE.MathUtils.degToRad(rotation.y),
      THREE.MathUtils.degToRad(rotation.z),
    )
  }, [rotation, recording, motion])

  return (
    <group ref={group} scale={scale} position={[0, 0.25, 0]}>
      <RoundedBox args={[width + 0.13, height + 0.13, 0.15]} radius={0.08} smoothness={6} castShadow receiveShadow>
        <meshStandardMaterial color="#15171b" metalness={0.25} roughness={0.28} />
      </RoundedBox>
      <mesh position={[0, 0, 0.081]} castShadow>
        <planeGeometry args={[width, height]} />
        <meshPhysicalMaterial map={texture} roughness={0.36} metalness={0.02} clearcoat={0.22} clearcoatRoughness={0.55} toneMapped={false} />
      </mesh>
      {grid && (
        <Grid
          position={[0, 0, 0.087]}
          args={[width, height]}
          cellSize={0.25}
          cellThickness={0.45}
          cellColor="#ffffff"
          sectionSize={1}
          sectionThickness={0.7}
          sectionColor="#ffffff"
          fadeDistance={8}
          fadeStrength={1}
          infiniteGrid={false}
        />
      )}
    </group>
  )
}

function SceneController({
  exportApi,
  rotation,
  setRotation,
  textureUrl,
  aspect,
  scale,
  grid,
  lightIntensity,
  lightDirection,
  motion,
  recording,
  setRecording,
}: {
  exportApi: React.MutableRefObject<ExportApi | null>
  rotation: Vec3
  setRotation: React.Dispatch<React.SetStateAction<Vec3>>
  textureUrl: string
  aspect: number
  scale: number
  grid: boolean
  lightIntensity: number
  lightDirection: number
  motion: MotionMode
  recording: boolean
  setRecording: React.Dispatch<React.SetStateAction<boolean>>
}) {
  const { gl, scene, camera, size } = useThree()
  const keys = useRef({ space: false, shift: false })
  const drag = useRef({ active: false, x: 0, y: 0 })
  const pan = useRef(new THREE.Vector3(0, 0, 0))

  useEffect(() => {
    gl.shadowMap.enabled = true
    gl.shadowMap.type = THREE.PCFSoftShadowMap
    gl.outputColorSpace = THREE.SRGBColorSpace
    gl.toneMapping = THREE.ACESFilmicToneMapping
    gl.toneMappingExposure = 1

    const canvas = gl.domElement
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') { keys.current.space = true; e.preventDefault() }
      if (e.key === 'Shift') keys.current.shift = true
    }
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') keys.current.space = false
      if (e.key === 'Shift') keys.current.shift = false
    }
    const onPointerDown = (e: PointerEvent) => {
      drag.current = { active: true, x: e.clientX, y: e.clientY }
      canvas.setPointerCapture?.(e.pointerId)
    }
    const onPointerMove = (e: PointerEvent) => {
      if (!drag.current.active) return
      const dx = e.clientX - drag.current.x
      const dy = e.clientY - drag.current.y
      drag.current.x = e.clientX
      drag.current.y = e.clientY

      if (keys.current.space) {
        pan.current.x += dx * 0.006
        pan.current.y -= dy * 0.006
        camera.position.x -= dx * 0.006
        camera.position.y += dy * 0.006
        camera.lookAt(pan.current)
      } else if (keys.current.shift) {
        setRotation((r) => ({ ...r, z: THREE.MathUtils.clamp(r.z + dx * 0.28, -180, 180) }))
      } else {
        setRotation((r) => ({
          ...r,
          y: THREE.MathUtils.clamp(r.y + dx * 0.24, -180, 180),
          x: THREE.MathUtils.clamp(r.x + dy * 0.24, -85, 85),
        }))
      }
    }
    const onPointerUp = () => { drag.current.active = false }
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      camera.position.z = THREE.MathUtils.clamp(camera.position.z + e.deltaY * 0.004, 3.2, 11)
    }

    window.addEventListener('keydown', onKeyDown, { passive: false })
    window.addEventListener('keyup', onKeyUp)
    canvas.addEventListener('pointerdown', onPointerDown)
    canvas.addEventListener('pointermove', onPointerMove)
    canvas.addEventListener('pointerup', onPointerUp)
    canvas.addEventListener('pointercancel', onPointerUp)
    canvas.addEventListener('wheel', onWheel, { passive: false })

    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      canvas.removeEventListener('pointerdown', onPointerDown)
      canvas.removeEventListener('pointermove', onPointerMove)
      canvas.removeEventListener('pointerup', onPointerUp)
      canvas.removeEventListener('pointercancel', onPointerUp)
      canvas.removeEventListener('wheel', onWheel)
    }
  }, [camera, gl, setRotation])

  useEffect(() => {
    exportApi.current = {
      exportStill: async () => {
        const prevRatio = gl.getPixelRatio()
        const prevSize = new THREE.Vector2()
        gl.getSize(prevSize)
        const targetWidth = 3840
        const targetHeight = Math.round(targetWidth / Math.max(0.7, size.width / size.height))
        gl.setPixelRatio(1)
        gl.setSize(targetWidth, targetHeight, false)
        if (camera instanceof THREE.PerspectiveCamera) {
          camera.aspect = targetWidth / targetHeight
          camera.updateProjectionMatrix()
        }
        gl.render(scene, camera)
        const blob = await new Promise<Blob | null>((resolve) => gl.domElement.toBlob(resolve, 'image/png', 1))
        gl.setPixelRatio(prevRatio)
        gl.setSize(prevSize.x, prevSize.y, false)
        if (camera instanceof THREE.PerspectiveCamera) {
          camera.aspect = prevSize.x / prevSize.y
          camera.updateProjectionMatrix()
        }
        if (blob) {
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `ui-studio-${Date.now()}.png`
          a.click()
          URL.revokeObjectURL(url)
        }
      },
      startRecording: async (seconds = 6) => {
        if (!('MediaRecorder' in window)) throw new Error('MediaRecorder is not supported in this browser.')
        const stream = gl.domElement.captureStream(60)
        const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ? 'video/webm;codecs=vp9' : 'video/webm'
        const recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 14_000_000 })
        const chunks: BlobPart[] = []
        recorder.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data) }
        recorder.onstop = () => {
          const blob = new Blob(chunks, { type: mime })
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `ui-studio-${Date.now()}.webm`
          a.click()
          URL.revokeObjectURL(url)
          stream.getTracks().forEach((track) => track.stop())
          setRecording(false)
        }
        setRecording(true)
        recorder.start(250)
        window.setTimeout(() => recorder.state !== 'inactive' && recorder.stop(), seconds * 1000)
      },
    }
    return () => { exportApi.current = null }
  }, [camera, gl, scene, setRecording, size.height, size.width])

  const keyLightPosition = useMemo(() => {
    const r = 6.5
    const rad = THREE.MathUtils.degToRad(lightDirection)
    return [Math.cos(rad) * r, 5.3, Math.sin(rad) * r] as [number, number, number]
  }, [lightDirection])

  return (
    <>
      <color attach="background" args={['#111214']} />
      <fog attach="fog" args={['#111214', 10, 22]} />
      <ambientLight intensity={0.32} />
      <directionalLight position={keyLightPosition} intensity={lightIntensity * 2.2} castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} />
      <spotLight position={[-4, 4.5, 5]} intensity={lightIntensity * 38} angle={0.48} penumbra={0.85} decay={2} distance={18} castShadow />
      <pointLight position={[4, 1.4, -2]} intensity={lightIntensity * 5} distance={10} />
      <Suspense fallback={null}>
        <ScreenProduct
          textureUrl={textureUrl}
          rotation={rotation}
          scale={scale}
          aspect={aspect}
          grid={grid}
          motion={motion}
          recording={recording}
        />
        <Environment preset="studio" environmentIntensity={0.25} />
      </Suspense>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.1, 0]} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color="#111214" roughness={0.93} metalness={0.02} />
      </mesh>
      <ContactShadows position={[0, -2.07, 0]} opacity={0.42} scale={14} blur={2.8} far={7} />
    </>
  )
}

function Knob({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (n: number) => void }) {
  const start = useRef<{ y: number; value: number } | null>(null)
  const angle = -135 + ((value - min) / (max - min)) * 270
  const onPointerDown = (e: React.PointerEvent) => {
    start.current = { y: e.clientY, value }
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  const onPointerMove = (e: React.PointerEvent) => {
    if (!start.current) return
    const delta = (start.current.y - e.clientY) * ((max - min) / 180)
    onChange(Math.round(THREE.MathUtils.clamp(start.current.value + delta, min, max)))
  }
  return (
    <div className="knob-wrap">
      <button className="knob" onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={() => { start.current = null }} aria-label={`${label} rotation ${value} degrees`}>
        <span className="knob-mark" style={{ transform: `translateX(-50%) rotate(${angle}deg)` }} />
      </button>
      <div className="knob-meta"><span>{label}</span><b>{Math.round(value)}°</b></div>
    </div>
  )
}

function App() {
  const [mode, setMode] = useState<CaptureMode>('photo')
  const [rotation, setRotation] = useState<Vec3>({ x: -7, y: -18, z: 1 })
  const [aspectKey, setAspectKey] = useState<AspectKey>('16:9')
  const [scale, setScale] = useState(1)
  const [grid, setGrid] = useState(false)
  const [lightIntensity, setLightIntensity] = useState(1)
  const [lightDirection, setLightDirection] = useState(45)
  const [textureUrl, setTextureUrl] = useState(DEMOS[0].src)
  const [demoName, setDemoName] = useState(DEMOS[0].name)
  const [darkUi, setDarkUi] = useState(false)
  const [motion, setMotion] = useState<MotionMode>('orbit')
  const [recording, setRecording] = useState(false)
  const [message, setMessage] = useState('Drag to rotate · Space + drag to pan · Shift + drag to roll')
  const fileRef = useRef<HTMLInputElement>(null)
  const exportApi = useRef<ExportApi | null>(null)

  const reset = () => {
    setRotation({ x: -7, y: -18, z: 1 })
    setScale(1)
    setLightIntensity(1)
    setLightDirection(45)
  }

  const upload = (file?: File) => {
    if (!file) return
    if (!file.type.startsWith('image/')) { setMessage('Please choose an image file.'); return }
    const url = URL.createObjectURL(file)
    setTextureUrl((old) => { if (old.startsWith('blob:')) URL.revokeObjectURL(old); return url })
    setDemoName(file.name)
    setMessage('Image loaded — drag the screen to compose your shot.')
  }

  const capture = async () => {
    try {
      if (!exportApi.current) return
      if (mode === 'photo') {
        setMessage('Rendering high-resolution still…')
        await exportApi.current.exportStill()
        setMessage('High-resolution PNG exported.')
      } else {
        setMessage(`Recording 6s ${motion === 'manual' ? 'manual movement' : motion} clip…`)
        await exportApi.current.startRecording(6)
      }
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Capture failed.')
      setRecording(false)
    }
  }

  return (
    <div className={`app ${darkUi ? 'dark-ui' : ''}`}>
      <header className="topbar">
        <div className="brand"><span className="brand-dot" /> <span>Studio</span></div>
        <div className="top-actions">
          <label className="select-shell demo-select">
            <span className="select-label">Demo</span>
            <select value={demoName} onChange={(e) => {
              const demo = DEMOS.find((d) => d.name === e.target.value)
              if (demo) { setDemoName(demo.name); setTextureUrl(demo.src) }
            }}>
              {DEMOS.map((d) => <option key={d.name}>{d.name}</option>)}
              {!DEMOS.some((d) => d.name === demoName) && <option>{demoName}</option>}
            </select>
            <ChevronDown size={14} />
          </label>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => upload(e.target.files?.[0])} />
          <button className="button" onClick={() => fileRef.current?.click()}><ImagePlus size={16} /> Select image</button>
          <button className="icon-button" onClick={() => setDarkUi((v) => !v)} aria-label="Toggle theme">{darkUi ? <Sun size={16} /> : <Moon size={16} />}</button>
          <button className="button ghost"><LogIn size={15} /> Login</button>
        </div>
      </header>

      <main className="workspace">
        <div className="viewport-card">
          <div className="viewport-badge"><span className="live-dot" /> LIVE PREVIEW</div>
          <Canvas
            shadows
            dpr={[1, 2]}
            gl={{ antialias: true, alpha: false, preserveDrawingBuffer: true }}
            camera={{ position: [0, 0.25, 6.4], fov: 42, near: 0.1, far: 100 }}
          >
            <SceneController
              exportApi={exportApi}
              rotation={rotation}
              setRotation={setRotation}
              textureUrl={textureUrl}
              aspect={ASPECTS[aspectKey]}
              scale={scale}
              grid={grid}
              lightIntensity={lightIntensity}
              lightDirection={lightDirection}
              motion={motion}
              recording={recording}
              setRecording={setRecording}
            />
          </Canvas>
          <div className="viewport-help">{message}</div>
          <button className="reset-fab" onClick={reset}><RotateCcw size={15} /> Reset view</button>
        </div>
      </main>

      <section className="camera-dock">
        <div className="dock-section mode-switch">
          <button className={mode === 'photo' ? 'active' : ''} onClick={() => setMode('photo')}><Camera size={14} /> PHOTO</button>
          <button className={mode === 'video' ? 'active' : ''} onClick={() => setMode('video')}><Video size={14} /> VIDEO</button>
        </div>

        <div className="dock-divider" />
        <div className="knobs">
          <Knob label="X" value={rotation.x} min={-85} max={85} onChange={(x) => setRotation((r) => ({ ...r, x }))} />
          <Knob label="Y" value={rotation.y} min={-180} max={180} onChange={(y) => setRotation((r) => ({ ...r, y }))} />
          <Knob label="Z" value={rotation.z} min={-180} max={180} onChange={(z) => setRotation((r) => ({ ...r, z }))} />
        </div>
        <div className="dock-divider" />

        <div className="compact-controls">
          <div className="control-group">
            <label><Maximize2 size={13} /> Aspect</label>
            <div className="segmented mini">
              {(Object.keys(ASPECTS) as AspectKey[]).map((key) => <button className={aspectKey === key ? 'active' : ''} key={key} onClick={() => setAspectKey(key)}>{key}</button>)}
            </div>
          </div>
          <div className="control-group range-group">
            <label><ZoomIn size={13} /> Scale <b>{scale.toFixed(2)}×</b></label>
            <input type="range" min="0.65" max="1.35" step="0.01" value={scale} onChange={(e) => setScale(Number(e.target.value))} />
          </div>
          <div className="control-group range-group">
            <label><Lightbulb size={13} /> Light <b>{Math.round(lightIntensity * 100)}%</b></label>
            <input type="range" min="0.2" max="1.8" step="0.01" value={lightIntensity} onChange={(e) => setLightIntensity(Number(e.target.value))} />
          </div>
          <div className="control-group range-group direction">
            <label>Direction <b>{lightDirection}°</b></label>
            <input type="range" min="-180" max="180" step="1" value={lightDirection} onChange={(e) => setLightDirection(Number(e.target.value))} />
          </div>
          <button className={`tool-toggle ${grid ? 'active' : ''}`} onClick={() => setGrid((v) => !v)}><Grid3X3 size={15} /> Grid</button>
          {mode === 'video' && (
            <label className="select-shell motion-select">
              <select value={motion} onChange={(e) => setMotion(e.target.value as MotionMode)}>
                <option value="orbit">Orbit</option><option value="tilt">Tilt</option><option value="manual">Manual</option>
              </select><ChevronDown size={13} />
            </label>
          )}
        </div>

        <button className={`capture ${recording ? 'recording' : ''}`} disabled={recording} onClick={capture}>
          <span className="capture-icon">{mode === 'video' ? <Play size={16} fill="currentColor" /> : <Camera size={17} />}</span>
          <span>{recording ? 'Recording…' : 'Capture'}</span>
        </button>
      </section>
    </div>
  )
}

createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>)
