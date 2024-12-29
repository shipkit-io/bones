import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragmentShader = `
  uniform float time;
  varying vec2 vUv;
  
  float noise(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    vec2 c = vec2(0, 1);
    return mix(
      mix(mix(dot(random3(i + c.xxx), f - c.xxx), dot(random3(i + c.yxx), f - c.yxx), f.x),
          mix(dot(random3(i + c.xyx), f - c.xyx), dot(random3(i + c.yyx), f - c.yyx), f.x), f.y),
      mix(mix(dot(random3(i + c.xxy), f - c.xxy), dot(random3(i + c.yxy), f - c.yxy), f.x),
          mix(dot(random3(i + c.xyy), f - c.xyy), dot(random3(i + c.yyy), f - c.yyy), f.x), f.y), f.z
    );
  }
  
  vec3 random3(vec3 c) {
    float j = 4096.0*sin(dot(c,vec3(17.0, 59.4, 15.0)));
    vec3 r;
    r.z = fract(512.0*j);
    j *= .125;
    r.x = fract(512.0*j);
    j *= .125;
    r.y = fract(512.0*j);
    return r-0.5;
  }
  
  void main() {
    vec2 uv = vUv * 2.0 - 1.0;
    vec3 color = vec3(0.0);
    
    for (float i = 1.0; i < 4.0; i++) {
      vec2 q = uv * (1.0 + i * 0.1);
      q += vec2(q.y * 2.0, -q.x * 5.0) * time * 0.01;
      float strength = length(q);
      float x = noise(vec3(q, time * 0.1));
      x = sin(x * 3.0 + time * 2.0);
      float y = noise(vec3(q, x));
      vec3 nebula = vec3(1.0 / (1.0 + 32.0 * pow(length(q), 2.0)));
      nebula *= vec3(2.0 + sin(time * 0.5), 2.0 + cos(time * 0.3), 2.0 + sin(time * 0.2)) * 0.5;
      color += nebula * (1.5 + y);
    }
    
    color *= 0.6;
    gl_FragColor = vec4(color, 1.0);
  }
`

export default function Nebula() {
  const mesh = useRef<THREE.Mesh>(null!)
  const uniforms = useMemo(() => ({
    time: { value: 0 }
  }), [])

  useFrame((state) => {
    const { clock } = state
    mesh.current.material.uniforms.time.value = clock.getElapsedTime()
  })

  return (
    <mesh ref={mesh} scale={[100, 100, 1]} position={[0, 0, -50]}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        fragmentShader={fragmentShader}
        vertexShader={vertexShader}
        uniforms={uniforms}
        transparent
      />
    </mesh>
  )
}

