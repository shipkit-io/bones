import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Sphere, Ring } from '@react-three/drei'
import * as THREE from 'three'

const createPlanetTexture = (color1: string, color2: string, noiseScale: number) => {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 512
  const ctx = canvas.getContext('2d')!
  const imageData = ctx.createImageData(512, 512)
  const data = imageData.data

  for (let i = 0; i < data.length; i += 4) {
    const x = (i / 4) % 512
    const y = Math.floor(i / 4 / 512)
    const noise = Math.random() * noiseScale

    const c1 = new THREE.Color(color1)
    const c2 = new THREE.Color(color2)
    const mixFactor = (Math.sin(x * 0.1) + Math.sin(y * 0.1)) * 0.25 + 0.5 + noise

    const color = new THREE.Color().lerpColors(c1, c2, mixFactor)
    data[i] = color.r * 255
    data[i + 1] = color.g * 255
    data[i + 2] = color.b * 255
    data[i + 3] = 255
  }

  ctx.putImageData(imageData, 0, 0)
  return new THREE.CanvasTexture(canvas)
}

const Planet = ({ position, size, colors, atmosphereColor, ringColor, speed }: any) => {
  const planetRef = useRef<THREE.Mesh>(null!)
  const atmosphereRef = useRef<THREE.Mesh>(null!)
  const ringRef = useRef<THREE.Mesh>(null!)
  
  const texture = useMemo(() => createPlanetTexture(colors[0], colors[1], 0.2), [colors])

  const atmosphereMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        color: { value: new THREE.Color(atmosphereColor) },
        viewVector: { value: new THREE.Vector3() }
      },
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 color;
        uniform vec3 viewVector;
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.7 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
          gl_FragColor = vec4(color, 1.0) * intensity;
        }
      `,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true
    })
  }, [atmosphereColor])

  useFrame((state) => {
    const t = state.clock.getElapsedTime() * speed
    planetRef.current.position.x = Math.cos(t) * position[0]
    planetRef.current.position.z = Math.sin(t) * position[2]
    planetRef.current.rotation.y += 0.005

    if (atmosphereRef.current) {
      atmosphereRef.current.position.copy(planetRef.current.position)
    }
    if (ringRef.current) {
      ringRef.current.position.copy(planetRef.current.position)
      ringRef.current.rotation.x = Math.PI / 2
    }
  })

  return (
    <group>
      <Sphere ref={planetRef} args={[size, 64, 64]} position={position}>
        <meshStandardMaterial map={texture} roughness={0.7} metalness={0.3} />
      </Sphere>
      {atmosphereColor && (
        <Sphere ref={atmosphereRef} args={[size * 1.1, 64, 64]} position={position}>
          <primitive object={atmosphereMaterial} attach="material" />
        </Sphere>
      )}
      {ringColor && (
        <Ring ref={ringRef} args={[size * 1.4, size * 1.8, 64]} position={position}>
          <meshBasicMaterial color={ringColor} side={THREE.DoubleSide} transparent opacity={0.7} />
        </Ring>
      )}
    </group>
  )
}

export default function Planets() {
  return (
    <>
      <Planet 
        position={[10, 0, 0]} 
        size={0.8} 
        colors={['#ff4500', '#ff8c00']} 
        atmosphereColor="#ff6a4d" 
        speed={0.5} 
      />
      <Planet 
        position={[-15, 2, 5]} 
        size={1.2} 
        colors={['#cd853f', '#d2691e']} 
        atmosphereColor="#ffa500" 
        speed={0.3} 
      />
      <Planet 
        position={[20, -3, -10]} 
        size={1.5} 
        colors={['#ffd700', '#daa520']} 
        ringColor="#a88c77" 
        atmosphereColor="#ffd700" 
        speed={0.2} 
      />
      <Planet 
        position={[-25, 5, 15]} 
        size={0.6} 
        colors={['#4169e1', '#1e90ff']} 
        atmosphereColor="#4169e1" 
        speed={0.4} 
      />
    </>
  )
}

