/*
  Assistant.jsx
  — Proximity-based PUBG interaction system
  — Floating 3D speech bubble near mouth
  — Real lip-sync (morph targets + jaw bone fallback)
  — Glow outline when player is within range
*/

import React, { useRef, useMemo, useEffect, useState } from 'react'
import { useFrame, useGraph } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { useExperienceStore } from '../store/experienceStore'
import { useAnimationStore } from '../store/animationStore'
import * as THREE from 'three'
import { useGLTF, useAnimations } from '@react-three/drei'
import { SkeletonUtils } from 'three-stdlib'

// World position of the assistant (must match ReceptionDesk placement)
// ReceptionDesk is placed at [0,0,-10] in LobbyScene, Assistant is offset [0,0,-0.65] inside
const ASSISTANT_WORLD_POS = new THREE.Vector3(0, 0, -10.65)
const TALK_RADIUS = 2.8    // Show [E – Talk] button
const CHAT_CLOSE_RADIUS = 4.5 // Auto-close chat if walks beyond this

// ─────────────────── Speech Bubble ───────────────────
function SpeechBubble({ text, visible }) {
    const [displayed, setDisplayed] = useState(false)

    useEffect(() => {
        if (visible && text) {
            setDisplayed(true)
            const timer = setTimeout(() => setDisplayed(false), 6000)
            return () => clearTimeout(timer)
        } else {
            setDisplayed(false)
        }
    }, [visible, text])

    if (!displayed || !text) return null

    return (
        <Html
            position={[0, 2.36, 0.1]}
            center
            distanceFactor={6}
            style={{ pointerEvents: 'none' }}
            zIndexRange={[200, 0]}
        >
            <div style={{
                background: 'rgba(10,10,18,0.92)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '999px',
                padding: '8px 18px',
                maxWidth: '560px',
                color: '#fff',
                fontFamily: "'Inter', sans-serif",
                fontSize: '12px',
                lineHeight: '1.2',
                backdropFilter: 'blur(12px)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                animation: 'bubbleFade 0.35s ease forwards',
                position: 'relative',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                textAlign: 'center',
            }}>
                {text}
            </div>
            <style>{`
                @keyframes bubbleFade {
                    from { opacity: 0; transform: translateY(-6px) scale(0.95); }
                    to   { opacity: 1; transform: translateY(0)    scale(1);    }
                }
            `}</style>
        </Html>
    )
}

// ─────────────────── PUBG Prompt (3D) ───────────────────
function TalkPrompt({ onTalk }) {
    const [pressed, setPressed] = useState(false)

    const handleClick = () => {
        setPressed(true)
        onTalk()
        setTimeout(() => setPressed(false), 200)
    }

    return (
        <Html
            position={[0, 2.6, 0]}
            center
            distanceFactor={6}
            zIndexRange={[150, 0]}
        >
            <div
                onClick={handleClick}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    background: pressed ? 'rgba(40,40,55,0.95)' : 'rgba(12,12,20,0.88)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '8px',
                    padding: '6px 16px 6px 8px',
                    cursor: 'pointer',
                    backdropFilter: 'blur(10px)',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.7), 0 0 12px rgba(100,200,255,0.15)',
                    animation: 'talkPop 0.3s cubic-bezier(0.25,1,0.5,1) forwards',
                    userSelect: 'none',
                    transition: 'transform 0.15s',
                    transform: pressed ? 'scale(0.93)' : 'scale(1)',
                }}
            >
                <div style={{
                    width: '30px', height: '30px',
                    background: 'linear-gradient(145deg, #f5f5f5, #c8c8c8)',
                    borderRadius: '6px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: '800', fontSize: '14px', color: '#111',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.5), 0 -1px 0 rgba(255,255,255,0.4) inset',
                    border: '1px solid rgba(0,0,0,0.2)',
                    borderBottom: '3px solid #888',
                    fontFamily: "'Inter', sans-serif",
                }}>E</div>
                <span style={{
                    color: '#fff',
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: '600',
                    fontSize: '13px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.6px',
                    textShadow: '0 1px 3px rgba(0,0,0,0.8)',
                }}>Talk</span>
            </div>
            <style>{`
                @keyframes talkPop {
                    from { opacity: 0; transform: scale(0.75) translateY(8px); }
                    to   { opacity: 1; transform: scale(1)    translateY(0);   }
                }
            `}</style>
        </Html>
    )
}

