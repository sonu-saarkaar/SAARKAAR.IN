/*
  Character.jsx — Stable Third-Person Controller
  ──────────────────────────────────────────────
  Key fixes over previous version:
  • ALL hot-path state lives in refs — zero React re-renders per frame
  • setUserPosition throttled to 10 fps (100ms) — not every 60fps frame
  • Camera look-target is a persistent ref, never re-allocated mid-frame
  • Single useFrame handles movement + camera (no double lerp fight)
  • Smooth angle damping without introducing input lag
  • Proper wall-slide: try X-only and Z-only before blocking entirely
*/

import React, { useEffect, useRef, useMemo, useCallback, useState } from 'react'
import { useFrame, useThree, useGraph } from '@react-three/fiber'
import * as THREE from 'three'
import { useGLTF, useAnimations, Html } from '@react-three/drei'
import { SkeletonUtils } from 'three-stdlib'
import { useExperienceStore } from '../store/experienceStore'
import { usePerformanceStore } from '../store/performanceStore'

// ─────────────── Constants ───────────────
const WALK_SPEED = 2.25
const RUN_SPEED = 3.4
const ACCEL = 10.5
const DECEL = 9.5
const TURN_SPEED = 8.8

const CAM_DIST_WALK = 4.2
const CAM_DIST_RUN = 5.0
const CAM_HEIGHT = 1.55
const CAM_OFFSET_X = 0.28
const CAM_SMOOTHNESS = 6.0
const CAM_LOOK_LERP = 8.0
const MOUSE_SENS = 0.0009
const CHAR_RADIUS = 0.24
const COLLISION_SKIN = 0.015

// Jump / gravity
const JUMP_VELOCITY = 4.2
const GRAVITY = -10.5

// ─────────────── Animation resolver ─────────────────
const SYNONYM_MAP = {
    idle: ['idle', 'stand', 'breath'],
    walk: ['walk', 'walking'],
    run: ['run', 'jog', 'sprint'],
    sit: ['sit', 'seated', 'chair'],
}

function resolveAction(actions, preferred) {
    const names = Object.keys(actions)
    if (!names.length) return null
    const tokens = SYNONYM_MAP[preferred] || [preferred]
    for (const tok of tokens) {
        const hit = names.find(n => n.toLowerCase().includes(tok))
        if (hit) return hit
    }
    return names.find(n => n.toLowerCase().includes('idle')) || names[0]
}

// ─────────────── Sanitize animation clips ───────────
function sanitizeClips(clips) {
    return clips.map(clip => {
        const c = clip.clone()
        c.tracks = c.tracks.filter(t => !t.name.toLowerCase().includes('.scale'))
        return c
    })
}

// ─────────────── GLB Mesh Enhancement ───────────────
function enhanceMesh(clone, settings) {
    clone.traverse(child => {
        if (!child.isMesh) return
        child.castShadow = settings.shadows
        child.receiveShadow = settings.shadows
        if (child.material) {
            child.material = child.material.clone()
            child.material.roughness = Math.min(child.material.roughness ?? 0.78, 0.78)
            child.material.metalness = Math.min(child.material.metalness ?? 0.08, 0.12)
            child.material.envMapIntensity = settings.reflections ? 1.05 : 0.4
            if ('clearcoat' in child.material) {
                child.material.clearcoat = settings.reflections ? Math.max(child.material.clearcoat ?? 0, 0.08) : 0
                child.material.clearcoatRoughness = Math.min(child.material.clearcoatRoughness ?? 0.7, 0.55)
            }
            child.material.needsUpdate = true
        }
    })
}

