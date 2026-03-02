import React, { useRef, useState, useEffect, useMemo } from 'react'
import { Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useExperienceStore } from '../store/experienceStore'
import * as THREE from 'three'
import './Interactable.css'

export default function Interactable({
    position,
    triggerRadius = 2.5,
    actionName = "Interact",
    onInteract,
    labelOffset = [0, 1.2, 0]
}) {
    const userPosition = useExperienceStore((state) => state.userPosition)
    const [isNear, setIsNear] = useState(false)
    const [isPressed, setIsPressed] = useState(false)
    const vec = useRef(new THREE.Vector3())
    const posVec = useMemo(() => new THREE.Vector3(...position), [position])

    const activate = () => {
        if (!isNear || !onInteract) return
        setIsPressed(true)
        onInteract()
        setTimeout(() => setIsPressed(false), 200)
    }

    useFrame(() => {
        if (!userPosition) return
        vec.current.set(userPosition[0], userPosition[1], userPosition[2])
        const dist = vec.current.distanceTo(posVec)

        if (dist < triggerRadius && !isNear) {
            setIsNear(true)
        } else if (dist >= triggerRadius && isNear) {
            setIsNear(false)
        }
    })

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (isNear && (e.key.toLowerCase() === 'e' || e.code === 'KeyE')) {
                activate()
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [isNear, onInteract])

    if (!isNear) return null

    return (
        <group position={[position[0] + labelOffset[0], position[1] + labelOffset[1], position[2] + labelOffset[2]]}>
            <Html center zIndexRange={[100, 0]}>
                <div
                    className={`pubg-interact-zone ${isPressed ? 'pressed' : ''}`}
                    onClick={(e) => { e.stopPropagation(); activate() }}
                    onPointerDown={(e) => { e.stopPropagation(); activate() }}
                    onTouchStart={(e) => { e.stopPropagation(); activate() }}
                >
                    <div className="pubg-key-indicator">E</div>
                    <span className="pubg-action-text">{actionName}</span>
                </div>
            </Html>
        </group>
    )
}