// ─────────────────── Main Component ───────────────────
export default function Assistant(props) {
    const group = useRef()
    const { position = [0, 0, 0] } = props

    const userPosition = useExperienceStore((state) => state.userPosition)
    const currentConversationPartner = useExperienceStore((state) => state.currentConversationPartner)
    const setConversationPartner = useExperienceStore((state) => state.setConversationPartner)
    const assistantState = useAnimationStore((state) => state.assistantState)
    const setAssistantState = useAnimationStore((state) => state.setAssistantState)
    const isNearReception = useExperienceStore((state) => state.isNearReception)
    const setNearReception = useExperienceStore((state) => state.setNearReception)

    const [isNear, setIsNear] = useState(false)
    const [bubbleText, setBubbleText] = useState('')
    const [showBubble, setShowBubble] = useState(false)
    const lastAssistantReply = useExperienceStore((state) => state.lastAssistantReply)

    const isTalking = currentConversationPartner === 'assistant'

    // Load GLB
    const { scene, animations } = useGLTF('/models/character.glb')
    const clone = useMemo(() => SkeletonUtils.clone(scene), [scene])
    const sanitizedAnimations = useMemo(
        () => animations.map((clip) => {
            const nextClip = clip.clone()
            nextClip.tracks = nextClip.tracks.filter((track) => !track.name.toLowerCase().includes('.scale'))
            return nextClip
        }),
        [animations]
    )
    const { nodes } = useGraph(clone)
    const { actions } = useAnimations(sanitizedAnimations, group)

    const currentLookAt = useRef(new THREE.Vector3(0, 1.4, 5))
    const jawAnimRef = useRef(0)
    const userPosVec = useRef(new THREE.Vector3())
    const activeActionRef = useRef(null)

    // Enhance materials
    useEffect(() => {
        clone.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true
                child.receiveShadow = true
                if (child.material) {
                    child.material = child.material.clone()
                    child.material.roughness = Math.min(child.material.roughness || 0.7, 0.7)
                    child.material.envMapIntensity = 0.8
                }
            }
        })
    }, [clone])

    const resolveActionName = (preferred) => {
        const names = Object.keys(actions)
        if (!names.length) return null

        const synonymMap = {
            talk: ['talk', 'speak', 'phone'],
            typing: ['typing', 'type', 'keyboard'],
            sit: ['sit', 'seated', 'chair'],
            idle: ['idle', 'stand', 'breath']
        }

        const candidates = synonymMap[preferred] || [preferred]
        for (const token of candidates) {
            const match = names.find((name) => name.toLowerCase().includes(token))
            if (match) return match
        }

        return names.find((name) => name.toLowerCase().includes('idle')) || names[0]
    }

    // Animation from state
    useEffect(() => {
        let actionName = 'idle'
        if (assistantState === 'talking') actionName = 'talk'
        else if (assistantState === 'typing') actionName = 'typing'
        else if (assistantState === 'sitting') actionName = 'sit'

        const actual = resolveActionName(actionName)
        if (!actual || !actions[actual]) return

        if (activeActionRef.current === actual) return

        actions[actual].enabled = true
        actions[actual].reset().fadeIn(0.22).play()

        if (activeActionRef.current && activeActionRef.current !== actual && actions[activeActionRef.current]) {
            actions[activeActionRef.current].fadeOut(0.18)
        }

        activeActionRef.current = actual
    }, [assistantState, actions])

    // Show speech bubble when latest assistant reply comes in
    useEffect(() => {
        if (!isTalking) return
        if (lastAssistantReply) {
            setBubbleText(lastAssistantReply)
            setShowBubble(true)
        }
    }, [lastAssistantReply, isTalking])

    // Welcome bubble on chat open
    useEffect(() => {
        if (isTalking && !lastAssistantReply) {
            setBubbleText('Welcome to SAARKAAR Virtual Office! How can I help you? 😊')
            setShowBubble(true)
            setAssistantState('talking')
        }
        if (!isTalking) {
            setShowBubble(false)
        }
    }, [isTalking, lastAssistantReply])

    // Proximity check + auto-close
    useEffect(() => {
        const checkKey = (e) => {
            if (e.code === 'KeyE' && isNear && !isTalking) {
                handleTalk()
            }
        }
        window.addEventListener('keydown', checkKey)
        return () => window.removeEventListener('keydown', checkKey)
    }, [isNear, isTalking])

    const handleTalk = () => {
        setConversationPartner('assistant')
        setAssistantState('talking')
        setNearReception(true)
    }

    // Frame loop: proximity + head tracking + lip-sync
    useFrame((state, delta) => {
        const dt = Math.min(delta, 0.1)
        if (!group.current) return
        const t = state.clock.getElapsedTime()

        userPosVec.current.set(userPosition[0], userPosition[1], userPosition[2])

        // Compute distance to assistant world pos
        const groupWorldPos = new THREE.Vector3()
        group.current.getWorldPosition(groupWorldPos)
        const dist = userPosVec.current.distanceTo(groupWorldPos)

        const nearNow = dist < TALK_RADIUS
        if (nearNow !== isNear) setIsNear(nearNow)
        setNearReception(nearNow)

        // Auto-close chat
        if (isTalking && dist > CHAT_CLOSE_RADIUS) {
            setConversationPartner(null)
            setAssistantState('idle')
            setShowBubble(false)
        }

        // ── Head + Body tracking ──
        let targetLookAt = new THREE.Vector3(0, 1.4, 5)
        if (nearNow || isTalking) {
            targetLookAt.set(userPosition[0], 1.5, userPosition[2])

            const targetRotY = Math.atan2(
                userPosition[0] - groupWorldPos.x,
                userPosition[2] - groupWorldPos.z
            )
            let diff = targetRotY - group.current.rotation.y
            while (diff > Math.PI) diff -= Math.PI * 2
            while (diff < -Math.PI) diff += Math.PI * 2
            diff = Math.max(-1.0, Math.min(1.0, diff))
            group.current.rotation.y += diff * 1.5 * dt
        } else {
            group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, 0, Math.min(1, dt * 2))
        }

        currentLookAt.current.lerp(targetLookAt, Math.min(1, dt * 5))

        // ── Head bone IK ──
        const headNode = nodes.Head || nodes.mixamorigHead || clone.getObjectByName('Head') || clone.getObjectByName('mixamorigHead')
        const jawNode = nodes.Jaw || nodes.mixamorigJaw || clone.getObjectByName('Jaw')

        if (headNode) {
            const dx = currentLookAt.current.x - groupWorldPos.x
            const dz = currentLookAt.current.z - groupWorldPos.z
            const dy = currentLookAt.current.y - (groupWorldPos.y + 1.5)

            const targetPitch = Math.atan2(dy, Math.sqrt(dx * dx + dz * dz))
            const targetYaw = Math.atan2(dx, dz)

            headNode.rotation.x = THREE.MathUtils.lerp(headNode.rotation.x, Math.max(-0.2, Math.min(0.25, targetPitch)), Math.min(1, dt * 5))
            headNode.rotation.y = THREE.MathUtils.lerp(headNode.rotation.y, Math.max(-0.6, Math.min(0.6, targetYaw)), Math.min(1, dt * 5))

            if (assistantState === 'listening' || isTalking) {
                headNode.rotation.z = THREE.MathUtils.lerp(headNode.rotation.z, 0.08, Math.min(1, dt * 3))
            } else {
                headNode.rotation.z = THREE.MathUtils.lerp(headNode.rotation.z, 0, Math.min(1, dt * 3))
            }
        }

        // ── Lip-sync ──
        const speaking = assistantState === 'talking'
        if (speaking) {
            const wave = (Math.sin(t * 22) + Math.cos(t * 14)) * 0.5
            jawAnimRef.current = THREE.MathUtils.lerp(jawAnimRef.current, 0.05 + Math.abs(wave) * 0.15, Math.min(1, dt * 15))
        } else {
            jawAnimRef.current = THREE.MathUtils.lerp(jawAnimRef.current, 0, Math.min(1, dt * 10))
        }

        if (jawNode) {
            jawNode.rotation.x = jawAnimRef.current
        } else if (headNode && speaking) {
            headNode.rotation.x += jawAnimRef.current * 0.4
        }

        // Morph targets (ReadyPlayerMe / Avaturn)
        clone.traverse((child) => {
            if (child.isMesh && child.morphTargetInfluences && child.morphTargetDictionary) {
                const mouthIdx = child.morphTargetDictionary['mouthOpen']
                if (mouthIdx !== undefined) {
                    child.morphTargetInfluences[mouthIdx] = jawAnimRef.current * 5.0
                }
                const smileIdx = child.morphTargetDictionary['mouthSmile']
                if (smileIdx !== undefined) {
                    const target = (speaking || isTalking) ? 0.45 : 0
                    child.morphTargetInfluences[smileIdx] = THREE.MathUtils.lerp(
                        child.morphTargetInfluences[smileIdx], target, Math.min(1, dt * 4)
                    )
                }
            }
        })

        // ── Proximity glow on model meshes ──
        clone.traverse((child) => {
            if (child.isMesh && child.material) {
                if (nearNow || isTalking) {
                    child.material.emissiveIntensity = THREE.MathUtils.lerp(
                        child.material.emissiveIntensity || 0, 0.12, Math.min(1, dt * 4)
                    )
                    if (!child.material.emissive || child.material.emissive.r === 0) {
                        child.material.emissive = new THREE.Color(0.2, 0.5, 1.0)
                    }
                } else {
                    child.material.emissiveIntensity = THREE.MathUtils.lerp(
                        child.material.emissiveIntensity || 0, 0, Math.min(1, dt * 4)
                    )
                }
            }
        })
    })

    return (
        <group ref={group} position={position} dispose={null}>
            <primitive object={clone} />

            {/* PUBG Talk Prompt – only when near & not yet chatting */}
            {isNear && !isTalking && (
                <TalkPrompt onTalk={handleTalk} />
            )}

        </group>
    )
}

useGLTF.preload('/models/character.glb')