// ══════════════════════════════════════════════════
// GLB Character Mesh + Animations
// ══════════════════════════════════════════════════
function RealisticHuman({ charRef, isSitting, conversationPartner, speedRef }) {
    const groupRef = useRef()
    const { scene, animations } = useGLTF('/models/character.glb')
    const clone = useMemo(() => SkeletonUtils.clone(scene), [scene])
    const clips = useMemo(() => sanitizeClips(animations), [animations])
    const { nodes } = useGraph(clone)
    const { actions } = useAnimations(clips, groupRef)
    const isAnimationReady = !!actions && Object.keys(actions).length > 0

    const activeAction = useRef(null)
    const locomotion = useRef(null)
    const { settings } = usePerformanceStore()

    // Enhance materials on mount
    useEffect(() => { enhanceMesh(clone, settings) }, [clone, settings])

    // Pass mesh group ref up to parent for position reads
    useEffect(() => {
        if (charRef && groupRef.current) charRef.current = groupRef.current
    }, [charRef])

    useEffect(() => {
        if (!actions || !Object.keys(actions).length) return
        const idleName = resolveAction(actions, 'idle')
        if (!idleName) return

        Object.values(actions).forEach((act) => {
            if (act) {
                act.enabled = true
                act.stop()
            }
        })

        const idleAction = actions[idleName]
        idleAction.reset().fadeIn(0.2).play()
        activeAction.current = idleName
        locomotion.current = 'idle'

        return () => {
            Object.values(actions).forEach((act) => act?.stop())
        }
    }, [actions])

    // Animation state machine — runs in useFrame to respond to speed ref changes
    useFrame((_, delta) => {
        if (!actions || !Object.keys(actions).length) return

        const spd = speedRef.current
        const sitting = isSitting

        let want = 'idle'
        if (sitting) want = 'sit'
        else if (spd > 2.15) want = 'run'
        else if (spd > 0.22) want = 'walk'

        // Hysteresis: avoid jittering between states around thresholds
        if (locomotion.current === 'run' && spd > 1.55 && !sitting) want = 'run'
        if (locomotion.current === 'walk' && spd > 0.1 && spd <= 2.35 && !sitting) want = 'walk'
        if (locomotion.current === 'idle' && spd < 0.12 && !sitting) want = 'idle'

        if (want !== locomotion.current) {
            locomotion.current = want
            const nextName = resolveAction(actions, want)
            const prevName = activeAction.current

            if (nextName && nextName !== prevName) {
                const next = actions[nextName]
                next.enabled = true
                next.reset().fadeIn(0.22).play()

                if (prevName && actions[prevName]) {
                    actions[prevName].fadeOut(0.2)
                }
                activeAction.current = nextName
            }
        }

        if (!activeAction.current) {
            const idleName = resolveAction(actions, 'idle')
            if (idleName && actions[idleName]) {
                actions[idleName].reset().fadeIn(0.15).play()
                activeAction.current = idleName
                locomotion.current = 'idle'
            }
        }

        // Sync animation speed to movement speed
        const curName = activeAction.current
        if (curName && actions[curName]) {
            if (curName.toLowerCase().includes('walk')) {
                actions[curName].timeScale = THREE.MathUtils.clamp((spd / WALK_SPEED) * 1.15, 0.92, 1.35)
            } else if (curName.toLowerCase().includes('run')) {
                actions[curName].timeScale = THREE.MathUtils.clamp((spd / RUN_SPEED) * 1.08, 0.92, 1.3)
            } else {
                actions[curName].timeScale = 1.0
            }
        }

        // Head micro-movement
        const head = nodes.Head || nodes.mixamorigHead
            || clone.getObjectByName('Head') || clone.getObjectByName('mixamorigHead')
        if (head && spd < 0.12) {
            const dt = Math.min(delta, 0.1)
            const t = performance.now() * 0.001
            const targetPitch = conversationPartner ? -0.04 : Math.sin(t * 0.45) * 0.018
            const targetYaw = conversationPartner ? 0 : Math.cos(t * 0.28) * 0.032
            head.rotation.x = THREE.MathUtils.lerp(head.rotation.x, targetPitch, Math.min(1, dt * 2.5))
            head.rotation.y = THREE.MathUtils.lerp(head.rotation.y, targetYaw, Math.min(1, dt * 2.5))
        }
    })

    return (
        <group ref={groupRef} dispose={null} visible={isAnimationReady}>
            <primitive object={clone} />
        </group>
    )
}

useGLTF.preload('/models/character.glb')

