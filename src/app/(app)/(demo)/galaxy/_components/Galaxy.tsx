import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export default function Galaxy() {
  const points = useRef<THREE.Points>(null!)
  const particlesPosition = useMemo(() => {
    const positions = new Float32Array(10000 * 3)
    const p = new THREE.Vector3()
    for (let i = 0; i < 10000; i++) {
      const theta = 2 * Math.PI * Math.random()
      const phi = Math.acos(2 * Math.random() - 1)
      const radius = Math.pow(Math.random(), 0.5) * 25
      p.set(
        radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.sin(phi) * Math.sin(theta),
        radius * Math.cos(phi)
      )
      positions.set([p.x, p.y, p.z], i * 3)
    }
    return positions
  }, [])

  useFrame((state) => {
    const t = state.clock.getElapsedTime() * 0.1
    points.current.rotation.y = t * 0.05
  })

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particlesPosition.length / 3}
          array={particlesPosition}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.015} color="#ffffff" sizeAttenuation={true} depthWrite={false} />
    </points>
  )
}

