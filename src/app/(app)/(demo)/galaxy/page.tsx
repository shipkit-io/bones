'use client'

import { OrbitControls, Stars } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { Bloom, EffectComposer } from '@react-three/postprocessing'
import dynamic from 'next/dynamic'
import { Suspense } from 'react'

const Galaxy = dynamic(() => import('./_components/Galaxy'), { ssr: false })
const Planets = dynamic(() => import('./_components/Planets'), { ssr: false })
const Nebula = dynamic(() => import('./_components/Nebula'), { ssr: false })

export default function CosmicExplorer() {
	return (
		<div className="w-full h-screen bg-black">
			<Canvas camera={{ position: [0, 0, 50], fov: 60 }}>
				<Suspense fallback={null}>
					<Stars radius={300} depth={50} count={5000} factor={4} />
					<Galaxy />
					<Planets />
					<Nebula />
					<OrbitControls enableZoom={false} enablePan={false} enableRotate={true} />
					<EffectComposer>
						<Bloom luminanceThreshold={0} luminanceSmoothing={0.9} height={300} />
					</EffectComposer>
				</Suspense>
			</Canvas>
		</div>
	)
}