// ══════════════════════════════════════════════════
// Main Character Controller
// ══════════════════════════════════════════════════
export default function Character({ walls = [] }) {
    const bodyRef = useRef()    // Three.js Group for the character body
    const meshRef = useRef()    // passed to RealisticHuman

    const { camera, gl } = useThree()
    const { settings } = usePerformanceStore()

    const { setUserPosition, conversationPartner, isSitting, cameraFocus, setCeoDoorOpen } = useExperienceStore()

    const [showCabinBtn, setShowCabinBtn] = useState(false)
    const showCabinBtnRef = useRef(false)

    // ── All movement state in refs (no React state = no re-renders during movement) ──
    const keys = useRef({ f: false, b: false, l: false, r: false, shift: false })
    const isLookDragging = useRef(false)
    const speedRef = useRef(0)
    const yVelRef = useRef(0)       // vertical velocity for jump/gravity
    const isGrounded = useRef(true) // true when character is on ground
    const camYaw = useRef(0)            // current smoothed yaw
    const camPitch = useRef(0.38)         // current smoothed pitch
    const camYawTgt = useRef(0)            // target yaw (from mouse)
    const camPitchTgt = useRef(0.38)         // target pitch
    const lookTarget = useRef(new THREE.Vector3())   // persistent look target
    const posReportTimer = useRef(0)          // throttle setUserPosition calls

    // Re-usable vectors — allocated once, reused every frame
    const _orbitPos = useRef(new THREE.Vector3())
    const _flatDir = useRef(new THREE.Vector3())
    const _rightVec = useRef(new THREE.Vector3())
    const _rOff = useRef(new THREE.Vector3())
    const _lookPoint = useRef(new THREE.Vector3())
    const _bossLook = useRef(new THREE.Vector3())
    const _UP = new THREE.Vector3(0, 1, 0)

    // Renderer quality
    useEffect(() => {
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.toneMappingExposure = 1.05
        if (gl.shadowMap) {
            gl.shadowMap.enabled = true
            gl.shadowMap.type = THREE.PCFShadowMap
        }
    }, [gl])

    // ── Input listeners (no setState = no re-renders) ──
    useEffect(() => {
        const onMouseDown = (e) => {
            const target = e.target
            if (target && (target.closest?.('.ui-container') || target.closest?.('.reception-overlay') || target.closest?.('.dialogue-box-compact'))) {
                isLookDragging.current = false
                return
            }
            if (cameraFocus !== 'lobby' || isSitting) return
            if (e.button !== 0) return
            isLookDragging.current = true
        }

        const onMouseUp = () => {
            isLookDragging.current = false
        }

        const onMouse = (e) => {
            const target = e.target
            if (target && (target.closest?.('.ui-container') || target.closest?.('.reception-overlay') || target.closest?.('.dialogue-box-compact'))) return
            if (!isLookDragging.current || isSitting || cameraFocus !== 'lobby') return
            camYawTgt.current -= e.movementX * MOUSE_SENS
            camPitchTgt.current -= e.movementY * MOUSE_SENS
            camPitchTgt.current = Math.max(0.22, Math.min(0.96, camPitchTgt.current))
        }

        const onKeyDown = (e) => {
            if (isSitting) return
            switch (e.code) {
                case 'KeyW': case 'ArrowUp': keys.current.f = true; break
                case 'KeyS': case 'ArrowDown': keys.current.b = true; break
                case 'KeyA': case 'ArrowLeft': keys.current.l = true; break
                case 'KeyD': case 'ArrowRight': keys.current.r = true; break
                case 'ShiftLeft': case 'ShiftRight': keys.current.shift = true; break
                case 'Tab':
                case 'Space':
                    e.preventDefault() // prevent browser tab-switch
                    if (isGrounded.current) {
                        yVelRef.current = JUMP_VELOCITY
                        isGrounded.current = false
                    }
                    break
            }
        }

        const onJump = () => {
            if (isSitting) return
            if (isGrounded.current) {
                yVelRef.current = JUMP_VELOCITY
                isGrounded.current = false
            }
        }
        const onKeyUp = (e) => {
            switch (e.code) {
                case 'KeyW': case 'ArrowUp': keys.current.f = false; break
                case 'KeyS': case 'ArrowDown': keys.current.b = false; break
                case 'KeyA': case 'ArrowLeft': keys.current.l = false; break
                case 'KeyD': case 'ArrowRight': keys.current.r = false; break
                case 'ShiftLeft': case 'ShiftRight': keys.current.shift = false; break
            }
        }

        const resetKeys = () => {
            keys.current = { f: false, b: false, l: false, r: false, shift: false }
            isLookDragging.current = false
        }

        window.addEventListener('mousedown', onMouseDown)
        window.addEventListener('mouseup', onMouseUp)
        window.addEventListener('mousemove', onMouse)
        window.addEventListener('keydown', onKeyDown)
        window.addEventListener('keyup', onKeyUp)
        window.addEventListener('saarkaar:jump', onJump)
        window.addEventListener('blur', resetKeys)
        document.addEventListener('visibilitychange', resetKeys)
        return () => {
            window.removeEventListener('mousedown', onMouseDown)
            window.removeEventListener('mouseup', onMouseUp)
            window.removeEventListener('mousemove', onMouse)
            window.removeEventListener('keydown', onKeyDown)
            window.removeEventListener('keyup', onKeyUp)
            window.removeEventListener('saarkaar:jump', onJump)
            window.removeEventListener('blur', resetKeys)
            document.removeEventListener('visibilitychange', resetKeys)
        }
    }, [isSitting, cameraFocus])

    // ── FOV in a separate frame loop (cheap) ──
    useFrame((_, delta) => {
        const dt = Math.min(delta, 0.1)
        const tgtFov = (cameraFocus === 'boss_zoom' || cameraFocus === 'interview') ? 44 : 50
        const nextFov = THREE.MathUtils.lerp(camera.fov, tgtFov, Math.min(1, dt * 4))
        if (Math.abs(nextFov - camera.fov) > 0.02) {
            camera.fov = nextFov
            camera.updateProjectionMatrix()
        }
    })

    // ── Main frame loop: movement + camera ──
    useFrame((state, delta) => {
        if (!bodyRef.current) return

        // Prevent lerp overshoot on lag spikes
        const dt = Math.min(delta, 0.1)
        const moveDt = Math.min(delta, 0.22)

        // ─ 1. Smooth camera angles ─
        camYaw.current = THREE.MathUtils.lerp(camYaw.current, camYawTgt.current, Math.min(1, dt * 10))
        camPitch.current = THREE.MathUtils.lerp(camPitch.current, camPitchTgt.current, Math.min(1, dt * 10))

        // ─ 2. Movement input ─
        let mx = 0, mz = 0
        if (!isSitting) {
            if (keys.current.f) mz -= 1
            if (keys.current.b) mz += 1
            if (keys.current.l) mx -= 1
            if (keys.current.r) mx += 1
        }
        const hasInput = (mx !== 0 || mz !== 0)
        const topSpd = isSitting ? 0 : (keys.current.shift ? RUN_SPEED : WALK_SPEED)

        speedRef.current = THREE.MathUtils.lerp(
            speedRef.current, hasInput ? topSpd : 0,
            Math.min(1, moveDt * (hasInput ? ACCEL : DECEL))
        )

        // ─ 3. Orientation + position ─
        const body = bodyRef.current

        // Check for external teleportation requests via store
        const storePos = useExperienceStore.getState().userPosition
        if (storePos && body) {
            const dx = storePos[0] - body.position.x
            const dy = (storePos[1] || 0) - body.position.y
            const dz = storePos[2] - body.position.z
            // Use larger threshold when sitting to avoid micro-snap jitter
            // Only snap on explicit setUserPosition calls (handleSit / handleStand)
            const snapThresh = isSitting ? 0.8 : 1.5

            if (Math.abs(dx) > snapThresh || Math.abs(dz) > snapThresh) {
                body.position.set(storePos[0], storePos[1] || 0, storePos[2])
                camYaw.current = camYawTgt.current
                camPitch.current = camPitchTgt.current
            }
        }

        if (isSitting) {
            // Fixed rotation toward boss (+X world direction)
            // Boss is at world x≈26.4, visitor chairs at x≈23.5 → face +X = rotation.y = -PI/2
            const SIT_ROTATION = -Math.PI / 2
            body.rotation.y = THREE.MathUtils.lerp(body.rotation.y, SIT_ROTATION, Math.min(1, dt * 6))
            // Kill vertical velocity so gravity doesn't accumulate while seated
            yVelRef.current = 0
            isGrounded.current = true
        } else if (speedRef.current > 0.04) {
            // World-space move direction from camera yaw
            let len = Math.sqrt(mx * mx + mz * mz) || 1
            mx /= len; mz /= len

            const wx = mx * Math.cos(camYaw.current) - mz * Math.sin(camYaw.current)
            const wz = mx * Math.sin(camYaw.current) + mz * Math.cos(camYaw.current)

            const dist = speedRef.current * moveDt
            let nx = body.position.x + wx * dist
            let nz = body.position.z + wz * dist

            // ── Wall collision resolve: let character touch walls closely without clipping through ──
            let collided = false
            for (const [gx, gz, gw, gd] of walls) {
                const hw = gw / 2 + CHAR_RADIUS
                const hd = gd / 2 + CHAR_RADIUS
                const dx = nx - gx
                const dz = nz - gz

                if (Math.abs(dx) < hw && Math.abs(dz) < hd) {
                    collided = true
                    const penX = hw - Math.abs(dx)
                    const penZ = hd - Math.abs(dz)

                    if (penX < penZ) {
                        nx += (dx >= 0 ? 1 : -1) * (penX + COLLISION_SKIN)
                    } else {
                        nz += (dz >= 0 ? 1 : -1) * (penZ + COLLISION_SKIN)
                    }
                }
            }

            if (nx !== body.position.x || nz !== body.position.z) {
                body.position.x = nx
                body.position.z = nz
            } else {
                speedRef.current *= collided ? 0.55 : 0.85
            }

            // ─ Jump / Gravity physics ─
            yVelRef.current += GRAVITY * moveDt
            body.position.y += yVelRef.current * moveDt

            if (body.position.y <= 0) {
                body.position.y = 0
                yVelRef.current = 0
                isGrounded.current = true
            } else {
                isGrounded.current = false
            }

            // Face movement direction
            if (hasInput) {
                const tgt = Math.atan2(wx, wz)
                let diff = tgt - body.rotation.y
                while (diff > Math.PI) diff -= Math.PI * 2
                while (diff < -Math.PI) diff += Math.PI * 2
                body.rotation.y = THREE.MathUtils.lerp(body.rotation.y, body.rotation.y + diff, Math.min(1, dt * TURN_SPEED))
            }
        }

        // ─ 4. Report position (throttled to ~10fps to avoid storm of Zustand updates) ─
        posReportTimer.current += dt
        if (posReportTimer.current > 0.1) {
            posReportTimer.current = 0
            setUserPosition([body.position.x, body.position.y, body.position.z])

            // Check Boss Cabin Gate Proximity
            const gatePos = { x: 8, z: 0 }
            const distToGate = Math.sqrt(Math.pow(body.position.x - gatePos.x, 2) + Math.pow(body.position.z - gatePos.z, 2))
            const nearGate = distToGate < 3 && body.position.x < 9.5

            if (nearGate && !showCabinBtnRef.current) {
                showCabinBtnRef.current = true
                setShowCabinBtn(true)
            } else if (!nearGate && showCabinBtnRef.current) {
                showCabinBtnRef.current = false
                setShowCabinBtn(false)
            }
        }

        // ─ 5. Camera ─
        const cp = body.position   // character position

        // Special cinematic modes
        if (cameraFocus === 'boss_zoom') {
            _orbitPos.current.set(cp.x - 2, 1.6, cp.z)
            _bossLook.current.set(25, 1.5, 0)
            camera.position.lerp(_orbitPos.current, Math.min(1, dt * 2.5))
            lookTarget.current.lerp(_bossLook.current, Math.min(1, dt * 2.5))
            camera.lookAt(lookTarget.current)
            return
        }
        if (cameraFocus === 'interview' || isSitting) {
            // FIXED world-space camera — do NOT use body.rotation.y (causes spin loop)
            // Camera sits behind & slightly to side of player, looking past them at boss
            // Player at ~[23.5, 0, 1]. Camera offset: pull back in -X, up, slight +Z
            const camX = cp.x - 1.8  // pull behind (away from boss)
            const camY = cp.y + 1.6  // comfortable eye height when seated
            const camZ = cp.z + 0.6  // slight side offset

            _orbitPos.current.set(camX, camY, camZ)

            // Look target: boss area (world x≈26, y≈1.4 = boss head height)
            _bossLook.current.set(26.0, 1.4, 0)

            camera.position.lerp(_orbitPos.current, Math.min(1, dt * 5))
            lookTarget.current.lerp(_bossLook.current, Math.min(1, dt * 5))
            camera.lookAt(lookTarget.current)
            return
        }

        // ── Standard third-person follow camera ──
        const dist = hasInput
            ? (keys.current.shift ? CAM_DIST_RUN : CAM_DIST_WALK)
            : CAM_DIST_WALK

        // Flat forward direction from yaw
        _flatDir.current.set(
            Math.sin(camYaw.current), 0, Math.cos(camYaw.current)
        ).normalize()

        // Right-shoulder offset
        _rightVec.current.crossVectors(_UP, _flatDir.current).normalize()
        _rOff.current.copy(_rightVec.current).multiplyScalar(CAM_OFFSET_X)

        // Pitch splits into height and pullback
        const pullback = Math.cos(camPitch.current) * dist
        const heightOff = Math.sin(camPitch.current) * dist * 0.35

        // Very subtle walk bob — removed sway sine to avoid oscillation
        const bob = (speedRef.current > 0.1)
            ? Math.abs(Math.sin(state.clock.elapsedTime * 5.5)) * 0.007
            : 0

        _orbitPos.current.set(
            cp.x + _flatDir.current.x * pullback + _rOff.current.x,
            cp.y + CAM_HEIGHT + heightOff + bob,
            cp.z + _flatDir.current.z * pullback + _rOff.current.z
        )

        // Lerp camera position (smooth follow)
        camera.position.lerp(_orbitPos.current, Math.min(1, dt * CAM_SMOOTHNESS))

        // Stable look point — chest level, slight right offset
        _lookPoint.current.set(
            cp.x + _rOff.current.x * 0.35,
            cp.y + 1.45,
            cp.z + _rOff.current.z * 0.35
        )
        lookTarget.current.lerp(_lookPoint.current, Math.min(1, dt * CAM_LOOK_LERP))
        camera.lookAt(lookTarget.current)
    })

    return (
        <group ref={bodyRef}>
            {/* Key lighting pass */}
            <ambientLight intensity={0.25} />
            <directionalLight
                position={[5, 8, 4]}
                intensity={0.95}
                castShadow={settings.shadows}
                shadow-mapSize={settings.highResTextures ? [2048, 2048] : [512, 512]}
                shadow-bias={-0.0002}
            />
            <directionalLight position={[-4, 4, -4]} intensity={0.22} />
            <directionalLight position={[0, 3, -5]} intensity={0.18} color="#cfe2ff" />
            <pointLight position={[0.9, 1.8, -0.6]} intensity={0.24} color="#fff4e6" distance={4} decay={2} />

            <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <circleGeometry args={[0.42, 32]} />
                <meshStandardMaterial color="#000000" transparent opacity={0.22} roughness={1} metalness={0} />
            </mesh>

            <RealisticHuman
                charRef={meshRef}
                isSitting={isSitting}
                conversationPartner={conversationPartner}
                speedRef={speedRef}
            />
            {showCabinBtn && (
                <Html position={[0, 2.2, 0]} center>
                    <button
                        style={{
                            background: 'rgba(10, 10, 10, 0.8)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid #d4af37',
                            padding: '10px 20px',
                            borderRadius: '5px',
                            color: '#d4af37',
                            fontSize: '1rem',
                            fontFamily: 'Inter, sans-serif',
                            textTransform: 'uppercase',
                            letterSpacing: '1px',
                            cursor: 'pointer',
                            pointerEvents: 'auto',
                            boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
                            whiteSpace: 'nowrap',
                            transition: 'all 0.3s ease'
                        }}
                        onPointerDown={(e) => {
                            e.stopPropagation();
                            setCeoDoorOpen(true);
                            setTimeout(() => {
                                setUserPosition([12, bodyRef.current.position.y, 0]);
                            }, 500);
                            setShowCabinBtn(false);
                            showCabinBtnRef.current = false;
                        }}
                        onPointerOver={(e) => {
                            e.target.style.background = '#d4af37';
                            e.target.style.color = '#000';
                        }}
                        onPointerOut={(e) => {
                            e.target.style.background = 'rgba(10, 10, 10, 0.8)';
                            e.target.style.color = '#d4af37';
                        }}
                    >
                        Enter Boss Cabin
                    </button>
                </Html>
            )}
        </group>
    )
}
