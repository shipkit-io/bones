'use client'

import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { useEffect, useState } from 'react'
import { getDependencies, getInstalledComponents } from '../_actions/registry'
import type { RegistryItem } from '../_lib/types'
import type { StyleMode } from './types'

interface ComponentStatsProps {
	component: RegistryItem
	currentStyle: StyleMode
}

interface DependencyStats {
	total: number
	installed: number
	missing: string[]
}

interface DependencyData {
	dependencies: Record<string, string>
	devDependencies: Record<string, string>
}

interface Stats {
	dependencies: DependencyStats
	registryDependencies: DependencyStats
	installedComponents: string[]
}

export function ComponentStats({ component, currentStyle }: ComponentStatsProps) {
	const [stats, setStats] = useState<Stats | null>(null)

	useEffect(() => {
		const loadStats = async () => {
			if (!component) return

			try {
				const [depsData, components] = await Promise.all([
					getDependencies(),
					getInstalledComponents()
				])

				const allDeps = { ...depsData.dependencies, ...depsData.devDependencies }

				// Check dependencies
				const dependencies: DependencyStats = {
					total: component.dependencies?.length || 0,
					installed: 0,
					missing: []
				}

				if (component.dependencies) {
					for (const dep of component.dependencies) {
						const parts = dep.split('@')
						const name = parts[0]
						if (name && name in allDeps) {
							dependencies.installed++
						} else {
							dependencies.missing.push(dep)
						}
					}
				}

				// Check registry dependencies
				const registryDependencies: DependencyStats = {
					total: component.registryDependencies?.length || 0,
					installed: 0,
					missing: []
				}

				if (component.registryDependencies) {
					for (const dep of component.registryDependencies) {
						if (components.includes(dep)) {
							registryDependencies.installed++
						} else {
							registryDependencies.missing.push(dep)
						}
					}
				}

				setStats({
					dependencies,
					registryDependencies,
					installedComponents: components
				})
			} catch (err) {
				console.error('Failed to load stats:', err)
			}
		}

		loadStats()
	}, [component])

	if (!component || !stats) {
		return null
	}

	return (
		<div className="grid gap-4 md:grid-cols-2">
			{/* Dependencies */}
			<Card className={cn(
				"p-4",
				currentStyle === 'brutalist'
					? 'border-2 border-primary rounded-none'
					: 'border rounded-md'
			)}>
				<h3 className="font-semibold">Dependencies</h3>
				<div className="mt-2">
					<div className="mb-2 flex items-center justify-between text-sm">
						<span>
							{stats.dependencies.installed} / {stats.dependencies.total} installed
						</span>
						<span className="text-muted-foreground">
							{stats.dependencies.total
								? Math.round(
									(stats.dependencies.installed / stats.dependencies.total) * 100
								)
								: 100}
							%
						</span>
					</div>
					<Progress
						value={stats.dependencies.total
							? (stats.dependencies.installed / stats.dependencies.total) * 100
							: 100}
						className={cn(
							currentStyle === 'brutalist'
								? 'h-2 rounded-none'
								: 'h-2 rounded-full'
						)}
					/>
				</div>
				{stats.dependencies.missing.length > 0 && (
					<div className="mt-4">
						<p className="text-sm text-muted-foreground">Missing dependencies:</p>
						<div className="mt-1 space-x-1">
							{stats.dependencies.missing.map(dep => (
								<span
									key={dep}
									className={cn(
										"inline-flex items-center px-2.5 py-0.5 text-xs font-semibold text-destructive",
										currentStyle === 'brutalist'
											? 'border-2 border-destructive rounded-none'
											: 'border border-destructive/50 rounded-full'
									)}
								>
									{dep}
								</span>
							))}
						</div>
					</div>
				)}
			</Card>

			{/* Registry Dependencies */}
			<Card className={cn(
				"p-4",
				currentStyle === 'brutalist'
					? 'border-2 border-primary rounded-none'
					: 'border rounded-md'
			)}>
				<h3 className="font-semibold">Registry Dependencies</h3>
				<div className="mt-2">
					<div className="mb-2 flex items-center justify-between text-sm">
						<span>
							{stats.registryDependencies.installed} / {stats.registryDependencies.total} installed
						</span>
						<span className="text-muted-foreground">
							{stats.registryDependencies.total
								? Math.round(
									(stats.registryDependencies.installed / stats.registryDependencies.total) * 100
								)
								: 100}
							%
						</span>
					</div>
					<Progress
						value={stats.registryDependencies.total
							? (stats.registryDependencies.installed / stats.registryDependencies.total) * 100
							: 100}
						className={cn(
							currentStyle === 'brutalist'
								? 'h-2 rounded-none'
								: 'h-2 rounded-full'
						)}
					/>
				</div>
				{stats.registryDependencies.missing.length > 0 && (
					<div className="mt-4">
						<p className="text-sm text-muted-foreground">Missing components:</p>
						<div className="mt-1 space-x-1">
							{stats.registryDependencies.missing.map(dep => (
								<span
									key={dep}
									className={cn(
										"inline-flex items-center px-2.5 py-0.5 text-xs font-semibold text-destructive",
										currentStyle === 'brutalist'
											? 'border-2 border-destructive rounded-none'
											: 'border border-destructive/50 rounded-full'
									)}
								>
									{dep}
								</span>
							))}
						</div>
					</div>
				)}
			</Card>
		</div>
	)
}

