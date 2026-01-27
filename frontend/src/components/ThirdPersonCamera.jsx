import { useFrame } from '@react-three/fiber'
import { useExperienceStore } from '../store/experienceStore'
import * as THREE from 'three'

export default function ThirdPersonCamera() {
  const userPosition = useExperienceStore((state) => state.userPosition)
  const userRotation = useExperienceStore((state) => state.userRotation)
  const cameraRotation = useExperienceStore((state) => state.cameraRotation)
  const isSitting = useExperienceStore((state) => state.isSitting)

  useFrame(({ camera }) => {
    // Premium smooth first-person / slow third-person camera
    const height = isSitting ? 1.2 : 1.6
    const distance = isSitting ? 2 : 3.5
    
    const offset = new THREE.Vector3(0, height, distance)
    offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), userRotation[1] + cameraRotation[1])
    
    const targetPosition = new THREE.Vector3(...userPosition).add(offset)
    const lookAtPosition = new THREE.Vector3(...userPosition).add(new THREE.Vector3(0, height - 0.3, 0))

    // Ultra-smooth camera movement (professional feel)
    camera.position.lerp(targetPosition, 0.08)
    
    // Smooth look-at with slight damping
    const currentLookAt = new THREE.Vector3()
    camera.getWorldDirection(currentLookAt)
    currentLookAt.multiplyScalar(10).add(camera.position)
    const smoothLookAt = currentLookAt.lerp(lookAtPosition, 0.1)
    camera.lookAt(smoothLookAt)
  })

  return null
}
